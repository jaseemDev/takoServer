// Import required modules and utilities
import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to fetch a single user by their ID
export const fetchSingleUserById = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract userId from request parameters
  const { userId } = req.params;

  // Sanitize userId input
  const sanitizedUserId = userId?.trim();

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req, { userId: sanitizedUserId });
  // Log the fetch attempt
  logger.info("Attempt to fetch user by ID", logMeta);

  // Validate that userId is provided
  if (!sanitizedUserId || !mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
    logger.warn("Invalid or missing user ID", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid or missing user ID",
      data: null,
    });
  }

  try {
    // Find user by ID and select relevant fields
    const user = await User.findById({ _id: sanitizedUserId }).select(
      "_id name email mobile role createdBy createdAt updatedAt"
    );
    // If user not found, return 404
    if (!user) {
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
    // Log successful fetch
    logger.info("User fetched successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with user data
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("Error fetching user", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "An error occurred while fetching the user",
      data: null,
    });
  }
});
