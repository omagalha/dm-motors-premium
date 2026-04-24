import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  VehicleDocumentStatusCard,
  type VehicleDocumentStatusBadge,
} from "@/components/admin/VehicleDocumentStatusCard";
import { VehicleSaleContractDraftModal } from "@/components/admin/VehicleSaleContractDraftModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatKm, formatPrice } from "@/data/cars";
import { useCars, type Car, type CarInput } from "@/data/carsStore";
import { getStoredAdminToken } from "@/lib/adminSession";
import {
  ensureSingleCover,
  getVehicleImageUrl,
  getVehicleMetricsSummary,
  getVehiclePrimaryImage,
  moveImage,
  normalizeVehicleImages,
  setCoverImage,
} from "@/lib/vehicles";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import {
  getVehicleDocumentPayload,
  getVehicleDocumentReadiness,
  resetSaleContractWorkflow,
  startSaleContractWorkflow,
  type VehicleDocumentReadiness,
  type VehicleSaleDocumentPayload,
  type VehicleSaleContractWorkflowResult,
} from "@/services/vehicleDocumentService";
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  updateVehicle,
} from "@/services/vehicleService";
import type {
  Category,
  Fuel,
  Transmission,
  VehicleDocumentWorkflowStatus,
  VehicleInternalData,
  VehicleImage,
  VehicleStatus,
} from "@/types/vehicle";
import {
  CheckCircle2,
  Copy,
  Eye,
  MessageCircle,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

const statusMeta: Record<VehicleStatus, { label: string; dot: string; pill: string }> = {
  disponivel: {
    label: "Disponível",
    dot: "bg-whatsapp shadow-[0_0_0_3px_oklch(0.68_0.18_145/0.25)]",
    pill: "bg-whatsapp/15 text-whatsapp",
  },
  reservado: {
    label: "Reservado",
    dot: "bg-amber-400 shadow-[0_0_0_3px_oklch(0.85_0.18_85/0.25)]",
    pill: "bg-amber-400/15 text-amber-400",
  },
  vendido: {
    label: "Vendido",
    dot: "bg-muted-foreground/70 shadow-[0_0_0_3px_oklch(0.72_0.01_20/0.2)]",
    pill: "bg-muted text-muted-foreground",
  },
};

export const Route = createFileRoute("/admin/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminVeiculos,
});

const transmissions: Transmission[] = ["Automático", "Manual", "Não informado"];
const fuels: Fuel[] = ["Flex", "Gasolina", "Diesel", "Não informado"];
const categories: Category[] = ["Hatch", "Sedan", "SUV", "Picape", "Não informado"];
const statuses: VehicleStatus[] = ["disponivel", "reservado", "vendido"];
type SubmitStatus = "idle" | "uploading_images" | "saving_vehicle";
type ActiveFilter = "all" | "active" | "inactive";
type FeaturedFilter = "all" | "featured" | "regular";
type EditorMode = "create" | "edit" | "duplicate";
type EditorTab = "commercial" | "images" | "internal";

interface PendingUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  image: VehicleImage;
}

interface AdminImageItem {
  id: string;
  kind: "existing" | "pending";
  image: VehicleImage;
  previewUrl: string;
  file?: File;
}

interface InternalFormState {
  plate: string;
  renavam: string;
  chassis: string;
  engineNumber: string;
  buyerDocument: string;
  buyerName: string;
  previousOwnerDocument: string;
  previousOwnerName: string;
  acquisitionDate: string;
  acquisitionValue: string;
  minimumSaleValue: string;
  financedValue: string;
  internalNotes: string;
  provenance: string;
  spareKeyCount: string;
  manualCount: string;
  hasInspectionReport: boolean;
  hasPaidIpva: boolean;
  hasFines: boolean;
  hasLien: boolean;
  legalNotes: string;
}

interface FormState {
  name: string;
  brand: string;
  model: string;
  price: string;
  mileage: string;
  year: string;
  transmission: Transmission;
  fuel: Fuel;
  category: Category;
  color: string;
  city: string;
  badge: string;
  status: VehicleStatus;
  whatsappNumber: string;
  description: string;
  features: string;
  tags: string;
  isFeatured: boolean;
  active: boolean;
  internal: InternalFormState;
}

interface RowActionState {
  id: string;
  type: "toggle" | "delete";
}

interface ActionNotice {
  tone: "success" | "warning";
  title: string;
  description: string;
}

type DocumentBadge = VehicleDocumentStatusBadge;

const documentRequirementBadges: Array<{
  path: string;
  doneLabel: string;
  pendingLabel: string;
}> = [
  {
    path: "internal.plate",
    doneLabel: "Placa ok",
    pendingLabel: "Placa faltando",
  },
  {
    path: "internal.renavam",
    doneLabel: "Renavam ok",
    pendingLabel: "Renavam faltando",
  },
  {
    path: "internal.chassis",
    doneLabel: "Chassi ok",
    pendingLabel: "Chassi faltando",
  },
  {
    path: "internal.engineNumber",
    doneLabel: "Motor ok",
    pendingLabel: "Motor faltando",
  },
  {
    path: "internal.buyerName",
    doneLabel: "Comprador ok",
    pendingLabel: "Comprador faltando",
  },
  {
    path: "internal.buyerDocument",
    doneLabel: "Documento do comprador ok",
    pendingLabel: "Documento do comprador faltando",
  },
  {
    path: "internal.previousOwnerName",
    doneLabel: "Proprietário anterior ok",
    pendingLabel: "Proprietário anterior faltando",
  },
  {
    path: "internal.previousOwnerDocument",
    doneLabel: "Documento do proprietário ok",
    pendingLabel: "Documento do proprietário faltando",
  },
  {
    path: "price",
    doneLabel: "Valor de venda ok",
    pendingLabel: "Valor de venda faltando",
  },
  {
    path: "internal.acquisitionDate",
    doneLabel: "Data da operação ok",
    pendingLabel: "Data da operação faltando",
  },
];

const emptyInternalForm: InternalFormState = {
  plate: "",
  renavam: "",
  chassis: "",
  engineNumber: "",
  buyerDocument: "",
  buyerName: "",
  previousOwnerDocument: "",
  previousOwnerName: "",
  acquisitionDate: "",
  acquisitionValue: "",
  minimumSaleValue: "",
  financedValue: "",
  internalNotes: "",
  provenance: "",
  spareKeyCount: "",
  manualCount: "",
  hasInspectionReport: false,
  hasPaidIpva: false,
  hasFines: false,
  hasLien: false,
  legalNotes: "",
};

