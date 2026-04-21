const mongoose = require("mongoose");

const vehicleAnalyticsDailySchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
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

module.exports = mongoose.model("VehicleAnalyticsDaily", vehicleAnalyticsDailySchema);
