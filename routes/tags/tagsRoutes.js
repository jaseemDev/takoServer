import express from "express";
import createTags from "../../controllers/tags/createTags.js";
import fetchTags from "../../controllers/tags/fetchTags.js";
import deleteTags from "../../controllers/tags/deleteTags.js";
import { validateInput } from "../../middlewares/validation/validateInput.js";
import { validateTags } from "../../middlewares/validation/tags.js";

const router = express.Router();

/**
 * @swagger
 * /api/tags/v1/create:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Tag already exists
 */
router.post("/create", validateInput(validateTags), createTags);

/**
 * @swagger
 * /api/tags/v1/fetch:
 *   get:
 *     summary: Fetch all tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tags fetched successfully
 *       404:
 *         description: No tags found
 */
router.get("/fetch", fetchTags);

/**
 * @swagger
 * /api/tags/v1/delete/{tagId}:
 *   delete:
 *     summary: Delete a tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *         description: The tag ID
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *       400:
 *         description: Invalid or missing tag ID
 *       404:
 *         description: Tag not found
 */
router.delete("/delete/:tagId", deleteTags);

export default router;
