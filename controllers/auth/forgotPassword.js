// Handles forgot password requests: validates user, rate-limits, generates and emails reset link
import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import User from "../../models/user/userSchema.js";
import { addMinutes, differenceInMinutes, isAfter } from "date-fns";
import { sendEmail } from "../../utils/sendMail.js";
import { generateResetToken } from "../../utils/generateResetToken.js";
import Auth from "../../models/auth/authSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

// Main forgot password controller
export const forgotPassword = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // Extract email from request body
  const { email } = req.body;

  // Prepare log metadata for tracing

  const logMeta = buildLogMeta(req);

  // Check if email is provided
  if (!email) {
    logger.warn("Missing email input", { ...logMeta, email });
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Email is required.",
      data: null,
    });
  }

  // Sanitize email input
  const sanitizedEmail = email.toLowerCase().trim();

  logger.info("Forgot password attempt", { ...logMeta, sanitizedEmail });

  try {
    // Find user by email
    const user = await User.findOne({ email: sanitizedEmail }).select(
      "_id isActive"
    );

    // If user not found, return 404
    if (!user) {
      logger.error("User not found", { ...logMeta, sanitizedEmail });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // If user is not active, return 401
    if (!user.isActive) {
      logger.error("User not active", { ...logMeta, sanitizedEmail });
      return res.status(401).json({
        code: "UNAUTHORIZED",
        success: false,
        message: "User not active",
        data: null,
      });
    }

    // Find auth data for user
    const authData = await Auth.findOne({ userId: user._id }).select(
      "userId resetToken resetTokenExpiration"
    );

    // If no auth data, return 403
    if (!authData) {
      logger.error("Invalid user", { ...logMeta, sanitizedEmail });
      return res.status(403).json({
        code: "UNPROCESSABLE_ENTITY",
        success: false,
        message: "Invalid user",
        data: null,
      });
    }

    // Check if a reset token is already active (rate limiting)
    const { resetTokenExpiration } = authData;
    const currentTime = new Date();
    if (resetTokenExpiration && isAfter(resetTokenExpiration, currentTime)) {
      const waitingTime = differenceInMinutes(
        resetTokenExpiration,
        currentTime
      );
      logger.warn("Active token available", {
        ...logMeta,
        sanitizedEmail,
        waitingTime,
      });
      return res.status(429).json({
        code: "TOO_MANY_REQUESTS",
        success: false,
        message: `You already have an active link. Try after ${waitingTime} minutes`,
      });
    } else {
      // Generate new reset token and expiry
      const { resetToken, hashedToken } = await generateResetToken();
      const now = new Date();
      const newExpiry = addMinutes(now, 15);
      // Update auth document with new token and expiry
      await Auth.updateOne(
        { userId: authData.userId }, // filter
        {
          $set: {
            resetToken: hashedToken,
            resetTokenExpiration: newExpiry,
          },
        }
      );
      // Build reset link for frontend
      const resetLink = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
      const message = `Please click the link to reset your password: ${resetLink}`;

      try {
        // Send reset email
        await sendEmail(sanitizedEmail, message);

        logger?.info("Password reset email sent", {
          ...logMeta,
          sanitizedEmail,
          userId: user?._id,
          status: "email_sent",
        });
      } catch (error) {
        // Log email sending error
        logger?.error("Error sending password reset email", {
          ...logMeta,
          sanitizedEmail,
          error,
          userId: user._id,
        });
      }

      // Log successful reset link generation
      logger?.info("Password reset link generated", {
        ...logMeta,
        sanitizedEmail,
        userId: user._id,
        newExpiry,
      });

      // Respond with success
      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message:
          "Password reset link sent successfully to the registered email",
        data: null,
      });
    }
  } catch (error) {
    // Handle server errors
    logger.error(
      "Something went wrong while sending the reset link. Please try again later",
      {
        ...logMeta,
        message: error.message || "Internal server error",
      }
    );

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message:
        "Something went wrong while sending the reset link. Please try again later",
      data: null,
    });
  }
});
