// Import required modules and utilities
import asyncHandler from "express-async-handler";
import logger from "../../utils/logger.js";
import Tags from "../../models/tags/tagsSchema.js";
import buildLogMeta from "../../utils/logMeta.js";

const createTags = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract tag details from request body
  const { label, color, type } = req.body;
  console.log(label, color, type);
  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req);
  logger.info("Attempt to create a new tag", logMeta);
  // Validate required fields

  const missing = [];
  if (!label) missing.push("label");
  if (!type) missing.push("type");

  if (missing.length) {
    logger.error(
      "BAD_REQUEST: Missing required fields: " + missing.join(", "),
      logMeta
    );
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: `Missing required fields: ${missing.join(", ")}`,
      data: null,
    });
  }

  const rawType = type?.trim();
  const allowedTypes = ["task", "project", "user", "priority"];
  if (!allowedTypes.includes(rawType)) {
    logger.error("Bad request: Invalid type specified", logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid type specified",
      data: null,
    });
  }

  // Sanitize input data
  const sanitizedData = {
    label: label.trim(),
    color: color?.trim(),
    type: type.trim(),
  };

  // Check if tag with the same label already exists
  const existingTag = await Tags.findOne({
    label: { $regex: `^${sanitizedData.label}$`, $options: "i" }, // Case-insensitive match
    type: sanitizedData.type,
  });
  if (existingTag) {
    logger.error("Tag already exists", {
      ...logMeta,
      label: sanitizedData.label,
      type: sanitizedData.type,
      processingTime: Date.now() - startTime,
    });
    return res.status(409).json({
      code: "CONFLICT",
      success: false,
      message: "Tag already exists",
      data: null,
    });
  }
  try {
    // Create a new tag document
    const newTag = new Tags({
      label: sanitizedData.label,
      color: sanitizedData.color?.match(/^#[0-9A-Fa-f]{6}$/)
        ? sanitizedData.color
        : "#000000",
      type: sanitizedData.type,
    });
    // Save the new tag to the database
    const savedTag = await newTag.save();
    logger.info("Tag created successfully", {
      ...logMeta,
      processingTime: Date.now() - startTime,
      label: sanitizedData.label,
      type: sanitizedData.type,
    });
    return res.status(201).json({
      code: "CREATED",
      success: true,
      message: "Tag created successfully",
      data: savedTag,
    });
  } catch (error) {
    logger.error("Error creating tag", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "An error occurred while creating the tag",
      data: error.message,
    });
  }
});
// Export the createTags function for use in routes
export default createTags;
