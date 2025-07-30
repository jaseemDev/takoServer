import * as Yup from "yup";
export const validateUser = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: Yup.string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),
  mobile: Yup.string()
    .trim()
    .matches(/^\d{10}$/, "Mobile number must be 10 digits")
    .required("Mobile number is required"),
  role: Yup.string()
    .trim()
    .required("Role is required")
    .oneOf(
      ["admin", "manager", "executor", "requester"],
      "Invalid role specified"
    ),
  createdBy: Yup.string()
    .trim()
    .when("role", {
      is: (val) => val !== "admin",
      then: () =>
        Yup.string()
          .required("Created By is required for non-admin roles")
          .matches(/^[0-9a-fA-F]{24}$/, "Created By must be a valid ObjectId"),
      otherwise: () => Yup.string().notRequired(),
    }),
});

export const validateUpdateUser = Yup.object().shape({
  userId: Yup.string()
    .trim()
    .required("User ID is required")
    .matches(/^[0-9a-fA-F]{24}$/, "User ID must be a valid ObjectId"),
  name: Yup.string()
    .trim()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: Yup.string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),
  mobile: Yup.string()
    .trim()
    .matches(/^\d{10}$/, "Mobile number must be 10 digits")
    .required("Mobile number is required"),
  role: Yup.string()
    .trim()
    .required("Role is required")
    .oneOf(
      ["admin", "manager", "executor", "requester"],
      "Invalid role specified"
    ),
});
