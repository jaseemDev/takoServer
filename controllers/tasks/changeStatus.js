import asyncHandler from "express-async-handler";
import buildLogMeta from "../../utils/logMeta.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import User from "../../models/user/userSchema.js";
import Task from "../../models/task/taskSchema.js";
import Status from "../../models/status/statusSchema.js";
import { sendBadRequestRes } from "../../utils/responses/sendBadRequestRes.js";

const changeStatus = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { taskId, statusId, userId } = req.body;

  const logMeta = buildLogMeta(req);

  logger.info("Attempt to change status", logMeta);

  const sanitizedData = {
    taskId: taskId?.trim(),
    statusId: statusId?.trim(),
    userId: userId?.trim(),
  };

  if (
    !sanitizedData.taskId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.taskId)
  ) {
    sendBadRequestRes(res, { ...logMeta, taskId: taskId }, "taskId");
    return;
  }
  if (
    !sanitizedData.statusId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.statusId)
  ) {
    sendBadRequestRes(res, { ...logMeta, statusId: statusId }, "statusId");
    return;
  }
  if (
    !sanitizedData.userId ||
    !mongoose.Types.ObjectId.isValid(sanitizedData.userId)
  ) {
    sendBadRequestRes(res, { ...logMeta, userId: userId }, "userId");
    return;
  }

  const user = await User.findById(sanitizedData.userId).select("role").lean();
  if (!user) {
    logger.error("NOT_FOUND: No such user found", {
      ...logMeta,
      userId: sanitizedData.userId,
      processingTime: Date.now() - startTime,
    });
    return res.status(404).json({
      code: "NOT_FOUND",
      success: false,
      message: "No such user found",
      data: null,
    });
  }
  if (user.role === "requester") {
    logger.error("FORBIDDEN: You are not authorized to change status", {
      ...logMeta,
      userId: sanitizedData.userId,
      processingTime: Date.now() - startTime,
    });
    return res.status(403).json({
      code: "FORBIDDEN",
      success: false,
      message: "You are not authorized to change status",
      data: null,
    });
  }

  const task = await Task.findById(sanitizedData.taskId).lean();
  if (!task) {
    logger.error("NOT_FOUND: No such task found", {
      ...logMeta,
      taskId: sanitizedData.taskId,
      processingTime: Date.now() - startTime,
    });
    return res.status(404).json({
      code: "NOT_FOUND",
      success: false,
      message: "No such task found",
      data: null,
    });
  }

  // Compare status as strings to handle ObjectId equality
  if (String(task.status) === String(sanitizedData.statusId)) {
    logger.error("UNPROCESSABLE_ENTITY: Cannot update with same status", {
      ...logMeta,
      taskId: sanitizedData.taskId,
      processingTime: Date.now() - startTime,
    });
    return res.status(422).json({
      code: "UNPROCESSABLE_ENTITY",
      success: false,
      message: "Cannot update with same status",
      data: null,
    });
  }

  const status = await Status.findById(sanitizedData.statusId).lean();
  if (!status) {
    logger.error("NOT_FOUND: No such status found", {
      ...logMeta,
      statusId: sanitizedData.statusId,
      processingTime: Date.now() - startTime,
    });
    return res.status(404).json({
      code: "NOT_FOUND",
      success: false,
      message: "No such status found",
      data: null,
    });
  }

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      sanitizedData.taskId,
      {
        status: sanitizedData.statusId,
      },
      { new: true }
    ).populate("status", "name color");
    logger.info("SUCCESS: Task status changed successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });

    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Task status changed successfully",
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
      message: "Something went wrong while changing the task status",
      data: null,
    });
  }
});

export default changeStatus;
