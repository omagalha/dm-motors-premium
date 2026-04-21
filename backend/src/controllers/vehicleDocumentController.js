const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const { buildVehicleSaleDocumentPayload } = require("../utils/vehicleDocumentPayload");
const { validateVehicleForSaleDocument } = require("../utils/vehicleDocumentValidation");
const { runSaleContractWorkflow } = require("../services/documentWorkflowService");
const { triggerSaleContractWorkflow: triggerN8n } = require("../services/n8nService");

async function findVehicleForDocuments(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Vehicle.findById(id).lean();
}

async function getVehicleDocumentPayload(req, res) {
  try {
    const vehicle = await findVehicleForDocuments(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    return res.status(200).json(buildVehicleSaleDocumentPayload(vehicle));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao montar payload documental do veiculo." });
  }
}

async function getVehicleDocumentReadiness(req, res) {
  try {
    const vehicle = await findVehicleForDocuments(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    return res.status(200).json(validateVehicleForSaleDocument(vehicle));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao validar prontidao documental do veiculo." });
  }
}

async function startSaleContractWorkflow(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const vehicleDoc = await Vehicle.findById(req.params.id);

    if (!vehicleDoc) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const workflowResult = await runSaleContractWorkflow(vehicleDoc.toObject());

    let automationTriggered = false;
    let automationStatus = "skipped_not_ready";

    if (workflowResult.ready && workflowResult.draft) {
      const webhookUrl = process.env.N8N_SALE_CONTRACT_WEBHOOK_URL;

      if (!webhookUrl) {
        console.warn("[n8n] N8N_SALE_CONTRACT_WEBHOOK_URL not configured; automation skipped.");
        automationStatus = "skipped_not_configured";
      } else {
        try {
          const executionId = `sale-contract_${vehicleDoc._id}_${Date.now()}`;
          const vehicleId = vehicleDoc._id.toString();
          const callbackUrl = `${process.env.BACKEND_URL}/vehicles/${vehicleId}/document-workflows/sale-contract/callback`;
          console.log("[n8n] Disparando webhook. vehicleId:", vehicleId, "callbackUrl:", callbackUrl);
          await triggerN8n({
            executionId,
            vehicleId,
            workflow: "sale-contract",
            callbackUrl,
            draft: workflowResult.draft,
          });
          automationTriggered = true;
          automationStatus = "pending";
          vehicleDoc.documentWorkflow = {
            saleContract: {
              status: "pending",
              executionId,
              triggeredAt: new Date(),
              completedAt: null,
              failedAt: null,
              documentUrl: "",
              errorMessage: "",
            },
          };
          await vehicleDoc.save();
        } catch (n8nErr) {
          console.error("[n8n] Falha ao disparar workflow:", n8nErr.message);
          automationStatus = "trigger_failed";
        }
      }
    }

    return res.status(200).json({
      ...workflowResult,
      nextStep: automationTriggered ? "automation_requested" : workflowResult.nextStep,
      automationTriggered,
      automationStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao iniciar workflow documental do veiculo." });
  }
}

function validateCallbackSecret(req) {
  const expected = process.env.N8N_CALLBACK_SECRET;
  const received = req.headers["x-callback-secret"];
  console.log("[n8n callback] EXPECTED:", expected);
  console.log("[n8n callback] RECEIVED:", received);

  if (!expected || received !== expected) {
    const error = new Error("Unauthorized callback");
    error.statusCode = 401;
    throw error;
  }
}

async function saleContractWorkflowCallback(req, res) {
  try {
    validateCallbackSecret(req);

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const { executionId, status, documentUrl = "", errorMessage = "" } = req.body;

    const VALID_STATUSES = ["completed", "failed"];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status invalido. Use 'completed' ou 'failed'." });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const now = new Date();

    vehicle.documentWorkflow = {
      saleContract: {
        status,
        executionId: executionId ?? "",
        triggeredAt: vehicle.documentWorkflow?.saleContract?.triggeredAt ?? now,
        completedAt: status === "completed" ? now : null,
        failedAt: status === "failed" ? now : null,
        documentUrl,
        errorMessage,
      },
    };

    await vehicle.save();

    return res.status(204).send();
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}

module.exports = {
  getVehicleDocumentPayload,
  getVehicleDocumentReadiness,
  startSaleContractWorkflow,
  saleContractWorkflowCallback,
};
