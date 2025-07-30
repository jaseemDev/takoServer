// Import required modules and utilities
import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to fetch all users created by a specific user (admin/manager)
export const fetchAllUsers = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract pagination parameters from query
  const { offset = 0, limit = 10 } = req.query;
  // Parse and sanitize pagination values
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req);
  // Log the fetch attempt
  logger.info("Attempt to fetch all users", logMeta);

  try {
    // Query users created by the given userId, with pagination and sorting
    const users = await User.find()
      .select("_id name email mobile role isActive")
      .limit(parseInt(parsedLimit))
      .skip(parseInt(parsedOffset))
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean();
    // If no users found, return success with empty array
    if (users.length === 0) {
      logger.info("No users found for the given user ID", logMeta);
      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message: "No users found",
        data: [],
      });
    }
    // Get total count of users for pagination
    const total = await User.countDocuments();
    // Log successful fetch
    logger.info("Users fetched successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with users data and pagination info
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
        total,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("Error fetching users", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "SERVER_ERROR",
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
});
