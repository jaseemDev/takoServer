import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import Status from "../../models/status/statusSchema.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";
// Controller to delete a status by its ID
const deleteStatus = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract status ID from request parameters
  const { statusId } = req.params;

  console.log(req);
  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req, { statusId: statusId?.trim() });
  // Log the attempt to delete a status
  logger.info("Attempt to delete status", logMeta);

  // Sanitize statusId input
  const sanitizedStatusId = statusId?.trim();

  if (!sanitizedStatusId) {
    logger.error("Missing status ID", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Status ID is required",
      data: null,
    });
  }
  // Check if statusId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(sanitizedStatusId)) {
    logger.error("Invalid status ID format", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid status ID format",
      data: null,
    });
  }
  try {
    // Find and delete the status by ID
    const deletedStatus = await Status.findByIdAndDelete(statusId);
    // If status not found, return 404
    if (!deletedStatus) {
      logger.error("Status not found", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "Status not found",
        data: null,
      });
    }
    // Log successful deletion
    logger.info("Status deleted successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });
    // Respond with success message
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "Status deleted successfully",
      data: {
        _id: deletedStatus._id,
        name: deletedStatus.name,
        color: deletedStatus.color,
      },
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("Error deleting status", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "An error occurred while deleting the status",
      data: null,
    });
  }
});
export default deleteStatus;
