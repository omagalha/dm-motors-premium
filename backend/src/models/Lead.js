const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "site",
      trim: true,
    },
    stage: {
      type: String,
      enum: ["novo", "em_contato", "qualificado", "proposta", "negociacao", "convertido", "perdido"],
      default: "novo",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      trim: true,
    },
    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },
    interestVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    interestVehicleName: {
      type: String,
      default: "",
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    lastContactAt: {
      type: String,
      default: "",
      trim: true,
    },
    nextFollowUpAt: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

leadSchema.index({ updatedAt: -1, createdAt: -1 });
leadSchema.index({ stage: 1, priority: 1 });

module.exports = mongoose.model("Lead", leadSchema);
