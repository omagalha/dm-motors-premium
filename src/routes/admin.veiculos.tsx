import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { formatKm, formatPrice } from "@/data/cars";
import { resetCars, useCars, type Car, type CarInput } from "@/data/carsStore";
import { getCarInsights } from "@/data/insights";
import {
  ensureSingleCover,
  getVehicleImageUrl,
  getVehiclePrimaryImage,
  moveImage,
  normalizeVehicleImages,
  setCoverImage,
} from "@/lib/vehicles";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { createVehicle, deleteVehicle, updateVehicle } from "@/services/vehicleService";
import type {
  Category,
  Fuel,
  Transmission,
  VehicleImage,
  VehicleStatus,
} from "@/types/vehicle";
import { Pencil, Plus, Trash2, X, Upload, RotateCcw, Eye, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const statusMeta: Record<VehicleStatus, { label: string; dot: string; pill: string }> = {
  disponivel: {
    label: "Disponivel",
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
      { title: "Veiculos - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminVeiculos,
});

const transmissions: Transmission[] = ["Automático", "Manual", "Nao informado"];
const fuels: Fuel[] = ["Flex", "Gasolina", "Diesel", "Nao informado"];
const categories: Category[] = ["Hatch", "Sedan", "SUV", "Picape", "Nao informado"];
const statuses: VehicleStatus[] = ["disponivel", "reservado", "vendido"];
type SubmitStatus = "idle" | "uploading_images" | "saving_vehicle";

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
}

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
};

function parseList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(items: string[]) {
  return items.join("\n");
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

  if (!apiUrl) {
    throw new Error("VITE_API_URL nao configurada para upload.");
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`${apiUrl}/upload/images`, {
    method: "POST",
    body: formData,
  });

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
    throw new Error("Resposta invalida do servidor de upload.");
  }

  const uploadedRaw = Array.isArray(json)
    ? json
    : json &&
        typeof json === "object" &&
        "images" in json &&
        Array.isArray(json.images)
      ? json.images
      : [];

  const uploaded = normalizeVehicleImages(uploadedRaw);

  if (!uploaded.length) {
    throw new Error("Nenhuma imagem valida foi retornada pelo servidor.");
  }

  return uploaded;
}

