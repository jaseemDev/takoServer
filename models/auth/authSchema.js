import mongoose from "mongoose";

const authSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
      index: true,
    },
    passwordHash: { type: String },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "blocked"],
      default: "pending",
    },
    lastLogin: {
      type: Date,
    },
    resetToken: { type: String, index: true },
    resetTokenExpiration: { type: Date, index: { expires: 3600 } },
    loginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

var Auth = mongoose.model("Auth", authSchema);
export default Auth;
