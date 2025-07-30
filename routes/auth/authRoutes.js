import express from "express";
import { login } from "../../controllers/auth/login.js";
import { forgotPassword } from "../../controllers/auth/forgotPassword.js";
import { resetPassword } from "../../controllers/auth/resetPassword.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/v1/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials or bad request
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/v1/forgotPassword:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Email is required or bad request
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests (active reset link exists)
 */
router.post("/forgotPassword", forgotPassword);

/**
 * @swagger
 * /api/auth/v1/resetPassword:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - password
 *             properties:
 *               resetToken:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: All inputs are required or bad request
 *       404:
 *         description: Invalid or expired reset token
 *       500:
 *         description: Internal server error
 */
router.post("/resetPassword", resetPassword);

export default router;
