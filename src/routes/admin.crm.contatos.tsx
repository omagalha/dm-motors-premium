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

function getContactLetter(contact: Contact) {
  const letter = contact.name.trim().charAt(0).toLocaleUpperCase("pt-BR");
  return letter || "#";
}

function AdminCrmContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
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
        setSelectedContactId((current) => {
          if (current && nextContacts.some((contact) => contact.id === current)) return current;
          return nextContacts[0]?.id ?? null;
        });
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

  const sortedContacts = useMemo(
    () => [...contacts].sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
    [contacts],
  );

  const groupedContacts = useMemo(
    () =>
      sortedContacts.reduce<Array<{ letter: string; contacts: Contact[] }>>((groups, contact) => {
        const letter = getContactLetter(contact);
        const group = groups[groups.length - 1];

        if (group?.letter === letter) {
          group.contacts.push(contact);
        } else {
          groups.push({ letter, contacts: [contact] });
        }

        return groups;
      }, []),
    [sortedContacts],
  );

  const selectedContact = useMemo(
    () => sortedContacts.find((contact) => contact.id === selectedContactId) ?? sortedContacts[0] ?? null,
    [selectedContactId, sortedContacts],
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
    return nextContacts;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      let savedContactId = editingContact?.id ?? null;

      if (editingContact) {
        const updated = await updateContact(editingContact.id, form);
        savedContactId = updated.id;
        toast.success("Contato atualizado.");
      } else {
        const created = await createContact(form);
        savedContactId = created.id;
        toast.success("Contato adicionado a agenda.");
      }

      await reload();
      setSelectedContactId(savedContactId);
      setDialogOpen(false);
      setEditingContact(null);
      setForm(buildContactForm());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel salvar o contato.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Remover o contato "${contact.name}"?`)) return;

    try {
      await deleteContact(contact.id);
      const nextContacts = await reload();
      if (selectedContactId === contact.id) {
        setSelectedContactId(nextContacts[0]?.id ?? null);
      }
      toast.success("Contato removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel remover o contato.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-foreground">Contatos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Agenda simples do CRM, organizada em ordem alfabetica.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-red transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Adicionar contato
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="border-b border-border bg-background/35 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar"
                className="adm-input pl-10"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{contacts.length} contato{contacts.length === 1 ? "" : "s"}</span>
              {loading && <span>Atualizando</span>}
            </div>
          </div>

          {groupedContacts.length ? (
            <div className="max-h-[68vh] overflow-y-auto">
              {groupedContacts.map((group) => (
                <div key={group.letter}>
                  <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary backdrop-blur">
                    {group.letter}
                  </div>
                  {group.contacts.map((contact) => {
                    const active = selectedContact?.id === contact.id;
                    const whatsappNumber = contact.whatsapp.trim();

                    return (
                      <div
                        key={contact.id}
                        className={`flex items-center gap-2 border-b border-border/70 px-4 py-3 transition ${
                          active ? "bg-primary/12" : "hover:bg-secondary/40"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedContactId(contact.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-base font-semibold text-foreground">
                            {contact.name}
                          </span>
                        </button>

                        {whatsappNumber && (
                          <a
                            href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/16"
                            aria-label={`Abrir WhatsApp de ${contact.name}`}
                            title={`WhatsApp de ${contact.name}`}
                          >
                            <MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum contato encontrado"
              description="Use adicionar contato para criar uma pessoa na agenda."
            />
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
          {selectedContact ? (
            <ContactDetails
              contact={selectedContact}
              onEdit={() => openEditDialog(selectedContact)}
              onDelete={() => void handleDelete(selectedContact)}
            />
          ) : (
            <EmptyState
              title="Selecione um contato"
              description="As informacoes completas aparecem aqui quando voce abre uma pessoa da agenda."
            />
          )}
        </div>
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

function ContactDetails({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/12 text-primary">
            <ContactRound className="h-7 w-7" />
          </div>
          <h3 className="break-words text-3xl font-black text-foreground">{contact.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[contact.company, contact.city].filter(Boolean).join(" - ") || "Sem empresa ou cidade"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            aria-label="Editar contato"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-red-500/40 hover:text-red-400"
            aria-label="Remover contato"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoBlock
          icon={<MessageCircle className="h-4 w-4" />}
          label="WhatsApp"
          value={contact.whatsapp || "Nao informado"}
        />
        <InfoBlock
          icon={<Phone className="h-4 w-4" />}
          label="Telefones"
          value={contact.phones.join(" / ") || "Nao informado"}
        />
        <InfoBlock
          icon={<Mail className="h-4 w-4" />}
          label="E-mails"
          value={contact.emails.join(" / ") || "Nao informado"}
        />
        <InfoBlock label="Responsavel" value={contact.assignedTo || "Nao definido"} />
      </div>

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contact.tags.map((tag) => (
            <span
              key={`${contact.id}-${tag}`}
              className="rounded-full bg-primary/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {contact.linkedLead && (
        <Link
          to="/admin/crm/lead/$leadId"
          params={{ leadId: contact.linkedLead.id }}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 transition hover:brightness-110"
        >
          Lead vinculado: {contact.linkedLead.name}
        </Link>
      )}

      <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Observacoes
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {contact.notes || "Sem observacoes."}
        </p>
      </section>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Atualizado: {formatDateTime(contact.updatedAt)}</span>
        <span>Criado: {formatDateTime(contact.createdAt)}</span>
      </div>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-foreground">{value}</p>
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
