const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    phones: {
      type: [String],
      default: [],
    },
    emails: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    linkedLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    linkedLeadName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

contactSchema.index({ updatedAt: -1, createdAt: -1 });
contactSchema.index({ name: 1, company: 1, city: 1 });
contactSchema.index({ linkedLeadId: 1 });

module.exports = mongoose.model("Contact", contactSchema);