const emptyForm: FormState = {
  name: "",
  brand: "",
  model: "",
  price: "",
  mileage: "",
  year: String(new Date().getFullYear()),
  transmission: "Automático",
  fuel: "Flex",
  category: "Hatch",
  color: "",
  city: "",
  badge: "",
  status: "disponivel",
  whatsappNumber: WHATSAPP_NUMBER,
  description: "",
  features: "",
  tags: "",
  isFeatured: false,
  active: true,
  internal: emptyInternalForm,
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildVehicleSearchValue(car: Car) {
  return normalizeText(
    [
      car.name,
      car.brand,
      car.model,
      car.city,
      car.category,
      car.badge,
      car.status,
      car.active ? "ativo" : "inativo",
      car.isFeatured ? "destaque" : "",
      car.tags.join(" "),
      car.features.join(" "),
      String(car.year),
    ].join(" "),
  );
}

function buildFormFromCar(car: Car, overrides: Partial<FormState> = {}): FormState {
  const internal = car.internal;

  return {
    name: car.name,
    brand: car.brand,
    model: car.model,
    price: String(car.price),
    mileage: String(car.mileage),
    year: String(car.year),
    transmission: car.transmission,
    fuel: car.fuel,
    category: car.category,
    color: car.color,
    city: car.city,
    badge: car.badge,
    status: car.status,
    whatsappNumber: car.whatsappNumber,
    description: car.description,
    features: joinList(car.features),
    tags: joinList(car.tags),
    isFeatured: car.isFeatured,
    active: car.active,
    internal: {
      plate: coerceInputText(internal?.plate),
      renavam: coerceInputText(internal?.renavam),
      chassis: coerceInputText(internal?.chassis),
      engineNumber: coerceInputText(internal?.engineNumber),
      buyerDocument: coerceInputText(internal?.buyerDocument),
      buyerName: coerceInputText(internal?.buyerName),
      previousOwnerDocument: coerceInputText(internal?.previousOwnerDocument),
      previousOwnerName: coerceInputText(internal?.previousOwnerName),
      acquisitionDate: normalizeDateInputValue(internal?.acquisitionDate),
      acquisitionValue:
        typeof internal?.acquisitionValue === "number" && internal.acquisitionValue > 0
          ? String(internal.acquisitionValue)
          : "",
      minimumSaleValue:
        typeof internal?.minimumSaleValue === "number" && internal.minimumSaleValue > 0
          ? String(internal.minimumSaleValue)
          : "",
      financedValue:
        typeof internal?.financedValue === "number" && internal.financedValue > 0
          ? String(internal.financedValue)
          : "",
      internalNotes: coerceInputText(internal?.internalNotes),
      provenance: coerceInputText(internal?.provenance),
      spareKeyCount: coerceInputText(internal?.spareKeyCount),
      manualCount: coerceInputText(internal?.manualCount),
      hasInspectionReport: Boolean(internal?.hasInspectionReport),
      hasPaidIpva: Boolean(internal?.hasPaidIpva),
      hasFines: Boolean(internal?.hasFines),
      hasLien: Boolean(internal?.hasLien),
      legalNotes: coerceInputText(internal?.legalNotes),
    },
    ...overrides,
  };
}

function cloneDraftImages(images: Car["images"]) {
  return normalizeVehicleImages(images).map((image) => ({ ...image }));
}

function getDuplicateName(name: string) {
  return /\bcópia\b/i.test(name) ? name : `${name} - Cópia`;
}

function parseList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(items: string[]) {
  return items.join("\n");
}

function coerceInputText(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function safeTrim(value: unknown) {
  return coerceInputText(value).trim();
}

function normalizeDateInputValue(value: unknown) {
  const normalized = safeTrim(value);
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year] = normalized.split("-");
    const numericYear = Number(year);

    if (Number.isFinite(numericYear) && numericYear >= 1900 && numericYear <= 2100) {
      return normalized;
    }

    return "";
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getUTCFullYear();
  if (year < 1900 || year > 2100) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function parseOptionalNumber(value: unknown) {
  const parsed = Number(safeTrim(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildInternalPayload(internal: InternalFormState): VehicleInternalData {
  return {
    plate: safeTrim(internal.plate),
    renavam: safeTrim(internal.renavam),
    chassis: safeTrim(internal.chassis),
    engineNumber: safeTrim(internal.engineNumber),
    buyerDocument: safeTrim(internal.buyerDocument),
    buyerName: safeTrim(internal.buyerName),
    previousOwnerDocument: safeTrim(internal.previousOwnerDocument),
    previousOwnerName: safeTrim(internal.previousOwnerName),
    acquisitionDate: normalizeDateInputValue(internal.acquisitionDate),
    acquisitionValue: parseOptionalNumber(internal.acquisitionValue),
    minimumSaleValue: parseOptionalNumber(internal.minimumSaleValue),
    financedValue: parseOptionalNumber(internal.financedValue),
    internalNotes: safeTrim(internal.internalNotes),
    provenance: safeTrim(internal.provenance),
    spareKeyCount: safeTrim(internal.spareKeyCount),
    manualCount: safeTrim(internal.manualCount),
    hasInspectionReport: internal.hasInspectionReport,
    hasPaidIpva: internal.hasPaidIpva,
    hasFines: internal.hasFines,
    hasLien: internal.hasLien,
    legalNotes: safeTrim(internal.legalNotes),
  };
}

function buildDocumentBadges(internal: InternalFormState): DocumentBadge[] {
  return [
    {
      done: Boolean(safeTrim(internal.plate)),
      doneLabel: "Placa preenchida",
      pendingLabel: "Placa faltando",
    },
    {
      done: Boolean(safeTrim(internal.renavam)),
      doneLabel: "Renavam preenchido",
      pendingLabel: "Renavam faltando",
    },
    {
      done: Boolean(safeTrim(internal.chassis)),
      doneLabel: "Chassi preenchido",
      pendingLabel: "Chassi faltando",
    },
    {
      done: Boolean(safeTrim(internal.acquisitionDate) || safeTrim(internal.acquisitionValue)),
      doneLabel: "Aquisição registrada",
      pendingLabel: "Aquisição faltando",
    },
    {
      done: internal.hasPaidIpva,
      doneLabel: "IPVA marcado",
      pendingLabel: "IPVA não marcado",
    },
    {
      done: internal.hasInspectionReport,
      doneLabel: "Laudo marcado",
      pendingLabel: "Laudo não marcado",
    },
  ];
}

function buildDocumentReadinessBadges(
  readiness: VehicleDocumentReadiness | null,
): DocumentBadge[] {
  if (!readiness) {
    return documentRequirementBadges.map((item) => ({
      done: false,
      doneLabel: item.doneLabel,
      pendingLabel: item.pendingLabel,
    }));
  }

  const missingFields = new Set(readiness?.missingFields ?? []);

  return documentRequirementBadges.map((item) => ({
    done: !missingFields.has(item.path),
    doneLabel: item.doneLabel,
    pendingLabel: item.pendingLabel,
  }));
}

function getDocumentRequirementLabel(path: string) {
  const requirement = documentRequirementBadges.find((item) => item.path === path);
  return requirement?.pendingLabel ?? path;
}

function buildDocumentPayloadSummary(payload: VehicleSaleDocumentPayload | null) {
  if (!payload) return [];

  return [
    {
      label: "Veículo",
      value: `${payload.vehicle.name} ${payload.vehicle.year}`.trim(),
    },
    {
      label: "Placa",
      value: payload.vehicle.plate || "Não informada",
    },
    {
      label: "Venda",
      value: formatPrice(payload.transaction.salePrice),
    },
    {
      label: "Data",
      value: payload.transaction.acquisitionDate || "Não informada",
    },
    {
      label: "Comprador",
      value: payload.buyer.name || "Não informado",
    },
    {
      label: "Documento",
      value: payload.buyer.document || "Não informado",
    },
    {
      label: "Anterior",
      value: payload.previousOwner.name || "Não informado",
    },
    {
      label: "Procedência",
      value: payload.documentation.provenance || "Não informada",
    },
  ];
}

function buildDocumentFormStateKey(form: FormState) {
  return JSON.stringify({
    name: safeTrim(form.name),
    brand: safeTrim(form.brand),
    model: safeTrim(form.model),
    price: safeTrim(form.price),
    year: safeTrim(form.year),
    mileage: safeTrim(form.mileage),
    fuel: form.fuel,
    transmission: form.transmission,
    color: safeTrim(form.color),
    internal: buildInternalPayload(form.internal),
  });
}

function buildEditorStateKey(
  form: FormState,
  existingImages: VehicleImage[],
  pendingUploads: PendingUploadItem[],
) {
  return JSON.stringify({
    form: {
      name: safeTrim(form.name),
      brand: safeTrim(form.brand),
      model: safeTrim(form.model),
      price: safeTrim(form.price),
      mileage: safeTrim(form.mileage),
      year: safeTrim(form.year),
      transmission: form.transmission,
      fuel: form.fuel,
      category: form.category,
      color: safeTrim(form.color),
      city: safeTrim(form.city),
      badge: safeTrim(form.badge),
      status: form.status,
      whatsappNumber: safeTrim(form.whatsappNumber),
      description: safeTrim(form.description),
      features: safeTrim(form.features),
      tags: safeTrim(form.tags),
      isFeatured: form.isFeatured,
      active: form.active,
      internal: buildInternalPayload(form.internal),
    },
    existingImages: normalizeVehicleImages(existingImages).map((image, index) => ({
      key: createExistingImageId(image, index),
      url: image.url,
      publicId: image.publicId?.trim() ?? "",
      isCover: Boolean(image.isCover),
    })),
    pendingUploads: pendingUploads.map((item, index) => ({
      key: item.id || `pending-${index}`,
      name: item.file.name,
      size: item.file.size,
      type: item.file.type,
      lastModified: item.file.lastModified,
      isCover: Boolean(item.image.isCover),
    })),
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });
}

async function uploadVehicleImages(files: File[]): Promise<VehicleImage[]> {
  const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const token = getStoredAdminToken();

  if (!apiUrl) {
    throw new Error("VITE_API_URL não configurada para upload.");
  }
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/upload/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor de upload. Verifique VITE_API_URL, backend online e CORS.",
    );
  }

  if (!response.ok) {
    let message = "Falha ao enviar imagens";

    try {
      const errorPayload = await response.json();
      if (
        errorPayload &&
        typeof errorPayload === "object" &&
        "message" in errorPayload &&
        typeof errorPayload.message === "string"
      ) {
        message = errorPayload.message;
      }
    } catch {
      /* ignore malformed error payloads */
    }

    throw new Error(message);
  }

  let json: unknown;

  try {
    json = await response.json();
  } catch {
    throw new Error("Resposta inválida do servidor de upload.");
  }

  const uploadedRaw = Array.isArray(json)
    ? json
    : json && typeof json === "object" && "images" in json && Array.isArray(json.images)
      ? json.images
      : [];

  const uploaded = normalizeVehicleImages(uploadedRaw);

  if (!uploaded.length) {
    throw new Error("Nenhuma imagem válida foi retornada pelo servidor.");
  }

  return uploaded;
}

async function deleteVehicleImages(publicIds: string[]) {
  const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const token = getStoredAdminToken();

  if (!apiUrl || !publicIds.length) return;
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/upload/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicIds }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor para excluir imagens. Verifique VITE_API_URL, backend online e CORS.",
    );
  }

  let json = null as unknown;

  try {
    json = await response.json();
  } catch {
    /* ignore non-json cleanup responses */
  }

  const failed =
    json && typeof json === "object" && "failed" in json && Array.isArray(json.failed)
      ? json.failed
      : [];

  if (!response.ok || failed.length) {
    throw new Error("Não foi possível excluir todas as imagens antigas do Cloudinary.");
  }
}

