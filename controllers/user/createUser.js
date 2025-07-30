// Import required modules and utilities
import asyncHandler from "express-async-handler";
import User from "../../models/user/userSchema.js";
import logger from "../../utils/logger.js";
import { addMinutes } from "date-fns";
import Auth from "../../models/auth/authSchema.js";
import { generateResetToken } from "../../utils/generateResetToken.js";
import { sendEmail } from "../../utils/sendMail.js";
import mongoose from "mongoose";
import buildLogMeta from "../../utils/logMeta.js";

// Controller to handle user creation requests
export const createUser = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  // Extract user details from request body
  const { name, email, mobile, role, createdBy } = req.body;

  // Prepare log metadata for tracing
  let logMeta = buildLogMeta(req);
  logger.info("Attempt to create a new user", logMeta);

  // List of required fields for user creation
  const requiredFields = ["name", "email", "mobile", "role"];

  //conditionally add createdBy to required fields if role is executor
  if (role.trim().toLowerCase() !== "admin" && !createdBy) {
    requiredFields.push("createdBy");
  }
  // Check for missing required fields
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    logger.error(`BAD_REQUEST: ${missingFields.join(", ")}`, logMeta);
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
      data: null,
    });
  }

  // Validate that role is one of the allowed values
  const validRoles = ["admin", "manager", "requester", "executor"];
  if (!validRoles.includes(role.trim().toLowerCase())) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      success: false,
      message: "Invalid role specified",
      data: null,
    });
  }

  // Sanitize input data
  const sanitizedData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    role: role.trim(),
  };

  // Only add createdBy if required and valid
  if (sanitizedData.role !== "admin") {
    console.log(sanitizedData.role);
    if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "Valid manager/admin is required for this role",
        data: null,
      });
    }
    sanitizedData.createdBy = createdBy.trim();
  }

  if (
    sanitizedData?.createdBy &&
    mongoose.Types.ObjectId.isValid(sanitizedData.createdBy)
  ) {
    const creator = await User.findById({
      _id: sanitizedData?.createdBy || "",
    }).select("role isActive");
    console.log(creator.status);

    if (!creator || !creator.isActive) {
      logger.error("BAD_REQUEST: Creator is not active", {
        ...logMeta,
        createdBy: sanitizedData.createdBy,
        processingTime: Date.now() - startTime,
      });
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "Creator is not active",
        data: null,
      });
    }

    if (
      sanitizedData.role === "executor" &&
      (!creator || creator.role !== "manager")
    ) {
      logger.error("BAD_REQUEST: Only manager can create an executor", {
        ...logMeta,
        createdBy: sanitizedData.createdBy,
        processingTime: Date.now() - startTime,
      });
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "Only manager can create an executor",
        data: null,
      });
    }

    if (
      sanitizedData.role !== "executor" &&
      (!creator || creator.role !== "admin")
    ) {
      logger.error("BAD_REQUEST: Only admin can create this user", {
        ...logMeta,
        createdBy: sanitizedData.createdBy,
        processingTime: Date.now() - startTime,
      });
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "Only admin can create this user",
        data: null,
      });
    }
  }

  try {
    // Check if email & mobile already exists in the database

    const [isEmailExists, isMobileExists] = await Promise.all([
      User.findOne({ email: sanitizedData.email }),
      User.findOne({ mobile: sanitizedData.mobile }),
    ]);

    if (isEmailExists) {
      logger.error("BAD_REQUEST: email already exists", {
        ...logMeta,
        email: sanitizedData.email,
        processingTime: Date.now() - startTime,
      });
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "Email already exists",
        data: null,
      });
    }

    if (isMobileExists) {
      logger.error("BAD_REQUEST: mobile already exists", {
        ...logMeta,
        mobile: sanitizedData.mobile,
        processingTime: Date.now() - startTime,
      });
      return res.status(400).json({
        code: "BAD_REQUEST",
        success: false,
        message: "Mobile number already exists",
        data: null,
      });
    }

    // Create new user document with sanitized data
    const newUser = new User({
      name: sanitizedData.name,
      email: sanitizedData.email,
      mobile: sanitizedData.mobile,
      role: sanitizedData.role,
    });
    if (sanitizedData.createdBy) {
      newUser.createdBy = sanitizedData.createdBy;
    }
    // Save the new user to the database
    const savedUser = await newUser.save();
    // Log successful user creation
    logger.info("CREATED: User created successfully", {
      ...logMeta,
      userId: savedUser._id,
      processingTime: Date.now() - startTime,
    });

    const { resetToken, hashedToken } = await generateResetToken();
    const expiry = addMinutes(new Date(), 60); // Set token expiry to 1 hr

    await Auth.create({
      userId: savedUser._id,
      resetToken: hashedToken,
      resetTokenExpiration: expiry,
      passwordHash: "", // Initially no password set
      status: "pending", // Set initial status to pending
      lastLogin: null, // No last login initially
    });

    const setLink = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
    const message = `Please click the link to set your password: ${setLink}`;

    try {
      await sendEmail(sanitizedData.email, message);
    } catch (error) {
      logger.error("Error sending email", {
        ...logMeta,
        error: error.message,
        userId: savedUser._id,
      });
      await Promise.all([
        User.deleteOne({ _id: savedUser._id }),
        Auth.deleteOne({ userId: savedUser._id }),
      ]);
      // Handle email sending error
      return res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        success: false,
        message: "Failed to send email notification",
        data: null,
      });
    }

    // Respond with success and created user data
    return res.status(201).json({
      code: "CREATED",
      success: true,
      message: "User created & email notification sent successfully",
      data: savedUser,
    });
  } catch (error) {
    // Handle and log server errors
    logger.error("INTERNAL_SERVER_ERROR: Error creating user", {
      ...logMeta,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      success: false,
      message: "An error occurred while creating the user",
      data: null,
    });
  }
});
