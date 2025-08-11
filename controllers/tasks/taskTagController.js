import asyncHandler from "express-async-handler";
import buildLogMeta from "../../utils/logMeta.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import { sendBadRequestRes } from "../../utils/responses/sendBadRequestRes.js";
import Task from "../../models/task/taskSchema.js";

// Controller to add or remove a tag from a task, ensuring only valid and unique tags are added or removed
const taskTagController = asyncHandler(async (req, res) => {
  // Start timer for logging
  const startTime = Date.now();

  // Destructure tagId, taskId, and action from request body, collect any extra fields
  const { tagId, taskId, action = "add", ...rest } = req.body;

  // Only allow tagId, taskId, and action in the request body
  const allowedFields = ["tagId", "taskId", "action"];
  const extraFields = Object.keys(rest).filter(
    (key) => !allowedFields.includes(key)
  );
  if (
    extraFields.length > 0 ||
    !("tagId" in req.body) ||
    !("taskId" in req.body)
  ) {
    logger.error("BAD_REQUEST: Unexpected fields in request body", {
      ...logMeta,
      receivedFields: Object.keys(req.body),
    });
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message:
        "Request body must contain only 'tagId', 'taskId', and optionally 'action'",
      data: null,
    });
  }

  // Build log metadata for tracing
  const logMeta = buildLogMeta(req);

  logger.info(
    `Attempting to ${action === "remove" ? "remove" : "add"} tag to task`
  );

  // Sanitize input data
  const sanitizedData = {
    tagId: tagId.trim(),
    taskId: taskId.trim(),
  };

  // Validate tagId
  if (
    !sanitizedData.tagId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.tagId)
  ) {
    sendBadRequestRes(res, { ...logMeta, tagId: sanitizedData.tagId }, "tagId");
    return;
  }
  // Validate taskId
  if (
    !sanitizedData.taskId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.taskId)
  ) {
    sendBadRequestRes(
      res,
      { ...logMeta, taskId: sanitizedData.taskId },
      "taskId"
    );
    return;
  }

  try {
    // Find the task by ID
    const task = await Task.findById(sanitizedData.taskId)
      .select("_id tags")
      .lean();
    if (!task) {
      logger.error("NOT_FOUND: No such task found", {
        ...logMeta,
        taskId: sanitizedData.taskId,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such task found",
        data: null,
      });
    }

    if (action === "remove") {
      // Remove the tag from the task's tags array
      const updatedTask = await Task.findByIdAndUpdate(
        sanitizedData.taskId,
        { $pull: { tags: sanitizedData.tagId } },
        { new: true }
      ).populate("tags", "_id label color type");

      // If the tag was not present, return conflict
      if (
        task.tags &&
        !task.tags.some((tag) => String(tag) === String(sanitizedData.tagId))
      ) {
        logger.error("CONFLICT: Tag does not exist in the task", {
          ...logMeta,
          tagId: sanitizedData.tagId,
          taskId: sanitizedData.taskId,
        });
        return res.status(409).json({
          code: "CONFLICT",
          success: false,
          message: "Tag does not exist in the task",
          data: null,
        });
      }

      logger.info("Tag removed from task successfully", {
        ...logMeta,
        tagId: sanitizedData.tagId,
        taskId: sanitizedData.taskId,
        processingTime: Date.now() - startTime,
      });

      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message: "Tag removed from task successfully",
        data: updatedTask,
      });
    } else {
      // Check if the tag already exists before attempting to add
      if (
        task.tags &&
        task.tags.some((tag) => String(tag) === String(sanitizedData.tagId))
      ) {
        logger.error("CONFLICT: Tag already exists in the task", {
          ...logMeta,
          tagId: sanitizedData.tagId,
          taskId: sanitizedData.taskId,
        });
        return res.status(409).json({
          code: "CONFLICT",
          success: false,
          message: "Tag already exists in the task",
          data: null,
        });
      }

      // Add the tag to the task's tags array using $addToSet for atomicity
      const updatedTask = await Task.findByIdAndUpdate(
        sanitizedData.taskId,
        { $addToSet: { tags: sanitizedData.tagId } },
        { new: true }
      ).populate("tags", "_id label color type");

      // Log successful tag addition
      logger.info("Tag added to task successfully", {
        ...logMeta,
        tagId: sanitizedData.tagId,
        taskId: sanitizedData.taskId,
        processingTime: Date.now() - startTime,
      });

      // Respond with updated task data
      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message: "Tag added to task successfully",
        data: updatedTask,
      });
    }
  } catch (error) {
    // Handle and log server errors
    logger.error("INTERNAL_SERVER_ERROR", {
      ...logMeta,
      error: error.message,
    });

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: `Something went wrong while ${
        action === "remove" ? "removing" : "adding"
      } the tag`,
      data: null,
    });
  }
});

export default taskTagController;
