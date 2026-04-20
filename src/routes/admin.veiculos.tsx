import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { formatKm, formatPrice, type Car, type CarStatus, type Category, type Fuel, type Transmission } from "@/data/cars";
import { addCar, deleteCar, resetCars, updateCar, useCars, type CarInput } from "@/data/carsStore";
import { getCarInsights } from "@/data/insights";
import { Pencil, Plus, Trash2, X, Upload, RotateCcw, Eye, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const statusMeta: Record<CarStatus, { label: string; dot: string; pill: string }> = {
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
      { title: "Veículos — Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminVeiculos,
});

const transmissions: Transmission[] = ["Automático", "Manual"];
const fuels: Fuel[] = ["Flex", "Gasolina", "Diesel"];
const categories: Category[] = ["Hatch", "Sedan", "SUV"];

interface FormState {
  name: string;
  price: string;
  km: string;
  year: string;
  transmission: Transmission;
  fuel: Fuel;
  category: Category;
  color: string;
  description: string;
  features: string; // comma-separated
  image: string;
}

const emptyForm: FormState = {
  name: "",
  price: "",
  km: "",
  year: String(new Date().getFullYear()),
  transmission: "Automático",
  fuel: "Flex",
  category: "Hatch",
  color: "",
  description: "",
  features: "",
  image: "",
};

function AdminVeiculos() {
  const cars = useCars();
  const insights = getCarInsights();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(
    () => ({
      total: cars.length,
      avgPrice: cars.length
        ? Math.round(cars.reduce((s, c) => s + c.price, 0) / cars.length)
        : 0,
    }),
    [cars],
  );

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(car: Car) {
    setEditingId(car.id);
    setForm({
      name: car.name,
      price: String(car.price),
      km: String(car.km),
      year: String(car.year),
      transmission: car.transmission,
      fuel: car.fuel,
      category: car.category === "Picape" ? "SUV" : car.category,
      color: car.color === "—" ? "" : car.color,
      description: car.description ?? "",
      features: car.features?.join(", ") ?? "",
      image: car.image,
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 4MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const km = Number(form.km);
    const year = Number(form.year);

    if (!name) return toast.error("Informe o nome do carro.");
    if (!Number.isFinite(price) || price <= 0) return toast.error("Preço inválido.");
    if (!Number.isFinite(km) || km < 0) return toast.error("KM inválida.");
    if (!Number.isFinite(year) || year < 1980 || year > 2100)
      return toast.error("Ano inválido.");
    if (!form.image) return toast.error("Adicione uma imagem.");

    const brand = name.split(" ")[0] || "Outros";
    const features = form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    const payload: CarInput = {
      name,
      brand,
      year,
      km,
      price,
      transmission: form.transmission,
      category: form.category,
      fuel: form.fuel,
      color: form.color.trim() || "—",
      tag: "OPORTUNIDADE",
      image: form.image,
      description: form.description.trim() || undefined,
      features: features.length ? features : undefined,
    };

    if (editingId) {
      updateCar(editingId, payload);
      toast.success("Veículo atualizado.");
    } else {
      addCar(payload);
      toast.success("Veículo adicionado.");
    }
    close();
  }

  function handleDelete(car: Car) {
    if (!window.confirm(`Excluir "${car.name}"?`)) return;
    deleteCar(car.id);
    toast.success("Veículo excluído.");
  }

  function handleReset() {
    if (!window.confirm("Restaurar lista padrão? As alterações locais serão perdidas.")) return;
    resetCars();
    toast.success("Lista restaurada.");
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
            {stats.total} veículos · ticket médio {formatPrice(stats.avgPrice)}
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
            <Plus className="h-4 w-4" /> Novo veículo
          </button>
        </div>
      </header>

      <p className="rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
        ⚠️ Os dados são salvos apenas neste navegador. Para persistência real entre dispositivos, ative o Lovable Cloud.
      </p>

      {/* Unified table (responsive with horizontal scroll on mobile) */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Veículo</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Ano</th>
                <th className="px-4 py-3 text-right font-semibold">KM</th>
                <th className="px-4 py-3 text-right font-semibold">Métricas</th>
                <th className="px-4 py-3 text-right font-semibold">Preço</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => {
                const status = statusMeta[car.status ?? "disponivel"];
                const ins = insights[car.id];
                return (
                  <tr key={car.id} className="border-t border-border transition hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={car.image} alt={car.name} className="h-12 w-16 rounded-md object-cover" />
                          <span
                            aria-label={status.label}
                            title={status.label}
                            className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ring-2 ring-card ${status.dot}`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{car.name}</p>
                          <p className="text-xs text-muted-foreground">{car.transmission} · {car.fuel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{car.year}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatKm(car.km)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="tabular-nums">{ins?.views.toLocaleString("pt-BR") ?? 0}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-whatsapp">
                          <MessageCircle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                          <span className="tabular-nums">{ins?.whatsappClicks ?? 0}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{formatPrice(car.price)}</td>
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
          <p className="text-muted-foreground">Nenhum veículo cadastrado.</p>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Adicionar primeiro veículo
          </button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card shadow-card sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Editar veículo" : "Novo veículo"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <Field label="Nome do carro">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: VW Polo Highline"
                  className="adm-input"
                  required
                  maxLength={80}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço (R$)">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="96900"
                    className="adm-input"
                    min={0}
                    step={100}
                    required
                  />
                </Field>
                <Field label="KM">
                  <input
                    type="number"
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    placeholder="28000"
                    className="adm-input"
                    min={0}
                    required
                  />
                </Field>
                <Field label="Ano">
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="2022"
                    className="adm-input"
                    min={1980}
                    max={2100}
                    required
                  />
                </Field>
                <Field label="Câmbio">
                  <select
                    value={form.transmission}
                    onChange={(e) =>
                      setForm({ ...form, transmission: e.target.value as Transmission })
                    }
                    className="adm-input"
                  >
                    {transmissions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Combustível">
                  <select
                    value={form.fuel}
                    onChange={(e) => setForm({ ...form, fuel: e.target.value as Fuel })}
                    className="adm-input"
                  >
                    {fuels.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="adm-input"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Cor">
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Ex: Branco Cristal"
                  className="adm-input"
                  maxLength={40}
                />
              </Field>

              <Field label="Descrição do veículo">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva o estado, histórico, manutenções e diferenciais do veículo…"
                  className="adm-input min-h-[110px] resize-y"
                  rows={5}
                  maxLength={1500}
                />
              </Field>

              <Field label="Itens e opcionais (separados por vírgula)">
                <textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="Ex: Ar-condicionado, Câmera de ré, Multimídia, Rodas de liga leve"
                  className="adm-input min-h-[80px] resize-y"
                  rows={3}
                />
              </Field>

              <Field label="Imagem">
                <div className="space-y-3">
                  {form.image && (
                    <img
                      src={form.image}
                      alt="Pré-visualização"
                      className="h-40 w-full rounded-lg border border-border object-cover"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary"
                    >
                      <Upload className="h-4 w-4" />
                      {form.image ? "Trocar imagem" : "Enviar imagem"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFile}
                    />
                  </div>
                  <input
                    type="url"
                    value={form.image.startsWith("data:") ? "" : form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="ou cole uma URL https://…"
                    className="adm-input"
                  />
                </div>
              </Field>
            </div>

            <div className="flex gap-2 border-t border-border bg-background/40 px-5 py-4">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110"
              >
                {editingId ? "Salvar" : "Adicionar"}
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
