// Controller to fetch all self tasks for a specific user
import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import SelfTask from "../../models/task/selfTasks/selfTasksSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

const fetchAllSelfTasksByUser = asyncHandler(async (req, res) => {
  // Start timer for logging
  const startTime = Date.now();

  // Extract userId and pagination parameters from query
  const { userId, limit = 20, offset = 0 } = req.query;

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req);

  // Log the fetch attempt
  logger.info("Attempt to fetch all self tasks");

  // Check if userId is provided
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    logger.error("UNAUTHORIZED: Missing or invalid user Id", logMeta);
    return res.status(401).json({
      code: "UNAUTHORIZED",
      success: false,
      message: "Missing or invalid user identity",
      data: null,
    });
  }

  try {
    // Query self tasks for the user, populate task details, tags, and status
    const allSelfTasks = await SelfTask.find({ userId })
      .populate({
        path: "taskId",
        populate: [
          { path: "tags", select: "_id label color type" },
          { path: "status", select: "_id name color" },
        ],
      })
      .lean();

    // Extract task objects from selfTasks and filter out nulls
    const allValidTasks = allSelfTasks
      .map((entry) => entry.taskId)
      .filter(Boolean); // remove nulls if any

    const paginatedTasks = allValidTasks.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    console.log(paginatedTasks);

    // If no tasks found, return 404
    if (paginatedTasks.length === 0) {
      logger.error("NOT_FOUND: No self tasks found.", {
        ...logMeta,
        userId: userId,
        processingTime: Date.now() - startTime,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "No self task found",
        data: [],
      });
    }

    // Log successful fetch
    logger.info("SUCCESS: Self tasks fetched successfully", {
      ...logMeta,
      userId: userId,
      processingTime: Date.now() - startTime,
    });

    // Respond with fetched self tasks
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Self tasks fetched successfully",
      data: { tasks: paginatedTasks, totalCount: allValidTasks.length },
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("INTERNAL_SERVER_ERROR: Error fetching self tasks", {
      ...logMeta,
      processingTime: Date.now() - startTime,
      error: error.message,
    });

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Something went wrong while fetching the self tasks",
      data: null,
    });
  }
});

export default fetchAllSelfTasksByUser;
