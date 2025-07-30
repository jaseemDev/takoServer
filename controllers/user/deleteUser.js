import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";

const deleteUser = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract userId from request parameters
  const { userId } = req.params;

  // Prepare log metadata for tracing
  const logMeta = buildLogMeta(req, { userId });
  logger.info("Attempt to delete user by ID", logMeta);

  // Validate that userId is provided
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    logger.warn("Invalid or missing user ID", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid or missing user ID",
      data: null,
    });
  }

  try {
    // Find and delete user by ID
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      logger.error("User not found", {
        ...logMeta,
        processingTime: Date.now() - startTime,
      });
      return res.status(404).json({
        code: "NOT_FOUND",
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Log successful deletion
    logger.info("User deleted successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
    });

    // Respond with success message
    return res.status(200).json({
      code: "SUCCESS",
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    logger.error("Error deleting user", {
      ...logMeta,
      message: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "An error occurred while deleting the user",
      data: null,
    });
  }
});

export default deleteUser;
