import * as Yup from "yup";

export const validateStatus = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required("Status name is required")
    .min(3, "Status name must be at least 3 characters")
    .max(50, "Status name must not exceed 50 characters"),
  color: Yup.string()
    .trim()
    .required("Status color is required")
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid color format"),
});
export const validateStatusId = Yup.object().shape({
  statusId: Yup.string()
    .trim()
    .required("Status ID is required")
    .length(24, "Status ID must be 24 characters long")
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid status ID format"),
});
