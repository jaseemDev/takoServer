// Import required modules and utilities
import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to handle user update requests
export const updateUser = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract user details from request body
  const { userId, name, email, mobile, role } = req.body;

  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req);

  // Log the update attempt
  logger.info("Attempt to update user", { ...logMeta, userId });

  // Validate that userId is provided
  if (!userId) {
    logger.error("Missing user id");
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "User ID is required",
      data: null,
    });
  }
  // Sanitize input data
  const sanitizedData = {
    name: name.trim(),
    email: email.trim(),
    mobile: mobile.trim(),
    role: role.trim(),
  };

  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      // If user not found, return error
      logger.error("User not found", { ...logMeta, userId });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "User not found",
        data: null,
      });
    }
    // Update user document with new data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          mobile: sanitizedData.mobile,
          role: sanitizedData.role,
        },
      },
      { new: true }
    );
    // Log successful update
    logger.info("User updated successfully", {
      ...logMeta,
      userId,
      processingTime: Date.now() - startTime,
    });

    // Respond with updated user data
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Handle duplicate key error (email or mobile already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        code: "DUPLICATE_KEY",
        success: false,
        message: "Email or mobile already exists",
        data: null,
      });
    }
    // Handle and log other server errors
    logger.error("Error updating user", {
      ...logMeta,
      userId,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Error updating user",
      data: null,
    });
  }
});
