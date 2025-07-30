// Controller to fetch all non-self tasks with optional filters, only for admin users
import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import User from "../../models/user/userSchema.js";
import Task from "../../models/task/taskSchema.js";
import mongoose from "mongoose";
import Tags from "../../models/tags/tagsSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

const fetchAllTasks = asyncHandler(async (req, res) => {
  // Start timer for logging
  const startTime = Date.now();

  // Extract filter and pagination parameters from query
  const {
    userId,
    title,
    createdBy,
    assignedTo,
    dueDate,
    tags,
    priority,
    status,
    updatedBy,
    limit,
    offset,
  } = req.query;

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req);

  // Log the fetch attempt
  logger.info("Attempt to fetch all tasks");

  // Check if userId is provided
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    logger.error("FORBIDDEN: Missing or invalid user Id", logMeta);
    return res.status(403).json({
      code: "FORBIDDEN",
      success: false,
      message: "Missing or invalid user identity",
      data: null,
    });
  }

  // Check if requesting user is admin
  const requestingUser = await User.findById({ _id: userId })
    .select("role name")
    .lean();

  //   if (!requestingUser || requestingUser?.role !== "admin") {
  //     logger.error("Unauthorized access attempt", logMeta);
  //     return res.status(403).json({
  //       code: "FORBIDDEN",
  //       success: false,
  //       message: "You are not authorized to do this action",
  //       data: null,
  //     });
  //   }

  const managerName = requestingUser.name;

  const matchingTags = await Tags.find({ label: managerName })
    .select("_id")
    .lean();
  const tagIds = matchingTags.map((tag) => tag._id);

  try {
    // Build query object based on provided filters
    const query = {};
    switch (requestingUser.role) {
      case "requester":
        query.createdBy = userId;
        break;
      case "executor":
        query.assignedTo = userId;
        break;
      case "manager":
        query.tags = { $in: tagIds };
        break;

      default:
        break;
    }

    if (title) query.title = { $regex: title, $options: "i" };
    if (createdBy) query.createdBy = createdBy;
    if (assignedTo) query.assignedTo = assignedTo;
    if (dueDate && !isNaN(new Date(dueDate)))
      query.dueDate = { $lte: new Date(dueDate) };
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (updatedBy) query.updatedBy = updatedBy;
    if (tags)
      query.tags = { $in: Array.isArray(tags) ? tags : tags.split(",") };
    query.isSelf = false;

    const safeLimit = Math.max(Number(limit) || 20, 1);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    // Fetch tasks with population and pagination
    const tasks = await Task.find(query)
      .populate("createdBy", "_id name email")
      .populate("status", "_id name color")
      .populate("tags", "_id label color type")
      .populate("updatedBy", "_id name email")
      .populate("assignedTo", "_id name email")
      .skip(safeOffset)
      .limit(safeLimit)
      .lean()
      .sort({ dueDate: 1 });
    const totalCount = await Task.countDocuments(query);

    // If no tasks found, return 404
    if (!tasks || tasks.length === 0) {
      logger.error("NOT_FOUND: No tasks found for the given query", {
        ...logMeta,
        processingTime: Date.now() - startTime,
        query: query,
      });

      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No tasks found for the given filter",
        data: [],
      });
    }

    // Log successful fetch
    logger.info("SUCCESS: Tasks fetched successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });

    // Respond with fetched tasks
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "all tasks fetched successfully",
      data: { tasks, totalCount },
    });
  } catch (error) {
    // Handle and log server errors
    logger.error(
      "INTERNAL_SERVER_ERROR: Something wen wrong while fetching all tasks. Please try again later",
      { ...logMeta, message: error.message, stack: error.stack }
    );
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message:
        "Something wen wrong while fetching all tasks. Please try again later",
      data: null,
    });
  }
});

export default fetchAllTasks;
