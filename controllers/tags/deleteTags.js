import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import Tags from "../../models/tags/tagsSchema.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to handle tag deletion requests
const deleteTags = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract tag ID from request parameters
  const { tagId } = req.params;
  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req, { tagId: tagId ? tagId.trim() : null });
  logger.info("Attempt to delete tag", logMeta);
  // Validate tag ID
  if (!tagId || !tagId.trim() || !mongoose.Types.ObjectId.isValid(tagId)) {
    logger.error("Bad request: Tag ID is required", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Tag ID is required",
      data: null,
    });
  }
  // Sanitize tag ID
  const sanitizedTagId = tagId.trim();
  // Check if tag exists
  const tag = await Tags.findById(sanitizedTagId);
  if (!tag) {
    logger.error("NOT_FOUND: Tag not found", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    return res.status(404).json({
      code: "NOT_FOUND",
      success: false,
      message: "Tag not found",
      data: null,
    });
  }

  try {
    // Delete the tag
    await Tags.findByIdAndDelete(sanitizedTagId);
    logger.info("SUCCESS: Tag deleted successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with success
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Tag deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("INTERNAL_SERVER_ERROR: Error deleting tag", {
      ...logMeta,
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime,
    });
    // Handle any errors during deletion
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
});
// Export the deleteTags controller
export default deleteTags;
