import crypto from "crypto";

export const generateResetToken = async () => {
  const resetToken = crypto.randomBytes(64).toString("hex"); // send this via email
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  return { resetToken, hashedToken };
};
