import express from "express";
import { createUser } from "../../controllers/user/createUser.js";
import { updateUser } from "../../controllers/user/updateUser.js";
import deleteUser from "../../controllers/user/deleteUser.js";
import fetchAllUsersByManagerId from "../../controllers/user/fetchAllUsersByManagerId.js";
import { fetchSingleUserById } from "../../controllers/user/fetchSingleUserById.js";
import { updateUserStatus } from "../../controllers/user/updateUserStatus.js";
import {
  validateUpdateUser,
  validateUser,
} from "../../middlewares/validation/user.js";
import { validateInput } from "../../middlewares/validation/validateInput.js";
import { fetchAllUsers } from "../../controllers/user/fetchAllUsers.js";
const router = express.Router();

/**
 * @swagger
 * /api/user/v1/create:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - role
 *               - createdBy
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               image:
 *                 type: string
 *               role:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
router.post("/create", validateInput(validateUser, "body"), createUser);

/**
 * @swagger
 * /api/user/v1/update:
 *   put:
 *     summary: Update an existing user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - email
 *               - mobile
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.put("/update", validateInput(validateUpdateUser, "body"), updateUser);

/**
 * @swagger
 * /api/user/v1/delete/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid or missing user ID
 *       404:
 *         description: User not found
 */
router.delete("/delete/:userId", deleteUser);

/**
 * @swagger
 * /api/user/v1/fetch-all-users/{managerId}:
 *   get:
 *     summary: Fetch all users created by a specific admin
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The manager ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       400:
 *         description: Invalid or missing manager ID
 *       404:
 *         description: No users found for the given manager ID
 */
router.get("/fetch-all-users/:managerId", fetchAllUsersByManagerId);

/**
 * @swagger
 * /api/user/v1/fetchSingleUser/{userId}:
 *   get:
 *     summary: Fetch a single user by ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       400:
 *         description: User not found
 *       404:
 *         description: User not found
 */
router.get("/fetchSingleUser/:userId", fetchSingleUserById);

/**
 * @swagger
 * /api/user/v1/updateUserStatus:
 *   post:
 *     summary: Update the status of a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - isActive
 *             properties:
 *               userId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.post("/updateUserStatus", updateUserStatus);

/**
 * @swagger
 * /api/user/v1/fetchAllUsers:
 *   get:
 *     summary: Fetch all users with pagination
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       404:
 *         description: No users found
 */
router.get("/fetchAllUsers", fetchAllUsers);

export default router;
