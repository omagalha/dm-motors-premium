const mongoose = require("mongoose");

const vehicleInternalSchema = new mongoose.Schema(
  {
    plate: { type: String, default: "", trim: true },
    renavam: { type: String, default: "", trim: true },
    chassis: { type: String, default: "", trim: true },
    engineNumber: { type: String, default: "", trim: true },
    buyerDocument: { type: String, default: "", trim: true },
    buyerName: { type: String, default: "", trim: true },
    buyerContactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", default: null },
    buyerContactName: { type: String, default: "", trim: true },
    previousOwnerDocument: { type: String, default: "", trim: true },
    previousOwnerName: { type: String, default: "", trim: true },
    acquisitionDate: { type: String, default: "", trim: true },
    acquisitionValue: { type: Number, default: 0 },
    minimumSaleValue: { type: Number, default: 0 },
    financedValue: { type: Number, default: 0 },
    internalNotes: { type: String, default: "", trim: true },
    provenance: { type: String, default: "", trim: true },
    spareKeyCount: { type: String, default: "", trim: true },
    manualCount: { type: String, default: "", trim: true },
    hasInspectionReport: { type: Boolean, default: false },
    hasPaidIpva: { type: Boolean, default: false },
    hasFines: { type: Boolean, default: false },
    hasLien: { type: Boolean, default: false },
    legalNotes: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const vehicleMetricsSchema = new mongoose.Schema(
  {
    views: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
    lastViewAt: { type: String, default: "", trim: true },
    lastWhatsappClickAt: { type: String, default: "", trim: true },
    sources: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false },
);

const vehicleDocumentWorkflowSchema = new mongoose.Schema(
  {
    saleContract: {
      status: {
        type: String,
        enum: ["idle", "pending", "completed", "failed", "cancelled"],
        default: "idle",
      },
      executionId: { type: String, default: "", trim: true },
      providerExecutionId: { type: String, default: "", trim: true },
      createdAt: { type: Date, default: null },
      updatedAt: { type: Date, default: null },
      triggeredAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      failedAt: { type: Date, default: null },
      documentUrl: { type: String, default: "", trim: true },
      errorMessage: { type: String, default: "", trim: true },
    },
  },
  { _id: false },
);

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
    isSpotlight: {
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
      type: [mongoose.Schema.Types.Mixed],
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
    internal: {
      type: vehicleInternalSchema,
      required: false,
    },
    metrics: {
      type: vehicleMetricsSchema,
      required: false,
    },
    documentWorkflow: {
      type: vehicleDocumentWorkflowSchema,
      required: false,
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
  },
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
