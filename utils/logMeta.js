const buildLogMeta = (req, additionalMeta = {}) => {
  return {
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "unknown",
    ...additionalMeta,
  };
};

export default buildLogMeta;
