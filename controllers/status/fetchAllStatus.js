import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import Status from "../../models/status/statusSchema.js";
import buildLogMeta from "../../utils/logMeta.js";
const fetchAllStatus = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req);

  // Log the attempt to fetch all statuses
  logger.info("Attempt to fetch all statuses", logMeta);
  try {
    // Fetch all statuses from the database
    const statuses = await Status.find().select(
      "_id name color createdAt updatedAt"
    );
    // If no statuses found, return success with empty array
    if (statuses.length === 0) {
      logger.info("No statuses found", logMeta);
      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message: "No statuses found",
        data: [],
      });
    }
    // Log successful fetch
    logger.info("Statuses fetched successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with statuses data
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Statuses fetched successfully",
      data: statuses,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("Error fetching statuses", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "SERVER_ERROR",
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
});

export default fetchAllStatus;
