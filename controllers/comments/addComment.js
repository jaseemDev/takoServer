import asyncHandler from "express-async-handler";
import buildLogMeta from "../../utils/logMeta.js";
import mongoose from "mongoose";
import { sendBadRequestRes } from "../../utils/responses/sendBadRequestRes.js";
import logger from "../../utils/logger.js";

const addComment = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  const { comment, userId, taskId, ...rest } = req.body;
  const logMeta = buildLogMeta(req);

  // Only allow comment, userId, and taskId in the request body
  if (
    Object.keys(rest).length > 0 ||
    !("comment" in req.body) ||
    !("userId" in req.body) ||
    !("taskId" in req.body)
  ) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message:
        "Request body must contain only 'comment', 'userId', and 'taskId'",
      data: null,
    });
  }

  // Validate comment
  if (!comment || typeof comment !== "string" || !comment.trim()) {
    sendBadRequestRes(res, { ...logMeta, comment }, "comment");
    return;
  }
  // Validate userId
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    sendBadRequestRes(res, { ...logMeta, userId }, "userId");
    return;
  }
  // Validate taskId
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    sendBadRequestRes(res, { ...logMeta, taskId }, "taskId");
    return;
  }

  const sanitizedData = {
    comment: comment.trim(),
    userId: userId.trim(),
    taskId: taskId.trim(),
  };

  try {
    // Import models here to avoid circular dependencies at the top
    const Task = (await import("../../models/task/taskSchema.js")).default;
    const User = (await import("../../models/user/userSchema.js")).default;

    // Check if task exists
    const task = await Task.findById(sanitizedData.taskId).select("_id");
    if (!task) {
      logger.error("NOT_FOUND: No such task found", {
        ...logMeta,
        taskId: taskId,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such task found",
        data: null,
      });
    }

    // Check if user exists
    const user = await User.findById(sanitizedData.userId).select("_id");
    if (!user) {
      logger.error("NOT_FOUND: No such user found", {
        ...logMeta,
        userId: userId,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No such user found",
        data: null,
      });
    }

    // Add comment to task
    const commentObj = {
      user: sanitizedData.userId,
      comment: sanitizedData.comment,
      createdAt: new Date(),
    };
    const updatedTask = await Task.findByIdAndUpdate(
      sanitizedData.taskId,
      { $push: { comments: commentObj } },
      { new: true }
    ).populate({
      path: "comments.user",
      select: "_id name email",
    });

    logger.info("SUCCESS: Comment added to task successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Comment added to task successfully",
      data: updatedTask,
    });
  } catch (error) {
    // Log and handle server errors
    logger.error("INTERNAL_SERVER_ERROR", logMeta);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Something went wrong while adding the comment",
      data: null,
    });
  }
});

export default addComment;
