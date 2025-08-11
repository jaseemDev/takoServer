import express from "express";
import createTags from "../../controllers/tags/createTags.js";
import fetchTags from "../../controllers/tags/fetchTags.js";
import deleteTags from "../../controllers/tags/deleteTags.js";
import { validateInput } from "../../middlewares/validation/validateInput.js";
import { validateTags } from "../../middlewares/validation/tags.js";

const router = express.Router();

/**
 * @swagger
 * /api/tags/create:
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
 *               - label
 *               - type
 *             properties:
 *               label:
 *                 type: string
 *                 description: The label for the tag (required, unique per type)
 *               color:
 *                 type: string
 *                 description: Hex color code for the tag (optional, defaults to #000000)
 *                 example: "#ff0000"
 *               type:
 *                 type: string
 *                 enum: [task, project, user, priority]
 *                 description: The type of the tag (required)
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Bad request (missing or invalid fields)
 *       409:
 *         description: Conflict (tag already exists)
 *       500:
 *         description: Internal server error
 */
router.post("/create", validateInput(validateTags), createTags);

/**
 * @swagger
 * /api/tags/fetch:
 *   get:
 *     summary: Fetch all tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tags fetched successfully (or no tags found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *       500:
 *         description: Internal server error
 */
router.get("/fetch", fetchTags);

/**
 * @swagger
 * /api/tags/delete/{tagId}:
 *   delete:
 *     summary: Delete a tag by its ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the tag to delete
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Bad request (missing or invalid tagId)
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:tagId", deleteTags);

export default router;
