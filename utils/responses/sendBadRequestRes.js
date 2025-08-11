import logger from "../logger.js";

export const sendBadRequestRes = (res, logMeta, field) => {
  logger.error(`BAD_REQUEST: Missing or invalid ${field}`, logMeta);
  return res.status(400).json({
    code: "BAD_REQUEST",
    success: false,
    message: `Missing or invalid ${field}`,
    data: null,
  });
};
