import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ContactRound, Mail, MessageCircle, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createContact,
  deleteContact,
  getContacts,
  getLeads,
  updateContact,
} from "@/services/crmService";
import type { Contact, ContactInput, Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/crm/contatos")({
  head: () => ({
    meta: [
      { title: "CRM Contatos - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCrmContatosPage,
});

function buildContactForm(): ContactInput {
  return {
    name: "",
    company: "",
    city: "",
    whatsapp: "",
    phones: "",
    emails: "",
    tags: "",
    assignedTo: "",
    notes: "",
    linkedLeadId: "",
  };
}

function formatDateTime(value: string) {
  if (!value) return "Sem data";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function AdminCrmContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ContactInput>(buildContactForm);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getContacts(search), getLeads("")])
      .then(([nextContacts, nextLeads]) => {
        if (cancelled) return;
        setContacts(nextContacts);
        setLeads(nextLeads);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar os contatos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  const contactsWithWhatsapp = useMemo(
    () => contacts.filter((contact) => Boolean(contact.whatsapp)),
    [contacts],
  );

  const contactsLinkedToLead = useMemo(
    () => contacts.filter((contact) => Boolean(contact.linkedLead?.id)),
    [contacts],
  );

  const contactsWithEmail = useMemo(
    () => contacts.filter((contact) => contact.emails.length > 0),
    [contacts],
  );

  function openCreateDialog() {
    setEditingContact(null);
    setForm(buildContactForm());
    setDialogOpen(true);
  }

  function openEditDialog(contact: Contact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      company: contact.company,
      city: contact.city,
      whatsapp: contact.whatsapp,
      phones: contact.phones.join(", "),
      emails: contact.emails.join(", "),
      tags: contact.tags.join(", "),
      assignedTo: contact.assignedTo,
      notes: contact.notes,
      linkedLeadId: contact.linkedLead?.id ?? "",
    });
    setDialogOpen(true);
  }

  async function reload() {
    const [nextContacts, nextLeads] = await Promise.all([getContacts(search), getLeads("")]);
    setContacts(nextContacts);
    setLeads(nextLeads);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (editingContact) {
        await updateContact(editingContact.id, form);
        toast.success("Contato atualizado.");
      } else {
        await createContact(form);
        toast.success("Contato adicionado a agenda.");
      }

      await reload();
      setDialogOpen(false);
      setEditingContact(null);
      setForm(buildContactForm());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nao foi possivel salvar o contato.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Remover o contato "${contact.name}"?`)) return;

    try {
      await deleteContact(contact.id);
      await reload();
      toast.success("Contato removido.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nao foi possivel remover o contato.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-card">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, empresa, telefone, e-mail ou tag"
            className="adm-input pl-10"
          />
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-red transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Novo contato
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Contatos"
          value={String(contacts.length)}
          hint="Agenda central do CRM"
          icon={<ContactRound className="h-5 w-5" />}
          accent="bg-primary/12 text-primary"
        />
        <MetricCard
          label="WhatsApp"
          value={String(contactsWithWhatsapp.length)}
          hint="Contatos com numero principal"
          icon={<MessageCircle className="h-5 w-5" />}
          accent="bg-emerald-500/12 text-emerald-400"
        />
        <MetricCard
          label="Com e-mail"
          value={String(contactsWithEmail.length)}
          hint="Prontos para contato multicanal"
          icon={<Mail className="h-5 w-5" />}
          accent="bg-white/8 text-foreground"
        />
        <MetricCard
          label="Ligados a lead"
          value={String(contactsLinkedToLead.length)}
          hint="Contatos conectados ao funil"
          icon={<Phone className="h-5 w-5" />}
          accent="bg-amber-500/12 text-amber-300"
        />
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-foreground">Lista de contatos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Base central para telefone, WhatsApp, e-mail e vinculo comercial.
            </p>
          </div>
          {loading && (
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Atualizando
            </span>
          )}
        </div>

        {contacts.length ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-2xl border border-border/70 bg-background/45 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-foreground">{contact.name}</h3>
                      {contact.company && (
                        <span className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          {contact.company}
                        </span>
                      )}
                      {contact.city && (
                        <span className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          {contact.city}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>WhatsApp: {contact.whatsapp || "Nao informado"}</span>
                      <span>Telefones: {contact.phones.join(" · ") || "Nao informado"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>E-mails: {contact.emails.join(" · ") || "Nao informado"}</span>
                      <span>Responsavel: {contact.assignedTo || "Nao definido"}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {contact.tags.map((tag) => (
                        <span
                          key={`${contact.id}-${tag}`}
                          className="rounded-full bg-primary/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
                        >
                          {tag}
                        </span>
                      ))}

                      {contact.linkedLead && (
                        <Link
                          to="/admin/crm/lead/$leadId"
                          params={{ leadId: contact.linkedLead.id }}
                          className="inline-flex items-center gap-2 rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 transition hover:brightness-110"
                        >
                          Lead: {contact.linkedLead.name}
                        </Link>
                      )}
                    </div>

                    {contact.notes && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {contact.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditDialog(contact)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                      aria-label="Editar contato"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(contact)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-red-500/40 hover:text-red-400"
                      aria-label="Remover contato"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Atualizado: {formatDateTime(contact.updatedAt)}</span>
                  <span>Criado: {formatDateTime(contact.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum contato encontrado"
            description="Cadastre contatos para centralizar telefone, WhatsApp e e-mail no CRM."
          />
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar contato" : "Novo contato"}</DialogTitle>
            <DialogDescription>
              Centralize os dados de contato antes mesmo de transformar em lead.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(90vh-8.5rem)] space-y-4 overflow-y-auto pr-1"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <input
                  value={form.name ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="adm-input"
                  required
                />
              </Field>
              <Field label="WhatsApp principal">
                <input
                  value={form.whatsapp ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, whatsapp: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Empresa">
                <input
                  value={form.company ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Cidade">
                <input
                  value={form.city ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className="adm-input"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Telefones">
                <input
                  value={(form.phones as string) ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phones: event.target.value }))
                  }
                  className="adm-input"
                  placeholder="11 99999-0000, 11 3333-4444"
                />
              </Field>
              <Field label="E-mails">
                <input
                  value={(form.emails as string) ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, emails: event.target.value }))
                  }
                  className="adm-input"
                  placeholder="contato@empresa.com, compras@empresa.com"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Responsavel">
                <input
                  value={form.assignedTo ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, assignedTo: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Vincular a lead">
                <select
                  value={form.linkedLeadId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, linkedLeadId: event.target.value }))
                  }
                  className="adm-input"
                >
                  <option value="">Nao vincular</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Tags">
              <input
                value={(form.tags as string) ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                className="adm-input"
                placeholder="vip, revenda, fornecedor, cliente recorrente"
              />
            </Field>

            <Field label="Observacoes">
              <textarea
                value={form.notes ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="adm-input min-h-[120px] resize-y"
                rows={5}
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Salvando..." : editingContact ? "Salvar contato" : "Criar contato"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`
        .adm-input {
          width: 100%;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          border-radius: 0.875rem;
          padding: 0.75rem 0.9rem;
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

function MetricCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-card">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-white/6 ${accent}`}>
        {icon}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-4xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-background/40 px-5 py-16 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