async function deleteVehicleImages(publicIds: string[]) {
  const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

  if (!apiUrl || !publicIds.length) return;

  const response = await fetch(`${apiUrl}/upload/images`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ publicIds }),
  });

  let json = null as unknown;

  try {
    json = await response.json();
  } catch {
    /* ignore non-json cleanup responses */
  }

  const failed =
    json &&
    typeof json === "object" &&
    "failed" in json &&
    Array.isArray(json.failed)
      ? json.failed
      : [];

  if (!response.ok || failed.length) {
    throw new Error("Nao foi possivel excluir todas as imagens antigas do Cloudinary.");
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
  const insights = getCarInsights(cars);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingImages, setExistingImages] = useState<VehicleImage[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [removedExistingImages, setRemovedExistingImages] = useState<VehicleImage[]>([]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingUploadIdRef = useRef(0);
  const isSubmitting = submitStatus !== "idle";

  const stats = useMemo(
    () => ({
      total: cars.length,
      avgPrice: cars.length
        ? Math.round(cars.reduce((sum, car) => sum + car.price, 0) / cars.length)
        : 0,
    }),
    [cars]
  );

  const imageItems = useMemo(
    () => buildAdminImageItems(existingImages, pendingUploads),
    [existingImages, pendingUploads]
  );

  function resetEditorState() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setExistingImages([]);
    setPendingUploads([]);
    setRemovedExistingImages([]);
    setSubmitStatus("idle");
  }

  function openNew() {
    resetEditorState();
    setOpen(true);
  }

  function openEdit(car: Car) {
    setEditingId(car.id);
    setForm({
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
    });
    setExistingImages(normalizeVehicleImages(car.images).map((image) => ({ ...image })));
    setPendingUploads([]);
    setRemovedExistingImages([]);
    setSubmitStatus("idle");
    setOpen(true);
  }

  function close() {
    if (isSubmitting) return;
    resetEditorState();
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (isSubmitting) return;

    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    if (files.some((file) => file.size > 4 * 1024 * 1024)) {
      toast.error("Cada imagem deve ter no maximo 4MB.");
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
      toast.error("Nao foi possivel carregar as imagens.");
    }
  }

  function applyImageItems(items: AdminImageItem[]) {
    const normalizedItems = normalizeAdminImageItems(items);

    setExistingImages(
      normalizedItems
        .filter((item) => item.kind === "existing")
        .map((item) => item.image)
    );
    setPendingUploads(
      normalizedItems
        .filter((item): item is AdminImageItem & { kind: "pending"; file: File } =>
          item.kind === "pending" && Boolean(item.file)
        )
        .map((item) => ({
          id: item.id,
          file: item.file,
          previewUrl: item.previewUrl,
          image: item.image,
        }))
    );
  }

  function handleSetCover(id: string) {
    if (isSubmitting) return;

    const index = imageItems.findIndex((item) => item.id === id);
    if (index < 0) return;

    const nextImages = setCoverImage(
      imageItems.map((item) => item.image),
      index
    );

    applyImageItems(
      imageItems.map((item, itemIndex) => ({
        ...item,
        image: nextImages[itemIndex],
      }))
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

    if (!name) return toast.error("Informe o nome do veiculo.");
    if (!brand) return toast.error("Informe a marca.");
    if (!model) return toast.error("Informe o modelo.");
    if (!Number.isFinite(price) || price <= 0) return toast.error("Preco invalido.");
    if (!Number.isFinite(mileage) || mileage < 0) return toast.error("Quilometragem invalida.");
    if (!Number.isFinite(year) || year < 1980 || year > 2100) {
      return toast.error("Ano invalido.");
    }
    if (!imageItems.length) {
      return toast.error("Adicione pelo menos uma imagem.");
    }

    try {
      const removedImagesSnapshot = [...removedExistingImages];
      let nextImageItems = [...imageItems];

      if (pendingUploads.length > 0) {
        setSubmitStatus("uploading_images");
        const uploadedImages = await uploadVehicleImages(
          pendingUploads.map((item) => item.file)
        );

        if (uploadedImages.length !== pendingUploads.length) {
          throw new Error("Quantidade de imagens retornadas pelo upload nao confere.");
        }

        const uploadedMap = new Map(
          pendingUploads.map((item, index) => [
            item.id,
            {
              ...uploadedImages[index],
              isCover: imageItems.find((imageItem) => imageItem.id === item.id)?.image.isCover,
            } satisfies VehicleImage,
          ])
        );

        nextImageItems = normalizeAdminImageItems(
          imageItems.map((item) => {
            if (item.kind === "existing") return item;

            const uploadedImage = uploadedMap.get(item.id);
            if (!uploadedImage) {
              throw new Error("Nao foi possivel vincular uma imagem enviada ao item pendente.");
            }

            return {
              id: uploadedImage.publicId?.trim() || item.id,
              kind: "existing" as const,
              image: uploadedImage,
              previewUrl: getVehicleImageUrl(uploadedImage),
            };
          })
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
      };

      if (editingId) {
        await updateVehicle(editingId, payload);
        toast.success("Veiculo atualizado.");
      } else {
        await createVehicle(payload);
        toast.success("Veiculo adicionado.");
      }
      resetEditorState();

      const activePublicIds = new Set(
        finalImages
          .map((image) => image.publicId?.trim())
          .filter((publicId): publicId is string => Boolean(publicId))
      );
      const removablePublicIds = [
        ...new Set(
          removedImagesSnapshot
            .map((image) => image.publicId?.trim())
            .filter((publicId): publicId is string => Boolean(publicId))
            .filter((publicId) => !activePublicIds.has(publicId))
        ),
      ];

      if (removablePublicIds.length) {
        void deleteVehicleImages(removablePublicIds).catch((error) => {
          console.warn("[admin.veiculos] Cloudinary cleanup failed:", error);
          toast.warning(
            "Veiculo salvo, mas algumas imagens antigas nao puderam ser removidas do Cloudinary."
          );
        });
      }
    } catch (error) {
      setSubmitStatus("idle");
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar. Tente novamente.");
    }
  }

  async function handleDelete(car: Car) {
    if (!window.confirm(`Excluir "${car.name}"?`)) return;

    try {
      await deleteVehicle(car.id);
      toast.success("Veiculo excluido.");
    } catch {
      toast.error("Falha ao excluir.");
    }
  }

  function handleReset() {
    if (!window.confirm("Restaurar lista padrao? As alteracoes locais serao perdidas.")) {
      return;
    }
    resetCars();
    toast.success("Lista restaurada.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Inventario
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Gerenciar veiculos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} veiculos - ticket medio {formatPrice(stats.avgPrice)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Novo veiculo
          </button>
        </div>
      </header>

      <p className="rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
        Configure <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px] text-foreground">VITE_API_URL</code> no frontend para apontar para a API correta em cada ambiente.
      </p>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Veiculo</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Cidade</th>
                <th className="px-4 py-3 text-right font-semibold">Ano</th>
                <th className="px-4 py-3 text-right font-semibold">KM</th>
                <th className="px-4 py-3 text-right font-semibold">Metricas</th>
                <th className="px-4 py-3 text-right font-semibold">Preco</th>
                <th className="px-4 py-3 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => {
                const status = statusMeta[car.status];
                const metrics = insights[car.id];
                return (
                  <tr key={car.id} className="border-t border-border transition hover:bg-secondary/30">
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
                      {car.city || "Nao informada"}
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(car)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(car)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
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
          <p className="text-muted-foreground">Nenhum veiculo cadastrado.</p>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Adicionar primeiro veiculo
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-border bg-card shadow-card sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Editar veiculo" : "Novo veiculo"}
              </h2>
              <button
                type="button"
                onClick={close}
                disabled={isSubmitting}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Nome de exibicao">
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
                <Field label="Preco (R$)">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className="adm-input"
                    min={0}
                    step={100}
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
                <Field label="Cambio">
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
                <Field label="Combustivel">
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
                    onChange={(event) =>
                      setForm({ ...form, whatsappNumber: event.target.value })
                    }
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

              <Field label="Descricao do veiculo">
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Descreva o estado, historico e diferenciais do veiculo."
                  className="adm-input min-h-[110px] resize-y"
                  rows={5}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Itens e opcionais (virgula ou quebra de linha)">
                  <textarea
                    value={form.features}
                    onChange={(event) => setForm({ ...form, features: event.target.value })}
                    placeholder="Ex: Ar-condicionado, Camera de re, Multimidia"
                    className="adm-input min-h-[100px] resize-y"
                    rows={4}
                  />
                </Field>
                <Field label="Tags comerciais (virgula ou quebra de linha)">
                  <textarea
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    placeholder="Ex: Unico dono, Revisado, IPVA pago"
                    className="adm-input min-h-[100px] resize-y"
                    rows={4}
                  />
                </Field>
              </div>

              <Field label="Imagens">
                <div className="space-y-3">
                  {imageItems.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground">
                        {imageItems.length}{" "}
                        {imageItems.length === 1
                          ? "imagem pronta"
                          : "imagens prontas"}
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
                            ? "imagem marcada para remocao do veiculo."
                            : "imagens marcadas para remocao do veiculo."}{" "}
                          A exclusao fisica sera tentada automaticamente apos salvar.
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
                    As novas imagens serao enviadas para o backend quando voce salvar o veiculo.
                  </p>
                </div>
              </Field>
            </div>

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
                    ? editingId
                      ? "Salvando..."
                      : "Adicionando..."
                    : editingId
                      ? "Salvar"
                      : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      )}

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
