import mongoose from "mongoose";

const selfTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
});
selfTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });

const SelfTask = mongoose.model("SelfTask", selfTaskSchema);
export default SelfTask;
