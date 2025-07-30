import express from "express";
import createStatus from "../../controllers/status/createStatus.js";
import { validateInput } from "../../middlewares/validation/validateInput.js";
import {
  validateStatus,
  validateStatusId,
} from "../../middlewares/validation/status.js";
import fetchAllStatus from "../../controllers/status/fetchAllStatus.js";
import deleteStatus from "../../controllers/status/deleteStatus.js";

const router = express.Router();

/**
 * @swagger
 * /api/status/v1/create:
 *   post:
 *     summary: Create a new status
 *     tags: [Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Status created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Status already exists
 */
router.post("/create", validateInput(validateStatus, "body"), createStatus);

/**
 * @swagger
 * /api/status/v1/fetch:
 *   get:
 *     summary: Fetch all statuses
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Statuses fetched successfully
 *       404:
 *         description: No statuses found
 */
router.get("/fetch", fetchAllStatus);

/**
 * @swagger
 * /api/status/v1/delete/{statusId}:
 *   delete:
 *     summary: Delete a status by ID
 *     tags: [Status]
 *     parameters:
 *       - in: query
 *         name: statusId
 *         required: true
 *         schema:
 *           type: string
 *         description: The status ID
 *     responses:
 *       200:
 *         description: Status deleted successfully
 *       400:
 *         description: Invalid or missing status ID
 *       404:
 *         description: Status not found
 */
router.delete(
  "/delete/:statusId",
  validateInput(validateStatusId, "params"),
  deleteStatus
);

export default router;
