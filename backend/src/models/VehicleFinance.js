const mongoose = require("mongoose");

const vehicleFinanceSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    entryDate: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["manual", "deal", "vehicle"],
      default: "manual",
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

vehicleFinanceSchema.index({ entryDate: -1, createdAt: -1 });
vehicleFinanceSchema.index({ vehicleId: 1, dealId: 1, kind: 1 });

module.exports = mongoose.model("VehicleFinance", vehicleFinanceSchema);
