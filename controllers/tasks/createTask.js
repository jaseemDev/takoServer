// Controller to handle creation of a new task (including self tasks)
import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import Task from "../../models/task/taskSchema.js";
import Tags from "../../models/tags/tagsSchema.js";
import Status from "../../models/status/statusSchema.js";
import SelfTask from "../../models/task/selfTasks/selfTasksSchema.js";
import User from "../../models/user/userSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

export const createTask = asyncHandler(async (req, res) => {
  // Start timer for logging
  const startTime = Date.now();

  // Extract task details from request body
  const {
    title,
    description,
    priority,
    dueDate,
    tags,
    createdBy,
    isSelf,
    assignedTo,
  } = req.body;

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req, { title });
  logger.info("Attempt to create a new task", logMeta);

  // Basic validation for required fields
  const requiredFields = [
    "title",
    "description",
    "priority",
    "dueDate",
    "tags",
    "createdBy",
    "isSelf",
    "assignedTo",
  ];
  const missingFields = requiredFields.filter(
    (field) =>
      req.body[field] === "" ||
      req.body[field] === null ||
      req.body[field] === undefined
  );

  if (missingFields.length > 0) {
    logger.error(
      `BAD_REQUEST: Missing required fields : ${missingFields.join(", ")}`,
      { ...logMeta, requiredFields: missingFields.join(", ") }
    );
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
      data: null,
    });
  }

  // Validate createdBy as a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(createdBy)) {
    logger.error("BAD_REQUEST: Invalid ObjectId format for createdBy", {
      ...logMeta,
      createdBy: createdBy,
    });
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid ObjectId format for createdBy",
      data: null,
    });
  }
  // Validate assigned as a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    logger.error("BAD_REQUEST: Invalid ObjectId format for assigned to", {
      ...logMeta,
      assignedTo: assignedTo,
    });
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid ObjectId format for Assigned to",
      data: null,
    });
  }

  // Validate isSelf is a boolean
  if (typeof isSelf !== "boolean") {
    logger.error("BAD_REQUEST: isSelf must be a boolean value", {
      ...logMeta,
      isSelf: isSelf,
    });
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "isSelf must be a boolean value",
      data: null,
    });
  }

  // Sanitize tags and input data
  const sanitizedTags = tags.map((tag) => tag.trim());
  const sanitizedData = {
    title: title.trim(),
    description: description.trim(),
    priority: priority.trim(),
    tags: sanitizedTags,
    dueDate: new Date(dueDate),
    createdBy: createdBy.trim(),
    assignedTo: assignedTo.trim(),
  };

  // Ensure at least one tag is provided
  if (sanitizedTags.length < 1) {
    logger.error("BAD_REQUEST: At least one tag is required", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "At least one tag is required",
      data: null,
    });
  }

  // Fetch default status 'New'
  const statusNew = await Status.findOne({ name: "New" }).select("_id");
  if (!statusNew) {
    logger.error("BAD_REQUEST: Default status 'New' not found", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Default status 'New' not found",
      data: null,
    });
  }

  // Fetch tag documents for provided tag names
  const taskTags = await Tags.find({ label: { $in: sanitizedTags } });
  if (taskTags.length !== sanitizedTags.length) {
    logger.error("BAD_REQUEST: One or more tag names are invalid", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "One or more tag names are invalid",
      data: null,
    });
  }

  if (sanitizedData.createdBy === sanitizedData.assignedTo) {
    logger.error("BAD_REQUEST: You cannot assign task to yourself", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "You cannot assign task to yourself",
      data: null,
    });
  }

  // Fetch user and check role for self task restriction
  const user = await User.findById(sanitizedData.createdBy).select("role");
  const assignee = await User.findById(sanitizedData.assignedTo).select("role");
  if (!user) {
    logger.error(
      "BAD_REQUEST: Cannot create task, User doesn't exists to create",
      logMeta
    );
    return (
      res.status(404),
      json({
        code: "NOT_FOUND",
        success: false,
        message: "User doesn't exists to create task",
        data: null,
      })
    );
  }
  if (!assignee) {
    logger.error(
      "BAD_REQUEST: Cannot create task, User doesn't exists to assign",
      logMeta
    );
    return (
      res.status(404),
      json({
        code: "NOT_FOUND",
        success: false,
        message: "User doesn't exists to assign task",
        data: null,
      })
    );
  }
  if (user.role === "executor" && isSelf !== true) {
    logger.error("BAD_REQUEST: executor cannot create a non-self task");
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "You can only create self tasks",
      data: null,
    });
  }
  if (assignee.role === "requester" && isSelf !== true) {
    logger.error("BAD_REQUEST: You cannot assign task to a requester");
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "You cannot assign task to a requester",
      data: null,
    });
  }

  // Extract tag IDs for saving
  const tagIds = taskTags.map((tag) => tag._id);

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for duplicate task title per user (not deleted)
    const existingTask = await Task.findOne({
      title: sanitizedData.title,
      createdBy: sanitizedData.createdBy,
      isDeleted: false,
    }).session(session);

    if (existingTask && existingTask.isSelf === isSelf) {
      await session.abortTransaction();
      session.endSession();
      logger.error("CONFLICT: You already have a task with this title", {
        ...logMeta,
        incoming: isSelf,
        existing: existingTask.isSelf,
      });
      return res.status(409).json({
        code: "CONFLICT",
        success: false,
        message: "You already have a task with this title",
        data: null,
      });
    }

    // Create new task document
    const newTask = new Task({
      ...sanitizedData,
      status: statusNew._id,
      tags: tagIds,
      isActive: true,
      isDeleted: false,
      isSelf,
    });

    // Save the new task in the transaction
    const savedTask = await newTask.save({ session });

    // If self task, create a self task document
    if (isSelf) {
      const newSelfTask = new SelfTask({
        userId: sanitizedData.createdBy,
        taskId: savedTask._id,
      });
      await newSelfTask.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Populate status and tags for response
    const populatedTask = await Task.findById(savedTask._id)
      .populate("status", "_id name color")
      .populate("tags", "_id label color type")
      .populate("createdBy", "_id name role email")
      .populate("assignedTo", "_id name role email");

    // Log and respond with created task data
    logger.info("CREATED: Task created successfully", {
      ...logMeta,
      taskId: savedTask._id,
      processingTime: Date.now() - startTime,
    });

    return res.status(201).json({
      code: "CREATED",
      success: true,
      message: isSelf
        ? "Self task created successfully"
        : "Task created successfully",
      data: populatedTask,
    });
  } catch (error) {
    // Abort transaction and end session on error
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();

    // Handle duplicate key error
    if (error.code === 11000) {
      logger.error("CONFLICT: Duplicate task found", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });

      return res.status(409).json({
        code: "CONFLICT",
        success: false,
        message: "Task with same title already exists",
        data: null,
      });
    }

    // Handle and log other server errors
    logger.error("INTERNAL_SERVER_ERROR: Error creating task", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Error creating task",
      data: null,
    });
  }
});

export default createTask;
