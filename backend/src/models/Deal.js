const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      enum: ["novo", "qualificacao", "proposta", "negociacao", "fechado_ganho", "fechado_perdido"],
      default: "novo",
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    probability: {
      type: Number,
      default: 0,
    },
    expectedCloseDate: {
      type: String,
      default: "",
      trim: true,
    },
    closedAt: {
      type: String,
      default: "",
      trim: true,
    },
    owner: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "crm",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    lostReason: {
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
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    vehicleName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

dealSchema.index({ stage: 1, updatedAt: -1 });
dealSchema.index({ leadId: 1, vehicleId: 1 });

module.exports = mongoose.model("Deal", dealSchema);
