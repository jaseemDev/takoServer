import { Filter } from "bad-words";
import * as Yup from "yup";
const filter = new Filter();
export const validateTask = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required("Task title is required")
    .min(6, "Task title must be atleast 6 characters")
    .max(56, "Task title is too long"),
  description: Yup.string().trim().required("Description is required"),
  priority: Yup.string()
    .trim()
    .required("Task priority is required")
    .oneOf(["low", "medium", "high"], "Invalid task priority"),
  tags: Yup.array()
    .of(
      Yup.string()
        .trim()
        .required("Tags cannot be empty")
        .test("no-profanity", "Tags contain inappropriate word", (value) => {
          return !filter.isProfane(value || "");
        })
    )
    .min(1, "At least 1 tag is required")
    .required("Tags cannot be empty"),
  dueDate: Yup.date("Invalid date format").required("Due date is required"),
  createdBy: Yup.string()
    .required("Created by is required")
    .matches(/^[0-9a-fA-F]{24}$/, "Created By must be a valid ObjectId"),
  isSelf: Yup.boolean().required("Please specify if this is a self task"),
});