function createExistingImageId(image: VehicleImage, index: number) {
  return image.publicId?.trim() || `existing-${index}-${image.url}`;
}

function normalizeAdminImageItems(items: AdminImageItem[]) {
  const normalizedImages = ensureSingleCover(items.map((item) => item.image));

  return items.map((item, index) => ({
    ...item,
    image: normalizedImages[index],
    previewUrl:
      item.kind === "existing" ? getVehicleImageUrl(normalizedImages[index]) : item.previewUrl,
  }));
}

function buildAdminImageItems(
  existingImages: VehicleImage[],
  pendingUploads: PendingUploadItem[],
): AdminImageItem[] {
  return normalizeAdminImageItems([
    ...existingImages.map((image, index) => ({
      id: createExistingImageId(image, index),
      kind: "existing" as const,
      image,
      previewUrl: getVehicleImageUrl(image),
    })),
    ...pendingUploads.map((item) => ({
      id: item.id,
      kind: "pending" as const,
      image: item.image,
      file: item.file,
      previewUrl: item.previewUrl,
    })),
  ]);
}

function AdminVeiculos() {
  const cars = useCars();
  const [open, setOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editorTab, setEditorTab] = useState<EditorTab>("commercial");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingImages, setExistingImages] = useState<VehicleImage[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [removedExistingImages, setRemovedExistingImages] = useState<VehicleImage[]>([]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [rowAction, setRowAction] = useState<RowActionState | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [highlightedCarId, setHighlightedCarId] = useState<string | null>(null);
  const [documentReadiness, setDocumentReadiness] = useState<VehicleDocumentReadiness | null>(
    null,
  );
  const [documentReadinessRequestedForId, setDocumentReadinessRequestedForId] = useState<
    string | null
  >(null);
  const [documentReadinessLoading, setDocumentReadinessLoading] = useState(false);
  const [documentWorkflowLoading, setDocumentWorkflowLoading] = useState(false);
  const [documentWorkflowResetLoading, setDocumentWorkflowResetLoading] = useState(false);
  const [documentServiceError, setDocumentServiceError] = useState<string | null>(null);
  const [documentWorkflowResult, setDocumentWorkflowResult] =
    useState<VehicleSaleContractWorkflowResult | null>(null);
  const [documentDrawerOpen, setDocumentDrawerOpen] = useState(false);
  const [documentPayloadPreview, setDocumentPayloadPreview] =
    useState<VehicleSaleDocumentPayload | null>(null);
  const [documentPayloadPreviewLoading, setDocumentPayloadPreviewLoading] = useState(false);
  const [savedDocumentStateKey, setSavedDocumentStateKey] = useState<string | null>(null);
  const [savedEditorStateKey, setSavedEditorStateKey] = useState<string | null>(null);
  const [discardChangesDialogOpen, setDiscardChangesDialogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingUploadIdRef = useRef(0);
  const isSubmitting = submitStatus !== "idle";
  const hasBusyRow = Boolean(rowAction);

  const stats = useMemo(
    () => ({
      total: cars.length,
      active: cars.filter((car) => car.active).length,
      inactive: cars.filter((car) => !car.active).length,
      featured: cars.filter((car) => car.isFeatured).length,
      avgPrice: cars.length
        ? Math.round(cars.reduce((sum, car) => sum + car.price, 0) / cars.length)
        : 0,
    }),
    [cars],
  );

  const imageItems = useMemo(
    () => buildAdminImageItems(existingImages, pendingUploads),
    [existingImages, pendingUploads],
  );
  const currentEditorStateKey = useMemo(
    () => buildEditorStateKey(form, existingImages, pendingUploads),
    [existingImages, form, pendingUploads],
  );

  const documentBadges = useMemo(() => buildDocumentBadges(form.internal), [form.internal]);
  const completedDocumentBadges = documentBadges.filter((item) => item.done).length;
  const documentReadinessBadges = useMemo(
    () => buildDocumentReadinessBadges(documentReadiness),
    [documentReadiness],
  );
  const completedReadinessBadges = documentReadinessBadges.filter((item) => item.done).length;
  const currentDocumentStateKey = useMemo(() => buildDocumentFormStateKey(form), [form]);
  const documentNeedsSave = Boolean(
    editingId && savedDocumentStateKey && currentDocumentStateKey !== savedDocumentStateKey,
  );
  const editorHasUnsavedChanges = Boolean(
    open && savedEditorStateKey && currentEditorStateKey !== savedEditorStateKey,
  );
  const currentEditingCar = useMemo(
    () => (editingId ? cars.find((car) => car.id === editingId) ?? null : null),
    [cars, editingId],
  );
  const currentDocumentWorkflowState = currentEditingCar?.documentWorkflow?.saleContract ?? null;
  const currentDocumentWorkflowStatus: VehicleDocumentWorkflowStatus =
    currentDocumentWorkflowState?.status ?? "idle";
  const activeDocumentValidation = documentWorkflowResult?.validation ?? documentReadiness;
  const activeDocumentPayload = documentWorkflowResult?.payload ?? documentPayloadPreview;
  const activeDocumentMissingFields = activeDocumentValidation?.missingFields ?? [];
  const activeDocumentWarnings = activeDocumentValidation?.warnings ?? [];
  const isAutomationPending =
    currentDocumentWorkflowStatus === "pending" ||
    documentWorkflowResult?.automationStatus === "pending";
  const isAutomationCompleted = currentDocumentWorkflowStatus === "completed";
  const isAutomationCancelled = currentDocumentWorkflowStatus === "cancelled";
  const isAutomationFailed =
    currentDocumentWorkflowStatus === "failed" ||
    (currentDocumentWorkflowStatus === "idle" &&
      documentWorkflowResult?.automationStatus === "trigger_failed");
  const canResetDocumentWorkflow =
    !documentNeedsSave &&
    (currentDocumentWorkflowStatus === "pending" || currentDocumentWorkflowStatus === "failed");
  const documentPayloadSummary = useMemo(
    () => buildDocumentPayloadSummary(activeDocumentPayload),
    [activeDocumentPayload],
  );
  const documentWorkflowButtonState = documentWorkflowLoading
    ? "loading"
    : !documentNeedsSave && isAutomationPending
      ? "pending"
    : !documentNeedsSave && isAutomationCompleted
      ? "completed"
    : !documentNeedsSave && isAutomationCancelled
      ? "idle"
    : !documentNeedsSave && isAutomationFailed
      ? "failed"
    : !documentNeedsSave && documentWorkflowResult?.ready
      ? "completed"
    : !documentNeedsSave &&
        ((documentWorkflowResult && !documentWorkflowResult.ready) ||
          (!documentWorkflowResult && documentReadiness && !documentReadiness.ready))
      ? "blocked"
      : "idle";
  const documentWorkflowButtonLabel =
    documentWorkflowButtonState === "loading"
      ? "Validando..."
      : documentWorkflowButtonState === "pending"
        ? "Automação pendente"
      : documentWorkflowButtonState === "completed"
        ? "Workflow concluído"
        : documentWorkflowButtonState === "failed"
          ? "Workflow falhou"
        : documentWorkflowButtonState === "blocked"
          ? "Campos pendentes"
          : "Gerar pré-contrato";

  const filteredCars = useMemo(() => {
    const normalizedSearch = normalizeText(searchQuery);

    return cars.filter((car) => {
      const matchesSearch =
        !normalizedSearch || buildVehicleSearchValue(car).includes(normalizedSearch);
      const matchesActive =
        activeFilter === "all" || (activeFilter === "active" ? car.active : !car.active);
      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" ? car.isFeatured : !car.isFeatured);
      const matchesCategory = categoryFilter === "all" || car.category === categoryFilter;

      return matchesSearch && matchesActive && matchesFeatured && matchesCategory;
    });
  }, [activeFilter, cars, categoryFilter, featuredFilter, searchQuery]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    activeFilter !== "all" ||
    featuredFilter !== "all" ||
    categoryFilter !== "all";

  useEffect(() => {
    if (!actionNotice) return;

    const timeoutId = window.setTimeout(() => {
      setActionNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [actionNotice]);

  useEffect(() => {
    if (!highlightedCarId) return;

    const timeoutId = window.setTimeout(() => {
      setHighlightedCarId(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedCarId]);

  useEffect(() => {
    if (!open || !editorHasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editorHasUnsavedChanges, open]);

  useEffect(() => {
    if (!open || editorTab !== "internal" || !editingId || documentNeedsSave) {
      return;
    }

    if (documentReadinessRequestedForId === editingId || documentReadinessLoading) {
      return;
    }

    void refreshDocumentReadiness(editingId, { silent: true });
  }, [
    documentNeedsSave,
    documentReadinessLoading,
    documentReadinessRequestedForId,
    editingId,
    editorTab,
    open,
  ]);

  useEffect(() => {
    if (!open || !editingId) {
      return;
    }

    const syncVehicleWorkflowState = async () => {
      try {
        await getVehicleById(editingId);
      } catch {
        /* ignore background workflow polling errors */
      }
    };

    void syncVehicleWorkflowState();

    if (currentDocumentWorkflowStatus !== "pending") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void syncVehicleWorkflowState();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [currentDocumentWorkflowStatus, editingId, open]);

  function resetEditorState() {
    setOpen(false);
    setEditorMode("create");
    setEditorTab("commercial");
    setEditingId(null);
    setForm(emptyForm);
    setExistingImages([]);
    setPendingUploads([]);
    setRemovedExistingImages([]);
    setSubmitStatus("idle");
    setDocumentReadiness(null);
    setDocumentReadinessRequestedForId(null);
    setDocumentReadinessLoading(false);
    setDocumentWorkflowLoading(false);
    setDocumentServiceError(null);
    setDocumentWorkflowResult(null);
    setDocumentDrawerOpen(false);
    setDocumentPayloadPreview(null);
    setDocumentPayloadPreviewLoading(false);
    setSavedDocumentStateKey(null);
    setSavedEditorStateKey(null);
    setDiscardChangesDialogOpen(false);
  }

  function openNew() {
    resetEditorState();
    setEditorMode("create");
    setSavedEditorStateKey(buildEditorStateKey(emptyForm, [], []));
    setOpen(true);
  }

  function openEdit(car: Car) {
    const nextForm = buildFormFromCar(car);
    setEditorMode("edit");
    setEditorTab("commercial");
    setEditingId(car.id);
    setForm(nextForm);
    setExistingImages(cloneDraftImages(car.images));
    setPendingUploads([]);
    setRemovedExistingImages([]);
    setSubmitStatus("idle");
    setDocumentReadiness(null);
    setDocumentReadinessRequestedForId(null);
    setDocumentServiceError(null);
    setDocumentWorkflowResult(null);
    setDocumentDrawerOpen(false);
    setDocumentPayloadPreview(null);
    setDocumentPayloadPreviewLoading(false);
    setSavedDocumentStateKey(buildDocumentFormStateKey(nextForm));
    setSavedEditorStateKey(buildEditorStateKey(nextForm, car.images, []));
    setDiscardChangesDialogOpen(false);
    setOpen(true);
  }

  function openDuplicate(car: Car) {
    resetEditorState();
    const nextForm = buildFormFromCar(car, {
      name: getDuplicateName(car.name),
      active: false,
      isFeatured: false,
      status: "disponivel",
      internal: emptyInternalForm,
    });
    setEditorMode("duplicate");
    setEditorTab("commercial");
    setEditingId(null);
    setForm(nextForm);
    setExistingImages(cloneDraftImages(car.images));
    setPendingUploads([]);
    setRemovedExistingImages([]);
    setSubmitStatus("idle");
    setSavedDocumentStateKey(null);
    setSavedEditorStateKey(buildEditorStateKey(nextForm, car.images, []));
    setDiscardChangesDialogOpen(false);
    setOpen(true);
  }

  function close() {
    if (isSubmitting) return;
    if (editorHasUnsavedChanges) {
      setDiscardChangesDialogOpen(true);
      return;
    }
    resetEditorState();
  }

  function handleConfirmCloseEditor() {
    resetEditorState();
  }

  function handleKeepEditing() {
    setDiscardChangesDialogOpen(false);
  }

  function handleEditorBackdropClick() {
    if (isSubmitting || discardChangesDialogOpen) return;

    if (editorHasUnsavedChanges) {
      setDiscardChangesDialogOpen(true);
      return;
    }

    resetEditorState();
  }

  async function refreshDocumentReadiness(
    vehicleId: string,
    options: { silent?: boolean } = {},
  ) {
    setDocumentReadinessLoading(true);
    setDocumentServiceError(null);
    setDocumentReadinessRequestedForId(vehicleId);
    setDocumentWorkflowResult(null);

    try {
      const readiness = await getVehicleDocumentReadiness(vehicleId);
      setDocumentReadiness(readiness);

      if (!options.silent) {
        if (readiness.ready) {
          toast.success("Documentação pronta para contrato.");
        } else {
          toast.warning(
            `Faltam ${readiness.missingFields.length} campo(s) para gerar o pré-contrato.`,
          );
        }
      }

      return readiness;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível validar a documentação do veículo.";

      setDocumentReadiness(null);
      setDocumentServiceError(message);

      if (!options.silent) {
        toast.error(message);
      }

      return null;
    } finally {
      setDocumentReadinessLoading(false);
    }
  }

  async function loadDocumentPayloadPreview(
    vehicleId: string,
    options: { silent?: boolean } = {},
  ) {
    setDocumentPayloadPreviewLoading(true);

    try {
      const payload = await getVehicleDocumentPayload(vehicleId);
      setDocumentPayloadPreview(payload);
      return payload;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o resumo documental do veículo.";

      setDocumentPayloadPreview(null);
      setDocumentServiceError(message);

      if (!options.silent) {
        toast.error(message);
      }

      return null;
    } finally {
      setDocumentPayloadPreviewLoading(false);
    }
  }

  async function openDocumentDrawerForVehicle(
    vehicleId: string,
    payloadOverride?: VehicleSaleDocumentPayload | null,
  ) {
    setDocumentDrawerOpen(true);

    if (payloadOverride) {
      setDocumentPayloadPreviewLoading(false);
      setDocumentPayloadPreview(payloadOverride);
      return payloadOverride;
    }

    return loadDocumentPayloadPreview(vehicleId, { silent: true });
  }

  async function handleOpenDocumentSummary() {
    if (!editingId) {
      return;
    }

    await openDocumentDrawerForVehicle(editingId, documentWorkflowResult?.payload ?? null);
  }

  async function handleValidateDocumentation() {
    if (!editingId) {
      return toast.error("Salve o veículo primeiro para validar a documentação.");
    }

    if (documentNeedsSave) {
      return toast.error("Salve as alterações antes de validar a documentação.");
    }

    const readiness = await refreshDocumentReadiness(editingId);

    if (readiness) {
      await openDocumentDrawerForVehicle(editingId);
    }
  }

  async function handleStartSaleContract() {
    if (!editingId) {
      return toast.error("Salve o veículo primeiro para gerar o pré-contrato.");
    }

    if (documentNeedsSave) {
      return toast.error("Salve as alterações antes de gerar o pré-contrato.");
    }

    setDocumentWorkflowLoading(true);
    setDocumentServiceError(null);

    try {
      const workflowResult = await startSaleContractWorkflow(editingId);
      setDocumentWorkflowResult(workflowResult);
      setDocumentReadiness(workflowResult.validation);
      await getVehicleById(editingId);
      await openDocumentDrawerForVehicle(editingId, workflowResult.payload);

      if (workflowResult.ready && workflowResult.automationStatus === "pending") {
        toast.success("Pré-contrato preparado e automação solicitada ao n8n.");
      } else if (workflowResult.ready && workflowResult.automationStatus === "trigger_failed") {
        toast.warning("Pré-contrato preparado, mas a automação falhou ao disparar.");
      } else if (
        workflowResult.ready &&
        workflowResult.automationStatus === "skipped_not_configured"
      ) {
        toast.warning("Pré-contrato preparado, mas a automação não está configurada.");
      } else if (workflowResult.ready) {
        toast.success("Pré-contrato preparado com sucesso.");
      } else {
        toast.warning(
          `Campos pendentes para seguir com o pré-contrato: ${workflowResult.validation.missingFields.length}.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível iniciar o pré-contrato.";
      setDocumentServiceError(message);
      toast.error(message);
    } finally {
      setDocumentWorkflowLoading(false);
    }
  }

  async function handleResetSaleContractWorkflow() {
    if (!editingId) {
      return;
    }

    setDocumentWorkflowResetLoading(true);
    setDocumentServiceError(null);

    try {
      await resetSaleContractWorkflow(editingId);
      setDocumentWorkflowResult(null);
      setDocumentPayloadPreview(null);
      setDocumentPayloadPreviewLoading(false);
      setDocumentDrawerOpen(false);
      await getVehicleById(editingId);
      toast.success("Workflow resetado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível resetar o workflow.";
      setDocumentServiceError(message);
      toast.error(message);
    } finally {
      setDocumentWorkflowResetLoading(false);
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (isSubmitting) return;

    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    if (files.some((file) => file.size > 4 * 1024 * 1024)) {
      toast.error("Cada imagem deve ter no máximo 4MB.");
      event.target.value = "";
      return;
    }

    try {
      const previews = await Promise.all(files.map(readFileAsDataUrl));
      setPendingUploads((current) => [
        ...current,
        ...files.map((file, index) => ({
          id: `pending-${pendingUploadIdRef.current++}`,
          file,
          previewUrl: previews[index],
          image: { url: previews[index] },
        })),
      ]);
      event.target.value = "";
    } catch {
      toast.error("Não foi possível carregar as imagens.");
    }
  }

  function applyImageItems(items: AdminImageItem[]) {
    const normalizedItems = normalizeAdminImageItems(items);

    setExistingImages(
      normalizedItems.filter((item) => item.kind === "existing").map((item) => item.image),
    );
    setPendingUploads(
      normalizedItems
        .filter(
          (item): item is AdminImageItem & { kind: "pending"; file: File } =>
            item.kind === "pending" && Boolean(item.file),
        )
        .map((item) => ({
          id: item.id,
          file: item.file,
          previewUrl: item.previewUrl,
          image: item.image,
        })),
    );
  }

  function handleSetCover(id: string) {
    if (isSubmitting) return;

    const index = imageItems.findIndex((item) => item.id === id);
    if (index < 0) return;

    const nextImages = setCoverImage(
      imageItems.map((item) => item.image),
      index,
    );

    applyImageItems(
      imageItems.map((item, itemIndex) => ({
        ...item,
        image: nextImages[itemIndex],
      })),
    );
  }

  function handleMoveLeft(id: string) {
    if (isSubmitting) return;

    const index = imageItems.findIndex((item) => item.id === id);
    if (index <= 0) return;

    applyImageItems(moveImage(imageItems, index, index - 1));
  }

  function handleMoveRight(id: string) {
    if (isSubmitting) return;

    const index = imageItems.findIndex((item) => item.id === id);
    if (index < 0 || index >= imageItems.length - 1) return;

    applyImageItems(moveImage(imageItems, index, index + 1));
  }

  function handleRemoveImage(id: string) {
    if (isSubmitting) return;

    const item = imageItems.find((imageItem) => imageItem.id === id);
    if (!item) return;

    if (item.kind === "existing") {
      setRemovedExistingImages((current) => [...current, item.image]);
    }

    applyImageItems(imageItems.filter((imageItem) => imageItem.id !== id));
  }

  function updateInternalField<Key extends keyof InternalFormState>(
    key: Key,
    value: InternalFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      internal: {
        ...current.internal,
        [key]: value,
      },
    }));
  }

  function clearFilters() {
    setSearchQuery("");
    setActiveFilter("all");
    setFeaturedFilter("all");
    setCategoryFilter("all");
  }

  async function handleToggleActive(car: Car) {
    if (isSubmitting || hasBusyRow) return;

    const nextActive = !car.active;
    setRowAction({ id: car.id, type: "toggle" });

    try {
      const updatedCar = await updateVehicle(car.id, { active: nextActive });
      setHighlightedCarId(car.id);
      setActionNotice({
        tone: "success",
        title: nextActive ? "Veículo reativado" : "Veículo movido para inativos",
        description: nextActive
          ? `${updatedCar?.name ?? car.name} voltou para a operação do estoque.`
          : `${updatedCar?.name ?? car.name} saiu da vitrine sem abrir o formulário.`,
      });
      toast.success(nextActive ? "Veículo ativado." : "Veículo desativado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar o status do veículo.",
      );
    } finally {
      setRowAction(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    const name = form.name.trim();
    const brand = form.brand.trim();
    const model = form.model.trim();
    const price = Number(form.price);
    const mileage = Number(form.mileage);
    const year = Number(form.year);
    const features = parseList(form.features);
    const tags = parseList(form.tags);

    if (!name) {
      setEditorTab("commercial");
      return toast.error("Informe o nome do veículo.");
    }
    if (!brand) {
      setEditorTab("commercial");
      return toast.error("Informe a marca.");
    }
    if (!model) {
      setEditorTab("commercial");
      return toast.error("Informe o modelo.");
    }
    if (!Number.isFinite(price) || price <= 0) {
      setEditorTab("commercial");
      return toast.error("Preço inválido.");
    }
    if (!Number.isFinite(mileage) || mileage < 0) {
      setEditorTab("commercial");
      return toast.error("Quilometragem inválida.");
    }
    if (!Number.isFinite(year) || year < 1980 || year > 2100) {
      setEditorTab("commercial");
      return toast.error("Ano inválido.");
    }
    if (!imageItems.length) {
      setEditorTab("images");
      return toast.error("Adicione pelo menos uma imagem.");
    }

    try {
      const mode = editorMode;
      const removedImagesSnapshot = [...removedExistingImages];
      let nextImageItems = [...imageItems];

      if (pendingUploads.length > 0) {
        setSubmitStatus("uploading_images");
        const uploadedImages = await uploadVehicleImages(pendingUploads.map((item) => item.file));

        if (uploadedImages.length !== pendingUploads.length) {
          throw new Error("Quantidade de imagens retornadas pelo upload não confere.");
        }

        const uploadedMap = new Map(
          pendingUploads.map((item, index) => [
            item.id,
            {
              ...uploadedImages[index],
              isCover: imageItems.find((imageItem) => imageItem.id === item.id)?.image.isCover,
            } satisfies VehicleImage,
          ]),
        );

        nextImageItems = normalizeAdminImageItems(
          imageItems.map((item) => {
            if (item.kind === "existing") return item;

            const uploadedImage = uploadedMap.get(item.id);
            if (!uploadedImage) {
              throw new Error("Não foi possível vincular uma imagem enviada ao item pendente.");
            }

            return {
              id: uploadedImage.publicId?.trim() || item.id,
              kind: "existing" as const,
              image: uploadedImage,
              previewUrl: getVehicleImageUrl(uploadedImage),
            };
          }),
        );

        applyImageItems(nextImageItems);
      }

      setSubmitStatus("saving_vehicle");

      const finalImages = ensureSingleCover(nextImageItems.map((item) => item.image));

      const payload: CarInput = {
        name,
        brand,
        model,
        price,
        badge: form.badge.trim(),
        isFeatured: form.isFeatured,
        active: form.active,
        year,
        mileage,
        fuel: form.fuel,
        transmission: form.transmission,
        color: form.color.trim(),
        description: form.description.trim(),
        images: finalImages,
        features,
        category: form.category,
        city: form.city.trim(),
        status: form.status,
        whatsappNumber: form.whatsappNumber.trim() || WHATSAPP_NUMBER,
        tags,
        internal: buildInternalPayload(form.internal),
      };

      let savedVehicle: Car | undefined;

      if (editingId) {
        savedVehicle = await updateVehicle(editingId, payload);
        toast.success("Veículo atualizado.");
      } else {
        savedVehicle = await createVehicle(payload);
        toast.success(mode === "duplicate" ? "Cópia criada." : "Veículo adicionado.");
      }

      const savedVehicleId = savedVehicle?.id ?? editingId ?? null;
      setHighlightedCarId(savedVehicleId);
      setActionNotice({
        tone: "success",
        title:
          mode === "edit"
            ? "Alterações salvas"
            : mode === "duplicate"
              ? "Cópia pronta para operar"
              : "Veículo salvo com sucesso",
        description:
          mode === "duplicate"
            ? `${payload.name} foi criado como ${
                payload.active ? "ativo" : "inativo"
              } para você revisar antes de publicar.`
            : `${payload.name} já está com os dados atualizados no painel.`,
      });
      resetEditorState();

      const activePublicIds = new Set(
        finalImages
          .map((image) => image.publicId?.trim())
          .filter((publicId): publicId is string => Boolean(publicId)),
      );
      const removablePublicIds = [
        ...new Set(
          removedImagesSnapshot
            .map((image) => image.publicId?.trim())
            .filter((publicId): publicId is string => Boolean(publicId))
            .filter((publicId) => !activePublicIds.has(publicId)),
        ),
      ];

      if (removablePublicIds.length) {
        void deleteVehicleImages(removablePublicIds).catch((error) => {
          console.warn("[admin.veiculos] Cloudinary cleanup failed:", error);
          toast.warning(
            "Veículo salvo, mas algumas imagens antigas não puderam ser removidas do Cloudinary.",
          );
        });
      }
    } catch (error) {
      setSubmitStatus("idle");
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.",
      );
    }
  }

  async function handleDelete(car: Car) {
    if (!window.confirm(`Excluir "${car.name}"?`)) return;
    if (isSubmitting || hasBusyRow) return;

    const removablePublicIds = [
      ...new Set(
        normalizeVehicleImages(car.images)
          .map((image) => image.publicId?.trim())
          .filter((publicId): publicId is string => Boolean(publicId)),
      ),
    ];

    setRowAction({ id: car.id, type: "delete" });

    try {
      await deleteVehicle(car.id);
      toast.success("Veículo excluído.");
      setActionNotice({
        tone: "success",
        title: "Veículo removido",
        description: `${car.name} saiu do painel com sucesso.`,
      });

      if (removablePublicIds.length) {
        void deleteVehicleImages(removablePublicIds).catch((error) => {
          console.warn("[admin.veiculos] Cloudinary cleanup after delete failed:", error);
          toast.warning(
            "Veículo removido, mas algumas imagens não puderam ser limpas do Cloudinary.",
          );
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir.");
    } finally {
      setRowAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Inventário
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Gerenciar veículos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} veículos - {stats.active} ativos - {stats.featured} em destaque
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openNew}
            disabled={isSubmitting || hasBusyRow}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Novo veículo
          </button>
        </div>
      </header>

      {actionNotice && (
        <div
          className={`rounded-2xl border px-4 py-3 shadow-card ${
            actionNotice.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className={`mt-0.5 h-5 w-5 ${
                  actionNotice.tone === "success" ? "text-emerald-500" : "text-amber-500"
                }`}
              />
              <div>
                <p className="text-sm font-bold text-foreground">{actionNotice.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{actionNotice.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <Field label="Buscar veículo">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nome, marca, modelo, cidade, tag..."
                className="adm-input pl-10"
              />
            </div>
          </Field>

          <Field label="Estoque">
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
              className="adm-input"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </Field>

          <Field label="Destaque">
            <select
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value as FeaturedFilter)}
              className="adm-input"
            >
              <option value="all">Todos</option>
              <option value="featured">Em destaque</option>
              <option value="regular">Sem destaque</option>
            </select>
          </Field>

          <Field label="Categoria">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value === "all" ? "all" : (event.target.value as Category),
                )
              }
              className="adm-input"
            >
              <option value="all">Todas</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{filteredCars.length} visíveis</span>
            <span>-</span>
            <span>{stats.inactive} inativos no total</span>
            <span>-</span>
            <span>ticket médio {formatPrice(stats.avgPrice)}</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Veículo</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Cidade</th>
                <th className="px-4 py-3 text-right font-semibold">Ano</th>
                <th className="px-4 py-3 text-right font-semibold">KM</th>
                <th className="px-4 py-3 text-right font-semibold">Métricas</th>
                <th className="px-4 py-3 text-right font-semibold">Preço</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
                {filteredCars.map((car) => {
                  const status = statusMeta[car.status];
                  const metrics = getVehicleMetricsSummary(car);
                  const isRowBusy = rowAction?.id === car.id;
                const isHighlighted = highlightedCarId === car.id;
                return (
                  <tr
                    key={car.id}
                    className={`border-t border-border transition hover:bg-secondary/30 ${
                      isHighlighted ? "bg-emerald-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={getVehiclePrimaryImage(car)}
                            alt={car.name}
                            className="h-12 w-16 rounded-md object-cover"
                          />
                          <span
                            aria-label={status.label}
                            title={status.label}
                            className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ring-2 ring-card ${status.dot}`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{car.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {car.brand} - {car.model}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                              {car.category}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                car.active
                                  ? "bg-whatsapp/15 text-whatsapp"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {car.active ? "Ativo" : "Inativo"}
                            </span>
                            {car.isFeatured && (
                              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Destaque
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.pill}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {car.city || "Não informada"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {car.year}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatKm(car.mileage)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="tabular-nums">
                            {metrics?.views.toLocaleString("pt-BR") ?? 0}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-whatsapp">
                          <MessageCircle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                          <span className="tabular-nums">{metrics?.whatsappClicks ?? 0}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatPrice(car.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => openEdit(car)}
                          disabled={isSubmitting || hasBusyRow}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => openDuplicate(car)}
                          disabled={isSubmitting || hasBusyRow}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicar
                        </button>
                        <button
                          onClick={() => void handleToggleActive(car)}
                          disabled={isSubmitting || hasBusyRow}
                          className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            car.active
                              ? "border-amber-500/40 text-amber-500 hover:border-amber-500"
                              : "border-whatsapp/40 text-whatsapp hover:border-whatsapp"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {isRowBusy && rowAction?.type === "toggle"
                            ? "Salvando..."
                            : car.active
                              ? "Desativar"
                              : "Ativar"}
                        </button>
                        <button
                          onClick={() => void handleDelete(car)}
                          disabled={isSubmitting || hasBusyRow}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isRowBusy && rowAction?.type === "delete" ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {cars.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Nenhum veículo cadastrado.</p>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Adicionar primeiro veículo
          </button>
        </div>
      )}

      {cars.length > 0 && filteredCars.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-semibold text-foreground">
            Nenhum veículo encontrado com esses filtros.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste a busca ou limpe os filtros para voltar ao inventário completo.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={handleEditorBackdropClick}
        >
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-2xl border border-border bg-card shadow-card sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editorMode === "edit"
                    ? "Editar veículo"
                    : editorMode === "duplicate"
                      ? "Duplicar veículo"
                      : "Novo veículo"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comece pela aba comercial, salve rápido com imagens e volte depois para completar
                  os dados internos e documentais.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={isSubmitting}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Tabs
              value={editorTab}
              onValueChange={(value) => setEditorTab(value as EditorTab)}
              className="px-5 py-5"
            >
              <div className="space-y-4">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-secondary/60 p-1">
                  <TabsTrigger
                    value="commercial"
                    className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider"
                  >
                    Informações comerciais
                  </TabsTrigger>
                  <TabsTrigger
                    value="images"
                    className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider"
                  >
                    Imagens
                  </TabsTrigger>
                  <TabsTrigger
                    value="internal"
                    className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider"
                  >
                    Dados internos
                  </TabsTrigger>
                </TabsList>

                <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
                  Salve com comercial e imagens para publicar rápido. Os dados documentais ficam
                  isolados no admin e podem ser preenchidos depois sem quebrar a vitrine.
                </div>
              </div>

              <TabsContent value="commercial" className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="Nome de exibição">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="Ex: Honda Civic EXL"
                      className="adm-input"
                      required
                    />
                  </Field>
                  <Field label="Marca">
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(event) => setForm({ ...form, brand: event.target.value })}
                      placeholder="Ex: Honda"
                      className="adm-input"
                      required
                    />
                  </Field>
                  <Field label="Modelo">
                    <input
                      type="text"
                      value={form.model}
                      onChange={(event) => setForm({ ...form, model: event.target.value })}
                      placeholder="Ex: Civic"
                      className="adm-input"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Field label="Preço (R$)">
                    <input
                      type="number"
                      value={form.price}
                      onChange={(event) => setForm({ ...form, price: event.target.value })}
                      className="adm-input"
                      min={0}
                      step={1}
                      required
                    />
                  </Field>
                  <Field label="KM">
                    <input
                      type="number"
                      value={form.mileage}
                      onChange={(event) => setForm({ ...form, mileage: event.target.value })}
                      className="adm-input"
                      min={0}
                      required
                    />
                  </Field>
                  <Field label="Ano">
                    <input
                      type="number"
                      value={form.year}
                      onChange={(event) => setForm({ ...form, year: event.target.value })}
                      className="adm-input"
                      min={1980}
                      max={2100}
                      required
                    />
                  </Field>
                  <Field label="Selo principal">
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(event) => setForm({ ...form, badge: event.target.value })}
                      placeholder="Ex: BAIXA KM"
                      className="adm-input"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Field label="Câmbio">
                    <select
                      value={form.transmission}
                      onChange={(event) =>
                        setForm({ ...form, transmission: event.target.value as Transmission })
                      }
                      className="adm-input"
                    >
                      {transmissions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Combustível">
                    <select
                      value={form.fuel}
                      onChange={(event) => setForm({ ...form, fuel: event.target.value as Fuel })}
                      className="adm-input"
                    >
                      {fuels.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Categoria">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm({ ...form, category: event.target.value as Category })
                      }
                      className="adm-input"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm({ ...form, status: event.target.value as VehicleStatus })
                      }
                      className="adm-input"
                    >
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="Cor">
                    <input
                      type="text"
                      value={form.color}
                      onChange={(event) => setForm({ ...form, color: event.target.value })}
                      placeholder="Ex: Prata"
                      className="adm-input"
                    />
                  </Field>
                  <Field label="Cidade">
                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) => setForm({ ...form, city: event.target.value })}
                      placeholder="Ex: Juiz de Fora - MG"
                      className="adm-input"
                    />
                  </Field>
                  <Field label="WhatsApp da loja">
                    <input
                      type="text"
                      value={form.whatsappNumber}
                      onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })}
                      placeholder="5532999264848"
                      className="adm-input"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ToggleField
                    label="Destaque"
                    checked={form.isFeatured}
                    onChange={(checked) => setForm({ ...form, isFeatured: checked })}
                  />
                  <ToggleField
                    label="Ativo no estoque"
                    checked={form.active}
                    onChange={(checked) => setForm({ ...form, active: checked })}
                  />
                </div>

                <Field label="Descrição do veículo">
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Descreva o estado, histórico e diferenciais do veículo."
                    className="adm-input min-h-[110px] resize-y"
                    rows={5}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Itens e opcionais (vírgula ou quebra de linha)">
                    <textarea
                      value={form.features}
                      onChange={(event) => setForm({ ...form, features: event.target.value })}
                      placeholder="Ex: Ar-condicionado, Câmera de ré, Multimídia"
                      className="adm-input min-h-[100px] resize-y"
                      rows={4}
                    />
                  </Field>
                  <Field label="Tags comerciais (vírgula ou quebra de linha)">
                    <textarea
                      value={form.tags}
                      onChange={(event) => setForm({ ...form, tags: event.target.value })}
                      placeholder="Ex: Unico dono, Revisado, IPVA pago"
                      className="adm-input min-h-[100px] resize-y"
                      rows={4}
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-5 space-y-4">
                <section className="rounded-2xl border border-border/60 bg-background/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">Galeria do veículo</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Defina a capa, ordene a sequência e remova imagens antigas sem sair do fluxo
                        rápido de cadastro.
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {imageItems.length} {imageItems.length === 1 ? "imagem" : "imagens"}
                    </span>
                  </div>
                </section>

                <Field label="Imagens">
                  <div className="space-y-3">
                    {imageItems.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground">
                          {imageItems.length}{" "}
                          {imageItems.length === 1 ? "imagem pronta" : "imagens prontas"}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {imageItems.map((item, index) => {
                            const isFirst = index === 0;
                            const isLast = index === imageItems.length - 1;
                            const isCover = Boolean(item.image.isCover);

                            return (
                              <div
                                key={item.id}
                                className={`relative rounded-xl border p-2 ${
                                  isCover ? "border-primary shadow-red" : "border-border"
                                }`}
                              >
                                <div className="relative overflow-hidden rounded-lg">
                                  <img
                                    src={item.previewUrl}
                                    alt={`Imagem ${index + 1}`}
                                    className="h-32 w-full object-cover"
                                  />
                                  <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                                    <span
                                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                        isCover
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-black/70 text-white"
                                      }`}
                                    >
                                      {isCover ? "Capa" : `Imagem ${index + 1}`}
                                    </span>
                                    <span className="rounded-full bg-background/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                                      {item.kind === "existing" ? "Salva" : "Pendente"}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSetCover(item.id)}
                                    disabled={isSubmitting || isCover}
                                    className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isCover ? "Capa" : "Definir capa"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveLeft(item.id)}
                                    disabled={isSubmitting || isFirst}
                                    className="rounded-md border border-border px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={`Mover imagem ${index + 1} para a esquerda`}
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveRight(item.id)}
                                    disabled={isSubmitting || isLast}
                                    className="rounded-md border border-border px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={`Mover imagem ${index + 1} para a direita`}
                                  >
                                    →
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(item.id)}
                                    disabled={isSubmitting}
                                    className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground transition hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {removedExistingImages.length > 0 && (
                          <p className="text-xs text-amber-600">
                            {removedExistingImages.length}{" "}
                            {removedExistingImages.length === 1
                              ? "imagem marcada para remoção do veículo."
                              : "imagens marcadas para remoção do veículo."}{" "}
                            A exclusão física será tentada automaticamente após salvar.
                          </p>
                        )}
                      </>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={isSubmitting}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Upload className="h-4 w-4" />
                        Adicionar imagem
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFile}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      As novas imagens serão enviadas para o backend quando você salvar o veículo.
                    </p>
                  </div>
                </Field>
              </TabsContent>

              <TabsContent value="internal" className="mt-5 space-y-4">
                <section className="rounded-2xl border border-dashed border-border bg-background/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Opcional agora, útil para contrato e automações futuras
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Esses dados não aparecem na vitrine pública. Você pode salvar o comercial
                        agora e completar a documentação depois.
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {completedDocumentBadges}/{documentBadges.length} marcadores
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {documentBadges.map((item) => (
                      <span
                        key={item.doneLabel}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          item.done
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {item.done ? item.doneLabel : item.pendingLabel}
                      </span>
                    ))}
                  </div>
                </section>

                <VehicleDocumentStatusCard
                  hasPersistedVehicle={Boolean(editingId)}
                  documentNeedsSave={documentNeedsSave}
                  documentServiceError={documentServiceError}
                  documentReadiness={documentReadiness}
                  documentReadinessLoading={documentReadinessLoading}
                  documentReadinessBadges={documentReadinessBadges}
                  completedReadinessBadges={completedReadinessBadges}
                  documentWorkflowLoading={documentWorkflowLoading}
                  documentWorkflowButtonState={documentWorkflowButtonState}
                  documentWorkflowButtonLabel={documentWorkflowButtonLabel}
                  documentWorkflowResult={documentWorkflowResult}
                  currentDocumentWorkflowState={currentDocumentWorkflowState}
                  vehicleId={currentEditingCar?.id ?? null}
                  contractDownloadFileName={
                    currentEditingCar ? `contrato-${currentEditingCar.id}.pdf` : "contrato.pdf"
                  }
                  isSubmitting={isSubmitting}
                  canResetWorkflow={canResetDocumentWorkflow}
                  isResettingWorkflow={documentWorkflowResetLoading}
                  onValidate={() => void handleValidateDocumentation()}
                  onStartWorkflow={() => void handleStartSaleContract()}
                  onOpenSummary={() => void handleOpenDocumentSummary()}
                  onResetWorkflow={() => void handleResetSaleContractWorkflow()}
                />

                <section className="space-y-4 rounded-2xl border border-border/60 bg-background/20 p-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Identificação veicular</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Campos-base para conferência e preparação contratual.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Placa">
                      <input
                        type="text"
                        value={form.internal.plate}
                        onChange={(event) => updateInternalField("plate", event.target.value)}
                        placeholder="Ex: ABC1D23"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Renavam">
                      <input
                        type="text"
                        value={form.internal.renavam}
                        onChange={(event) => updateInternalField("renavam", event.target.value)}
                        placeholder="Número do renavam"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Chassi">
                      <input
                        type="text"
                        value={form.internal.chassis}
                        onChange={(event) => updateInternalField("chassis", event.target.value)}
                        placeholder="Número do chassi"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Número do motor">
                      <input
                        type="text"
                        value={form.internal.engineNumber}
                        onChange={(event) =>
                          updateInternalField("engineNumber", event.target.value)
                        }
                        placeholder="Número do motor"
                        className="adm-input"
                      />
                    </Field>
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-border/60 bg-background/20 p-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Partes e procedência</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Informações de comprador, proprietário anterior e origem do veículo.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Nome do comprador">
                      <input
                        type="text"
                        value={form.internal.buyerName}
                        onChange={(event) => updateInternalField("buyerName", event.target.value)}
                        placeholder="Nome completo"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Documento do comprador">
                      <input
                        type="text"
                        value={form.internal.buyerDocument}
                        onChange={(event) =>
                          updateInternalField("buyerDocument", event.target.value)
                        }
                        placeholder="CPF ou CNPJ"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Nome do proprietário anterior">
                      <input
                        type="text"
                        value={form.internal.previousOwnerName}
                        onChange={(event) =>
                          updateInternalField("previousOwnerName", event.target.value)
                        }
                        placeholder="Nome completo"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Documento do proprietário anterior">
                      <input
                        type="text"
                        value={form.internal.previousOwnerDocument}
                        onChange={(event) =>
                          updateInternalField("previousOwnerDocument", event.target.value)
                        }
                        placeholder="CPF ou CNPJ"
                        className="adm-input"
                      />
                    </Field>
                  </div>
                  <Field label="Procedência">
                    <input
                      type="text"
                      value={form.internal.provenance}
                      onChange={(event) => updateInternalField("provenance", event.target.value)}
                      placeholder="Ex: Troca, repasse, compra direta, consignado"
                      className="adm-input"
                    />
                  </Field>
                </section>

                <section className="space-y-4 rounded-2xl border border-border/60 bg-background/20 p-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Compra e limites internos</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use esses campos para controle financeiro e margem mínima de operação.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Data de aquisição">
                      <input
                        type="date"
                        value={form.internal.acquisitionDate}
                        onChange={(event) =>
                          updateInternalField("acquisitionDate", event.target.value)
                        }
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Valor de aquisição (R$)">
                      <input
                        type="number"
                        value={form.internal.acquisitionValue}
                        onChange={(event) =>
                          updateInternalField("acquisitionValue", event.target.value)
                        }
                        className="adm-input"
                        min={0}
                        step={1}
                      />
                    </Field>
                    <Field label="Valor mínimo de venda (R$)">
                      <input
                        type="number"
                        value={form.internal.minimumSaleValue}
                        onChange={(event) =>
                          updateInternalField("minimumSaleValue", event.target.value)
                        }
                        className="adm-input"
                        min={0}
                        step={1}
                      />
                    </Field>
                    <Field label="Valor financiado (R$)">
                      <input
                        type="number"
                        value={form.internal.financedValue}
                        onChange={(event) =>
                          updateInternalField("financedValue", event.target.value)
                        }
                        className="adm-input"
                        min={0}
                        step={1}
                      />
                    </Field>
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-border/60 bg-background/20 p-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Itens, situação e observações
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Controle rápido do pacote documental e eventuais pendências jurídicas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Quantidade de chaves">
                      <input
                        type="text"
                        value={form.internal.spareKeyCount}
                        onChange={(event) =>
                          updateInternalField("spareKeyCount", event.target.value)
                        }
                        placeholder="Ex: 1 reserva"
                        className="adm-input"
                      />
                    </Field>
                    <Field label="Manual">
                      <input
                        type="text"
                        value={form.internal.manualCount}
                        onChange={(event) => updateInternalField("manualCount", event.target.value)}
                        placeholder="Ex: Original"
                        className="adm-input"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ToggleField
                      label="Laudo cautelar"
                      checked={form.internal.hasInspectionReport}
                      onChange={(checked) => updateInternalField("hasInspectionReport", checked)}
                    />
                    <ToggleField
                      label="IPVA pago"
                      checked={form.internal.hasPaidIpva}
                      onChange={(checked) => updateInternalField("hasPaidIpva", checked)}
                    />
                    <ToggleField
                      label="Possui multas"
                      checked={form.internal.hasFines}
                      onChange={(checked) => updateInternalField("hasFines", checked)}
                    />
                    <ToggleField
                      label="Possui gravame"
                      checked={form.internal.hasLien}
                      onChange={(checked) => updateInternalField("hasLien", checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Observações internas">
                      <textarea
                        value={form.internal.internalNotes}
                        onChange={(event) =>
                          updateInternalField("internalNotes", event.target.value)
                        }
                        placeholder="Notas operacionais, combinados internos e pontos de atenção."
                        className="adm-input min-h-[120px] resize-y"
                        rows={5}
                      />
                    </Field>
                    <Field label="Observações legais">
                      <textarea
                        value={form.internal.legalNotes}
                        onChange={(event) => updateInternalField("legalNotes", event.target.value)}
                        placeholder="Restrições, pendências ou observações jurídicas do contrato."
                        className="adm-input min-h-[120px] resize-y"
                        rows={5}
                      />
                    </Field>
                  </div>
                </section>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 border-t border-border bg-background/40 px-5 py-4">
              <button
                type="button"
                onClick={close}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitStatus === "uploading_images"
                  ? "Enviando imagens..."
                  : submitStatus === "saving_vehicle"
                    ? editorMode === "edit"
                      ? "Salvando..."
                      : editorMode === "duplicate"
                        ? "Criando cópia..."
                        : "Adicionando..."
                    : editorMode === "edit"
                      ? "Salvar"
                      : editorMode === "duplicate"
                        ? "Criar cópia"
                        : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <AlertDialog open={discardChangesDialogOpen} onOpenChange={setDiscardChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              O cadastro tem campos preenchidos que ainda não foram salvos. Se você sair agora,
              tudo o que foi digitado nesta tela será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepEditing}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCloseEditor}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VehicleSaleContractDraftModal
        open={documentDrawerOpen}
        onOpenChange={setDocumentDrawerOpen}
        onClose={() => setDocumentDrawerOpen(false)}
        documentNeedsSave={documentNeedsSave}
        activeDocumentValidation={activeDocumentValidation}
        activeDocumentMissingFields={activeDocumentMissingFields}
        activeDocumentWarnings={activeDocumentWarnings}
        activeDocumentPayload={activeDocumentPayload}
        documentPayloadPreviewLoading={documentPayloadPreviewLoading}
        documentPayloadSummary={documentPayloadSummary}
        documentWorkflowResult={documentWorkflowResult}
        currentDocumentWorkflowState={currentDocumentWorkflowState}
        getDocumentRequirementLabel={getDocumentRequirementLabel}
      />

      <style>{`
        .adm-input {
          width: 100%;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          transition: border-color 0.15s;
        }
        .adm-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[oklch(0.62_0.24_25)]"
      />
    </label>
  );
}
