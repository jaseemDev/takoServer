import * as Yup from "yup";
import { Filter } from "bad-words";

const filter = new Filter();

export const validateTags = Yup.object().shape({
  label: Yup.string()
    .trim()
    .required("Tag name is required")
    .min(3, "Tag is too short")
    .max(16, "Tag is too long")
    .test(
      "no-profanity",
      "Tag name contains inappropriate language",
      (value) => !filter.isProfane(value || "")
    ),

  type: Yup.string()
    .trim()
    .required("Tag type is required")
    .oneOf(["task", "priority", "project", "user"], "Invalid tag type"),
});
