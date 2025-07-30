// Import required modules and utilities
import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import Status from "../../models/status/statusSchema.js";
import User from "../../models/user/userSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to handle creation of a new status
const createStatus = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract status details from request body
  const { name, color, userId } = req.body;

  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req, { userId: userId ? userId.trim() : null });
  // Log the attempt to create a new status
  logger.info("Attempt to create a new status", logMeta);

  // Validate required fields
  if (!name || !color) {
    logger.error("All fields are required", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "All fields are required",
      data: null,
    });
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    logger.error(
      "Unable to verify user. Missing or invalid identity.",
      logMeta
    );
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Unable to verify user. Missing or invalid identity.",
      data: null,
    });
  }

  // Check if status with the same name already exists
  const existingStatus = await Status.findOne({ name: name.trim() });
  if (existingStatus) {
    logger.error("Status already exists", logMeta);
    return res.status(409).json({
      code: "CONFLICT",
      success: false,
      message: "Status already exists",
      data: null,
    });
  }

  try {
    //check if user creating status is valid admin
    const isValidUser = await User.findOne({
      _id: userId,
      role: "admin",
    });

    if (!isValidUser) {
      logger.error("UNAUTHORIZED: Unauthorized to create status", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });
      return res.status(401).json({
        code: "UNAUTHORIZED",
        success: false,
        message: "Unauthorized to create status",
        data: null,
      });
    }

    // Create new status document with sanitized data
    const newStatus = new Status({
      name: name.trim(),
      color: typeof color === "string" ? color.trim() : "",
    });
    // Save the new status to the database
    await newStatus.save();
    // Log successful status creation
    logger.info("Status created successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with success and created status data
    return res.status(201).json({
      code: "CREATED",
      success: true,
      message: "Status created successfully",
      data: {
        _id: newStatus._id,
        name: newStatus.name,
        color: newStatus.color,
      },
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("Error creating status", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Error creating status",
      data: null,
    });
  }
});

// Export the createStatus function for use in routes
export default createStatus;
