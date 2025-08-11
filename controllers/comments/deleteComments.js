import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import logger from "../../utils/logger.js";
import buildLogMeta from "../../utils/logMeta.js";
import { sendBadRequestRes } from "../../utils/responses/sendBadRequestRes.js";

const deleteComments = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { commentId, taskId, ...rest } = req.body;
  const logMeta = buildLogMeta(req);

  // Only allow commentId and taskId in the request body
  if (
    Object.keys(rest).length > 0 ||
    !("commentId" in req.body) ||
    !("taskId" in req.body)
  ) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Request body must contain only 'commentId' and 'taskId'",
      data: null,
    });
  }

  // Validate commentId
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    sendBadRequestRes(res, { ...logMeta, commentId }, "commentId");
    return;
  }
  // Validate taskId
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    sendBadRequestRes(res, { ...logMeta, taskId }, "taskId");
    return;
  }

  try {
    // Import Task model here to avoid circular dependencies
    const Task = (await import("../../models/task/taskSchema.js")).default;

    // Check if task exists
    const task = await Task.findById(taskId).select("_id comments");
    if (!task) {
      logger.error("NOT_FOUND: No such task found", {
        ...logMeta,
        taskId,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such task found",
        data: null,
      });
    }

    // Check if comment exists in the task
    const commentExists = task.comments.some(
      (c) => String(c._id) === String(commentId)
    );
    if (!commentExists) {
      logger.error("NOT_FOUND: No such comment found in the task", {
        ...logMeta,
        commentId,
        taskId,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such comment found in the task",
        data: null,
      });
    }

    // Remove the comment from the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    ).populate({
      path: "comments.user",
      select: "_id name email",
    });

    logger.info("Comment deleted from task successfully", {
      ...logMeta,
      commentId,
      taskId,
      processingTime: Date.now() - startTime,
    });

    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Comment deleted from task successfully",
      data: updatedTask,
    });
  } catch (error) {
    logger.error("INTERNAL_SERVER_ERROR", {
      ...logMeta,
      error: error.message,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Something went wrong while deleting the comment",
      data: null,
    });
  }
});

export default deleteComments;
