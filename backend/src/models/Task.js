const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done", "cancelled"],
      default: "todo",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      trim: true,
    },
    dueDate: {
      type: String,
      default: "",
      trim: true,
    },
    completedAt: {
      type: String,
      default: "",
      trim: true,
    },
    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    leadName: {
      type: String,
      default: "",
      trim: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },
    dealName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ status: 1, dueDate: 1, priority: 1 });

module.exports = mongoose.model("Task", taskSchema);
