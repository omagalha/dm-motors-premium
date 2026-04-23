const mongoose = require("mongoose");

const financeEntrySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["sale", "expense", "manual_income"],
      required: true,
      trim: true,
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
    notes: {
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
    source: {
      type: String,
      enum: ["manual", "vehicle_sale"],
      default: "manual",
      trim: true,
    },
    metadata: {
      previousVehicleStatus: {
        type: String,
        default: "",
        trim: true,
      },
      importedByBackfill: {
        type: Boolean,
        default: false,
      },
      inferredEntryDateFrom: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

financeEntrySchema.index({ entryDate: -1, createdAt: -1 });
financeEntrySchema.index({ vehicleId: 1, type: 1 });

module.exports = mongoose.model("FinanceEntry", financeEntrySchema);
