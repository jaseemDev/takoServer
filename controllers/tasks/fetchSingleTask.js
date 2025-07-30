import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import logger from "../../utils/logger.js";
import Task from "../../models/task/taskSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to fetch a single task by its ID, with all related details populated
const fetchSingleTask = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // Extract taskId from request parameters
  const { taskId } = req.params;

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req);

  // Validate that taskId is provided and is a valid ObjectId
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    logger.error("Missing or invalid task id", logMeta);

    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Missing or invalid task id",
      data: null,
    });
  }

  // Find the task by ID and populate related fields
  try {
    const task = await Task.findById(taskId)
      .populate("tags", "_id label color type")
      .populate("status", "_id name color")
      .populate("createdBy", "_id name email")
      .populate("assignedTo", "_id name email")
      .populate("updatedBy", "_id name email")
      .lean();

    // If no task found, return 404
    if (!task) {
      logger.error("NOT_FOUND: No such task found", {
        ...logMeta,
        taskId: taskId,
        processingTime: Date.now() - startTime,
      });

      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such task found",
        data: null,
      });
    }

    // Log successful fetch
    logger.info("SUCCESS: Task fetched successfully", {
      ...logMeta,
      taskId: taskId,
      processingTime: Date.now() - startTime,
    });

    // Respond with the fetched task
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Task successfully fetched",
      data: task,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error(
      "INTERNAL_SERVER_ERROR: Something went wrong while fetching task",
      {
        ...logMeta,
        processingTime: Date.now() - startTime,
        error: error.message,
        stack: error.stack,
      }
    );
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Something went wrong while fetching task",
      data: null,
    });
  }
});

export default fetchSingleTask;
