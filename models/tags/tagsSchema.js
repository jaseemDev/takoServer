import mongoose from "mongoose";

const tagsSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    color: {
      type: String,
      required: true,
      validate: {
        validator: (val) => /^#[0-9A-Fa-f]{6}$/.test(val),
        message: (props) => `${props.value} is not a valid hex color`,
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["task", "project", "user", "priority"],
      index: true,
    },
  },
  { timestamps: true }
);

// Composite unique index to prevent duplicates like { label: "Important", type: "task" }
tagsSchema.index({ label: 1, type: 1 }, { unique: true });

const Tags = mongoose.model("Tags", tagsSchema);
export default Tags;
