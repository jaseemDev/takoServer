import express from "express";
import { validateInput } from "../../middlewares/validation/validateInput.js";
import { validateTask } from "../../middlewares/validation/task.js";
import createTask from "../../controllers/tasks/createTask.js";
import fetchAllTasks from "../../controllers/tasks/fetchAllTasks.js";
import fetchAllSelfTasksByUser from "../../controllers/tasks/fetchAllSelfTasksByUser.js";
import fetchSingleTask from "../../controllers/tasks/fetchSingleTask.js";
import assignTasks from "../../controllers/tasks/assignTasks.js";

const router = express.Router();

router.post("/create", validateInput(validateTask), createTask);
router.get("/admin", fetchAllTasks);
router.get("/user/self", fetchAllSelfTasksByUser);
router.get("/:taskId", fetchSingleTask);
router.post("/assign", assignTasks);

export default router;
