import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";

export const updateUserStatus = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract userId and status from request body
  const { userId, isActive } = req.body;

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req, { userId, isActive });
  logger.info("Attempt to update user status", logMeta);

  // Validate that userId and status are provided
  if (
    !userId ||
    typeof isActive !== "boolean" ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    logger.warn("Missing user ID or status", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "User ID and status are required",
      data: null,
    });
  }

  try {
    // Find user by ID and update their status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, select: "_id name email mobile role isActive" }
    );

    // If user not found, return 404
    if (!updatedUser) {
      logger.error("User not found", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Log successful update
    logger.info("User status updated successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });

    // Respond with updated user data
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user status", {
      ...logMeta,
      message: error.message,
      error: error.stack,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Error updating user status",
      data: null,
    });
  }
});
