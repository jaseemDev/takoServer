// Import required modules and utilities
import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to fetch all users created by a specific manager
const fetchAllUsersByManagerId = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // Extract managerId, limit, and offset from request parameters
  const { managerId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  // Sanitize managerId input
  const sanitizedManagerId = managerId?.trim();

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req, {
    managerId: sanitizedManagerId,
  });

  // Log the fetch attempt
  logger.info("Attempt to fetch all users by manager ID", logMeta);

  // Validate that managerId is provided and is a valid ObjectId
  if (
    !sanitizedManagerId ||
    !mongoose.Types.ObjectId.isValid(sanitizedManagerId)
  ) {
    logger.warn("Invalid or missing manager ID", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid or missing manager ID",
      data: null,
    });
  }

  try {
    // Query users created by the given managerId, with pagination and sorting
    const users = await User.find({
      createdBy: sanitizedManagerId,
      role: "executor",
    }) // fetch only executor users
      .select("_id name email mobile role isActive")
      .limit(parseInt(parsedLimit))
      .skip(parseInt(parsedOffset))
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean();

    const total = await User.countDocuments({
      createdBy: sanitizedManagerId,
    });

    // If no users found, return 404
    if (users.length === 0) {
      logger.info("No users found for the given manager ID", logMeta);
      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message: "No users found for the given manager ID",
        data: {
          users: [],
          total,
          limit: parsedLimit,
          offset: parsedOffset,
        },
      });
    }

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
        total: total,
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
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "An error occurred while fetching users",
      data: null,
    });
  }
});

export default fetchAllUsersByManagerId;
