const express = require("express");
const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const {
  normalizeString,
  normalizeStringArray,
  serializeDateValue,
} = require("../utils/crmShared");

const router = express.Router();

function serializeContact(contact) {
  const source = contact && typeof contact.toObject === "function" ? contact.toObject() : contact;

  return {
    id: String(source?._id ?? source?.id ?? ""),
    name: normalizeString(source?.name),
    company: normalizeString(source?.company),
    city: normalizeString(source?.city),
    whatsapp: normalizeString(source?.whatsapp),
    phones: normalizeStringArray(source?.phones),
    emails: normalizeStringArray(source?.emails),
    tags: normalizeStringArray(source?.tags),
    assignedTo: normalizeString(source?.assignedTo),
    notes: normalizeString(source?.notes),
    linkedLead:
      source?.linkedLeadId || source?.linkedLeadName
        ? {
            id: source?.linkedLeadId ? String(source.linkedLeadId) : "",
            name: normalizeString(source?.linkedLeadName),
          }
        : null,
    createdAt: serializeDateValue(source?.createdAt),
    updatedAt: serializeDateValue(source?.updatedAt),
  };
}

async function resolveLeadReference(leadId) {
  const normalizedLeadId = normalizeString(leadId);
  if (!normalizedLeadId) return { linkedLeadId: null, linkedLeadName: "" };

  if (!mongoose.isValidObjectId(normalizedLeadId)) {
    throw new Error("Lead invalido.");
  }

  const lead = await Lead.findById(normalizedLeadId).select({ _id: 1, name: 1 }).lean();
  if (!lead) {
    throw new Error("Lead nao encontrado.");
  }

  return {
    linkedLeadId: lead._id,
    linkedLeadName: normalizeString(lead.name),
  };
}

router.use(requireAdminAuth);

router.get("/", async (req, res) => {
  try {
    const query = {};
    const search = normalizeString(req.query.search);
    const linkedOnly = normalizeString(req.query.linkedOnly);

    if (linkedOnly === "true") {
      query.linkedLeadId = { $ne: null };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { whatsapp: { $regex: search, $options: "i" } },
        { phones: { $elemMatch: { $regex: search, $options: "i" } } },
        { emails: { $elemMatch: { $regex: search, $options: "i" } } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
        { linkedLeadName: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
    return res.status(200).json(contacts.map(serializeContact));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar contatos." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = normalizeString(req.body?.name);
    if (!name) {
      return res.status(400).json({ message: "Nome do contato obrigatorio." });
    }

    const created = await Contact.create({
      name,
      company: normalizeString(req.body?.company),
      city: normalizeString(req.body?.city),
      whatsapp: normalizeString(req.body?.whatsapp),
      phones: normalizeStringArray(req.body?.phones),
      emails: normalizeStringArray(req.body?.emails),
      tags: normalizeStringArray(req.body?.tags),
      assignedTo: normalizeString(req.body?.assignedTo),
      notes: normalizeString(req.body?.notes),
      ...(await resolveLeadReference(req.body?.linkedLeadId)),
    });

    return res.status(201).json(serializeContact(created));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar contato.",
      error: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const contactId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(contactId)) {
      return res.status(404).json({ message: "Contato nao encontrado." });
    }

    const patch = {};
    const body = req.body ?? {};

    if ("name" in body) patch.name = normalizeString(body.name);
    if ("company" in body) patch.company = normalizeString(body.company);
    if ("city" in body) patch.city = normalizeString(body.city);
    if ("whatsapp" in body) patch.whatsapp = normalizeString(body.whatsapp);
    if ("phones" in body) patch.phones = normalizeStringArray(body.phones);
    if ("emails" in body) patch.emails = normalizeStringArray(body.emails);
    if ("tags" in body) patch.tags = normalizeStringArray(body.tags);
    if ("assignedTo" in body) patch.assignedTo = normalizeString(body.assignedTo);
    if ("notes" in body) patch.notes = normalizeString(body.notes);
    if ("linkedLeadId" in body) {
      Object.assign(patch, await resolveLeadReference(body.linkedLeadId));
    }

    const updated = await Contact.findByIdAndUpdate(contactId, patch, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Contato nao encontrado." });
    }

    return res.status(200).json(serializeContact(updated));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao atualizar contato.",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const contactId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(contactId)) {
      return res.status(404).json({ message: "Contato nao encontrado." });
    }

    const deleted = await Contact.findByIdAndDelete(contactId);
    if (!deleted) {
      return res.status(404).json({ message: "Contato nao encontrado." });
    }

    return res.status(200).json({ message: "Contato removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover contato." });
  }
});

module.exports = router;
