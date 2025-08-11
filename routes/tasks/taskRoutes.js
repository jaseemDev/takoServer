import express from "express";
import { validateInput } from "../../middlewares/validation/validateInput.js";
import { validateTask } from "../../middlewares/validation/task.js";
import createTask from "../../controllers/tasks/createTask.js";
import fetchAllTasks from "../../controllers/tasks/fetchAllTasks.js";
import fetchAllSelfTasksByUser from "../../controllers/tasks/fetchAllSelfTasksByUser.js";
import fetchSingleTask from "../../controllers/tasks/fetchSingleTask.js";
import assignTasks from "../../controllers/tasks/assignTasks.js";
import changeStatus from "../../controllers/tasks/changeStatus.js";
import taskTagController from "../../controllers/tasks/taskTagController.js";
import addComment from "../../controllers/comments/addComment.js";
import deleteComments from "../../controllers/comments/deleteComments.js";

const router = express.Router();

/**
 * @swagger
 * /api/tasks/create:
 *   post:
 *     summary: Create a new task (including self tasks)
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - priority
 *               - dueDate
 *               - tags
 *               - createdBy
 *               - isSelf
 *               - assignedTo
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Task title (unique per user, required)
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Task description (required)
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Task priority
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date (required)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tag labels (at least one required)
 *               createdBy:
 *                 type: string
 *                 description: User ID of the creator (ObjectId)
 *               assignedTo:
 *                 type: string
 *                 description: User ID of the assignee (ObjectId)
 *               isSelf:
 *                 type: boolean
 *                 description: Whether this is a self task
 *     responses:
 *       201:
 *         description: Task created successfully
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid fields)
 *       404:
 *         description: User or tag not found
 *       409:
 *         description: Conflict (duplicate task title)
 *       500:
 *         description: Internal server error
 */
router.post("/create", validateInput(validateTask), createTask);

/**
 * @swagger
 * /api/tasks/admin:
 *   get:
 *     summary: Fetch all non-self tasks with optional filters (admin/role-based)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The requesting user's ID (used for role-based filtering)
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by task title (partial match)
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by creator user ID
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by assignee user ID
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Filter by due date (tasks due on or before this date)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated tag IDs to filter by
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         required: false
 *         description: Filter by priority
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by status ID
 *       - in: query
 *         name: updatedBy
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by user who last updated the task
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         required: false
 *         description: Number of tasks to return (pagination)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         required: false
 *         description: Number of tasks to skip (pagination)
 *     responses:
 *       200:
 *         description: List of tasks matching the filter
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
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     totalCount:
 *                       type: integer
 *       403:
 *         description: Forbidden (missing or invalid userId, or unauthorized)
 *       404:
 *         description: No tasks found for the given filter
 *       500:
 *         description: Internal server error
 */
router.get("/admin", fetchAllTasks);

/**
 * @swagger
 * /api/tasks/user/self:
 *   get:
 *     summary: Fetch all self tasks for a specific user
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         required: false
 *         description: Number of tasks to return (pagination)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         required: false
 *         description: Number of tasks to skip (pagination)
 *     responses:
 *       200:
 *         description: List of self tasks for the user
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
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     totalCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized (missing or invalid userId)
 *       404:
 *         description: No self tasks found
 *       500:
 *         description: Internal server error
 */
router.get("/user/self", fetchAllSelfTasksByUser);

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Fetch a single task by its ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the task to fetch
 *     responses:
 *       200:
 *         description: Task successfully fetched
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid task id)
 *       404:
 *         description: No such task found
 *       500:
 *         description: Internal server error
 */
router.get("/:taskId", fetchSingleTask);

/**
 * @swagger
 * /api/tasks/assign:
 *   post:
 *     summary: Assign a task to a user
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - userId
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: The ID of the task to assign
 *               userId:
 *                 type: string
 *                 description: The ID of the user to assign the task to
 *     responses:
 *       200:
 *         description: Task successfully assigned
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid taskId/userId, or assigning to self)
 *       404:
 *         description: Task or user not found
 *       422:
 *         description: Unprocessable entity (cannot assign to a requester)
 *       500:
 *         description: Internal server error
 */
router.post("/assign", assignTasks);

/**
 * @swagger
 * /api/tasks/changeStatus:
 *   post:
 *     summary: Change the status of a task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - statusId
 *               - userId
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: The ID of the task to update
 *               statusId:
 *                 type: string
 *                 description: The ID of the new status
 *               userId:
 *                 type: string
 *                 description: The ID of the user making the change
 *     responses:
 *       200:
 *         description: Task status changed successfully
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid taskId/statusId/userId)
 *       403:
 *         description: Forbidden (user not authorized)
 *       404:
 *         description: Task, user, or status not found
 *       422:
 *         description: Unprocessable entity (cannot update with same status)
 *       500:
 *         description: Internal server error
 */
router.post("/changeStatus", changeStatus);

/**
 * @swagger
 * /api/tasks/addTag:
 *   post:
 *     summary: Add or remove a tag from a task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagId
 *               - taskId
 *             properties:
 *               tagId:
 *                 type: string
 *                 description: The ID of the tag to add or remove
 *               taskId:
 *                 type: string
 *                 description: The ID of the task
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *                 default: add
 *                 description: Whether to add or remove the tag (default is add)
 *     responses:
 *       200:
 *         description: Tag added or removed successfully
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid tagId/taskId)
 *       404:
 *         description: Task not found
 *       409:
 *         description: Conflict (tag already exists or does not exist in the task)
 *       500:
 *         description: Internal server error
 */
router.post("/addTag", taskTagController);

/**
 * @swagger
 * /api/tasks/comment:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *               - userId
 *               - taskId
 *             properties:
 *               comment:
 *                 type: string
 *                 description: The comment text
 *               userId:
 *                 type: string
 *                 description: The ID of the user making the comment
 *               taskId:
 *                 type: string
 *                 description: The ID of the task to comment on
 *     responses:
 *       200:
 *         description: Comment added successfully
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid fields)
 *       404:
 *         description: Task or user not found
 *       500:
 *         description: Internal server error
 */
router.post("/comment", addComment);

/**
 * @swagger
 * /api/tasks/deleteComment:
 *   post:
 *     summary: Delete a comment from a task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentId
 *               - taskId
 *             properties:
 *               commentId:
 *                 type: string
 *                 description: The ID of the comment to delete
 *               taskId:
 *                 type: string
 *                 description: The ID of the task
 *     responses:
 *       200:
 *         description: Comment deleted successfully
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request (missing or invalid commentId/taskId)
 *       404:
 *         description: Task or comment not found
 *       500:
 *         description: Internal server error
 */
router.post("/deleteComment", deleteComments);

export default router;
