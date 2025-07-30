import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import Tags from "../../models/tags/tagsSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

const fetchTags = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req);
  logger.info("Attempt to fetch tags", logMeta);
  try {
    // Fetch all tags from the database
    const tags = await Tags.find({})
      .select("label color type")
      .sort({ createdAt: -1 });
    // If no tags found, return success with empty array
    if (tags.length === 0) {
      logger.info("SUCCESS: No tags found", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });
      return res.status(200).json({
        code: "SUCCESS",
        success: true,
        message: "No tags found",
        data: [],
      });
    }
    // Log successful fetch
    logger.info("SUCCESS: Tags fetched successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with tags data
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Tags fetched successfully",
      data: tags,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("INTERNAL_SERVER_ERROR: Error fetching tags", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
});
// Export the fetchTags function for use in routes
export default fetchTags;
