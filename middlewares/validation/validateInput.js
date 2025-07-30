export const validateInput =
  (schema, source = "body") =>
  async (req, res, next) => {
    try {
      const data = await schema.validate(req[source], { abortEarly: false });
      req[source] = data; // override with sanitized/validated data
      next();
    } catch (err) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        success: false,
        message: err.errors.join(", "),
      });
    }
  };
