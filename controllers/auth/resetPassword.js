// Import required modules and utilities
import Auth from "../../models/auth/authSchema.js";
import logger from "../../utils/logger.js";
import bcrypt from "bcrypt";
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../../models/user/userSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to handle password reset requests
export const resetPassword = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract reset token and new password from request body
  const { resetToken, password } = req.body;

  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req);

  logger.info("Attempt to reset password", logMeta);

  // Validate required inputs
  if (!resetToken || !password) {
    logger.error("Bad request", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "All inputs are required",
      data: null,
    });
  }

  // Sanitize input data
  const sanitizedData = {
    resetToken: resetToken.trim(),
    password: password.trim(),
  };

  // Hash the reset token for secure comparison
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(sanitizedData.resetToken)
    .digest("hex");

  try {
    // Find user with valid reset token and non-expired token
    const user = await Auth.findOne({
      resetToken: hashedResetToken,
      resetTokenExpiration: { $gt: new Date() },
    }).select("userId resetToken resetTokenExpiration status");
    if (!user) {
      // If no valid user/token found, return error
      logger.error("No valid token found", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });

      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "Invalid or expired page",
        data: null,
      });
    }

    const userId = user.userId;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(sanitizedData.password, 10);
    // Update user's password and clear reset token fields
    user.passwordHash = hashedPassword;
    user.resetToken = "";
    user.resetTokenExpiration = "";
    if (user.status === "pending") {
      user.status = "active"; //  activate user if they are pending
    }
    await user.save();
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isActive: true, // Ensure user is active
        },
      },
      { new: true }
    );

    // Log successful password reset
    logger.info("New password updated successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
      userId: user.userId,
      status: "success",
    });
    // Respond with success
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "New password updated successfully",
      data: null,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error(error.message || "Internal server error", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: error.message || "Something went wrong while setting password",
      data: null,
    });
  }
});
