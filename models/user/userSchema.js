import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    mobile: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      enum: ["admin", "manager", "requester", "executor"],
      default: "executor",
      index: true,
    },
    isActive: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

var User = mongoose.model("User", userSchema);
export default User;
