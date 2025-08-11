import asyncHandler from "express-async-handler";
import buildLogMeta from "../../utils/logMeta.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import Task from "../../models/task/taskSchema.js";
import User from "../../models/user/userSchema.js";

// Controller to assign a task to a user
const assignTasks = asyncHandler(async (req, res) => {
  // Start timer for logging
  const startTime = Date.now();

  // Build log metadata for tracing
  const logMeta = buildLogMeta(req);
  const { taskId, userId } = req.body;

  logger.info("Attempt to assign task to a user", logMeta);

  // Extract and sanitize input data
  const sanitizedData = {
    taskId: taskId?.trim(),
    userId: userId?.trim(),
  };

  // Validate taskId and userId
  if (
    !sanitizedData.taskId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.taskId)
  ) {
    logger.error("BAD_REQUEST: Missing or invalid task id", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Missing or invalid task id",
      data: null,
    });
  }

  if (
    !sanitizedData.userId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.userId)
  ) {
    logger.error("BAD_REQUEST: Missing or invalid user id", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Missing or invalid user id",
      data: null,
    });
  }

  try {
    // Find user and task documents
    const user = await User.findById(sanitizedData.userId)
      .select("role name")
      .lean();
    const task = await Task.findById(sanitizedData.taskId)
      .select("assignedTo, createdBy")
      .lean();

    // Check if user exists
    if (!user) {
      logger.error("NOT_FOUND: No such user found to assign task", logMeta);
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such user found to assign task",
        data: null,
      });
    }

    // Check if task exists
    if (!task) {
      logger.error("NOT_FOUND: Task not found", logMeta);
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "Task not found",
        data: null,
      });
    }

    // Prevent assigning task to a requester
    if (user.role === "requester") {
      logger.error(
        "UNPROCESSABLE_ENTITY: You cannot assign task to a requester",
        logMeta
      );
      return res.status(422).json({
        code: "UNPROCESSABLE_ENTITY",
        success: false,
        message: "You cannot assign task to a requester",
        data: null,
      });
    }

    // Prevent assigning task to the creator
    if (userId === task.createdBy) {
      logger.error("BAD_REQUEST: You cannot assign task to yourself", logMeta);
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "You cannot assign task to yourself",
        data: null,
      });
    }

    // Update the task's assignedTo field
    const updatedTask = await Task.findByIdAndUpdate(
      sanitizedData.taskId,
      { assignedTo: sanitizedData.userId },
      { new: true }
    ).populate("assignedTo", "_id name email");

    // Log successful assignment
    logger.info("Task assigned successfully", {
      ...logMeta,
      taskId: updatedTask._id,
      assignedTo: updatedTask.assignedTo,
      processingTime: Date.now() - startTime,
    });

    // Respond with updated task data
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Task successfully assigned",
      data: updatedTask,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("INTERNAL_SERVER_ERROR", {
      ...logMeta,
      error: error.message,
    });

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Something went wrong while assigning the task",
      data: null,
    });
  }
});

export default assignTasks;
