const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    badge: {
      type: String,
      default: "",
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    year: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    mileage: {
      type: Number,
      default: 0,
    },
    fuel: {
      type: String,
      default: "Nao informado",
      trim: true,
    },
    transmission: {
      type: String,
      default: "Nao informado",
      trim: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "Nao informado",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "disponivel",
      trim: true,
    },
    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Legacy compatibility fields.
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
