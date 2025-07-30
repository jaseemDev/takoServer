const validateMethod = (allowedMethod) => (req, res, next) => {
  if (req.method !== allowedMethod) {
    console.log(allowedMethod);
    return res.status(405).json({
      message: `Method ${req.method} not allowed. Use ${allowedMethod}.`,
    });
  }
  next();
};

export default validateMethod;
