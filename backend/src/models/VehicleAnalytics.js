const mongoose = require("mongoose");

const vehicleAnalyticsSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      unique: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    whatsappClicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastViewAt: {
      type: Date,
      default: null,
    },
    lastWhatsappClickAt: {
      type: Date,
      default: null,
    },
    sources: {
      type: Map,
      of: Number,
      default: {},
    },
    campaigns: {
      type: Map,
      of: Number,
      default: {},
    },
    utmSources: {
      type: Map,
      of: Number,
      default: {},
    },
    utmMediums: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("VehicleAnalytics", vehicleAnalyticsSchema);
