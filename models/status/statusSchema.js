import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (val) => /^#[0-9A-Fa-f]{6}$/.test(val),
        message: (props) => `${props.value} is not a valid hex color`,
      },
    },
  },
  { timestamps: true }
);

statusSchema.index({ name: 1 }); // Optional, helpful if searching by name often

const Status = mongoose.model("Status", statusSchema);
export default Status;
