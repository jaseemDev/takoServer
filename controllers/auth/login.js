import Auth from "../../models/auth/authSchema.js";
import User from "../../models/user/userSchema.js";
import { generateToken } from "../../utils/generateToken.js";
import logger from "../../utils/logger.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { jwtCookieOptions } from "../../utils/cookieOptions.js";
import buildLogMeta from "../../utils/logMeta.js";

/**
 * User login controller
 * Handles user authentication by validating credentials and generating JWT tokens
 *
 * @route POST /auth/login
 * @access Public
 * @param {Object} req - Express request object containing email and password in body
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with login status and user data
 */

export const login = asyncHandler(async (req, res) => {
  // Start performance tracking for login process
  const startTime = Date.now();

  // Extract email and password from request body
  const { email, password } = req.body;

  const logMeta = buildLogMeta(req);

  // Log login attempt for security monitoring
  logger.info("User login attempt", { ...logMeta, email });

  // Validate required fields - fallback validation in case middleware validation fails
  if (!email || !password) {
    logger?.warn("Login failed - missing credentials", { ...logMeta, email });
    return res.status(400).json({
      code: "NO_CREDENTIALS",
      data: null,
      success: false,
      message: "Email and password are required",
    });
  }

  // Sanitize input data by trimming whitespace
  const sanitizedData = {
    email: email.trim(),
    password: password.trim(),
  };

  try {
    // Step 1: Find user by email in user collection
    // Select only necessary fields for security and performance
    const user = await User.findOne({ email: sanitizedData?.email }).select(
      "_id role name email role createdBy"
    );

    // Handle case when user doesn't exist
    if (!user) {
      logger.error("User not found", {
        ...logMeta,
        email: sanitizedData.email,
        processingTime: Date.now() - startTime,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "User not found",
        success: false,
        data: null,
      });
    } else {
      // Step 2: Get user authentication data using user ID
      const userId = user._id;
      const auth = await Auth.findOne({ userId: userId }).select(
        "userId passwordHash status lastLogin"
      );

      // Step 3: Verify password and check if auth record exists
      if (
        auth &&
        (await bcrypt.compare(sanitizedData.password, auth.passwordHash))
      ) {
        // Step 4: Check if user account is active
        if (auth.status !== "active") {
          logger?.info("User not active", {
            ...logMeta,
            userId: user._id,
            email: sanitizedData.email,
            processingTime: Date.now() - startTime,
          });

          return res.status(403).json({
            success: false,
            code: "INACTIVE",
            message: "User is not active",
            data: null,
          });
        }

        // Step 5: Successful authentication - log the event
        logger?.info("Login successful", {
          ...logMeta,
          userId: user._id,
          email: sanitizedData.email,
          processingTime: Date.now() - startTime,
        });

        // Update last login timestamp in auth record
        auth.lastLogin = new Date();
        await auth.save();

        // Step 6: Generate JWT token with user data
        const jwtPayload = {
          id: auth.userId,
          role: user.role,
        };
        const jwt = generateToken(jwtPayload);

        // Set JWT token as HTTP-only cookie for security
        res.cookie("token", jwt, jwtCookieOptions);

        // Step 7: Return success response with user data
        return res.status(200).json({
          success: true,
          code: "LOGIN_SUCCESS",
          message: "Login success",
          data: {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
            admin: user.createdBy, // Reference to admin who created this user
            sessionExpiresIn: jwtCookieOptions.maxAge / 1000,
          },
        });
      } else {
        // Step 8: Handle invalid credentials (wrong password or no auth record)
        logger.error("Incorrect email or password", {
          ...logMeta,
          email: sanitizedData.email,
          processingTime: Date.now() - startTime,
        });

        return res.status(400).json({
          code: "INVALID_CREDENTIALS",
          success: false,
          message: "Incorrect email or password",
          data: null,
        });
      }
    }
  } catch (error) {
    // Step 9: Handle any unexpected errors during login process
    logger?.error("Login error", {
      ...logMeta,
      email: sanitizedData.email,
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime,
    });

    // Return generic error message to avoid exposing internal details
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      code: "SERVER_ERROR",
      data: null,
    });
  }
});
