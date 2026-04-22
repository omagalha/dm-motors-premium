const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const { buildVehicleSaleDocumentPayload } = require("../utils/vehicleDocumentPayload");
const { validateVehicleForSaleDocument } = require("../utils/vehicleDocumentValidation");
const { runSaleContractWorkflow } = require("../services/documentWorkflowService");
const {
  triggerSaleContractWorkflow: triggerN8n,
  getProviderExecutionId,
} = require("../services/n8nService");

function normalizeExecutionId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createWorkflowResponse(workflowResult, options = {}) {
  const automationTriggered = options.automationTriggered === true;
  const automationStatus = options.automationStatus ?? "skipped_not_ready";
  const automationExecutionId = options.automationExecutionId ?? null;
  const automationProviderExecutionId = options.automationProviderExecutionId ?? null;

  return {
    ...workflowResult,
    nextStep: automationTriggered ? "automation_requested" : workflowResult.nextStep,
    automationTriggered,
    automationStatus,
    automationExecutionId,
    automationProviderExecutionId,
  };
}

function matchesKnownExecutionId(saleContract, receivedExecutionId) {
  const normalizedReceivedExecutionId = normalizeExecutionId(receivedExecutionId);
  if (!normalizedReceivedExecutionId) {
    return false;
  }

  const knownExecutionIds = [
    normalizeExecutionId(saleContract?.executionId),
    normalizeExecutionId(saleContract?.providerExecutionId),
  ].filter(Boolean);

  return knownExecutionIds.includes(normalizedReceivedExecutionId);
}

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
    let automationExecutionId = null;
    let automationProviderExecutionId = null;

    if (workflowResult.ready && workflowResult.draft) {
      const webhookUrl = process.env.N8N_SALE_CONTRACT_WEBHOOK_URL;
      const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

      if (!webhookUrl) {
        console.warn("[n8n] N8N_SALE_CONTRACT_WEBHOOK_URL not configured; automation skipped.");
        automationStatus = "skipped_not_configured";
      } else if (!backendUrl) {
        console.warn("[n8n] BACKEND_URL not configured; automation skipped.");
        automationStatus = "skipped_not_configured";
      } else {
        try {
          const executionId = `sale-contract_${vehicleDoc._id}_${Date.now()}`;
          const vehicleId = vehicleDoc._id.toString();
          const callbackUrl = `${backendUrl}/vehicles/${vehicleId}/document-workflows/sale-contract/callback`;
          console.log("PENDING vehicleId:", vehicleId);
          console.log("PENDING executionId:", executionId);
          console.log("[n8n] Disparando webhook. vehicleId:", vehicleId, "callbackUrl:", callbackUrl);
          const n8nResponse = await triggerN8n({
            executionId,
            vehicleId,
            workflow: "sale-contract",
            callbackUrl,
            draft: workflowResult.draft,
          });
          const providerExecutionId = getProviderExecutionId(n8nResponse);
          automationTriggered = true;
          automationStatus = "pending";
          automationExecutionId = executionId;
          automationProviderExecutionId = providerExecutionId || null;
          vehicleDoc.documentWorkflow = {
            saleContract: {
              status: "pending",
              executionId,
              providerExecutionId,
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

    return res.status(200).json(
      createWorkflowResponse(workflowResult, {
        automationTriggered,
        automationStatus,
        automationExecutionId,
        automationProviderExecutionId,
      }),
    );
  } catch (error) {
    return res.status(500).json({ message: "Erro ao iniciar workflow documental do veiculo." });
  }
}

function validateCallbackSecret(req) {
  const expected = process.env.N8N_CALLBACK_SECRET;
  const received = req.headers["x-callback-secret"];

  if (!expected) {
    const error = new Error("N8N callback secret not configured");
    error.statusCode = 500;
    throw error;
  }

  if (received !== expected) {
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
    const vehicleId = req.body?.vehicleId;
    const normalizedExecutionId = normalizeExecutionId(executionId);

    const VALID_STATUSES = ["completed", "failed"];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status invalido. Use 'completed' ou 'failed'." });
    }

    if (!normalizedExecutionId) {
      return res.status(400).json({ message: "executionId obrigatorio no callback." });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const currentSaleContract = vehicle.documentWorkflow?.saleContract;

    console.log("CALLBACK vehicleId:", vehicleId);
    console.log("CALLBACK executionId:", executionId);
    console.log("CALLBACK param id:", req.params.id);
    console.log(
      "CURRENT saleContract.executionId:",
      vehicle.documentWorkflow?.saleContract?.executionId,
    );
    console.log(
      "CURRENT saleContract.providerExecutionId:",
      vehicle.documentWorkflow?.saleContract?.providerExecutionId,
    );
    console.log(
      "CURRENT saleContract.status:",
      vehicle.documentWorkflow?.saleContract?.status,
    );
    console.log(
      "NORMALIZED callback executionId:",
      normalizedExecutionId,
    );

    if (!currentSaleContract?.executionId) {
      return res.status(409).json({ message: "Nenhum workflow pendente encontrado para este veiculo." });
    }

    console.log(
      "COMPARE executionId === current.executionId:",
      normalizedExecutionId === vehicle.documentWorkflow?.saleContract?.executionId,
    );
    console.log(
      "COMPARE executionId === current.providerExecutionId:",
      normalizedExecutionId === vehicle.documentWorkflow?.saleContract?.providerExecutionId,
    );

    if (!matchesKnownExecutionId(currentSaleContract, normalizedExecutionId)) {
      return res.status(409).json({ message: "executionId do callback nao corresponde ao workflow atual." });
    }

    const currentStatus = currentSaleContract.status;
    const isPendingWorkflow = currentStatus === "pending";
    const isIdempotentFinalCallback =
      (currentStatus === "completed" || currentStatus === "failed") && currentStatus === status;

    if (!isPendingWorkflow && !isIdempotentFinalCallback) {
      return res.status(409).json({ message: "Workflow nao esta mais pendente para este callback." });
    }

    const now = new Date();

    vehicle.documentWorkflow = {
      saleContract: {
        status,
        executionId: normalizedExecutionId,
        providerExecutionId:
          currentSaleContract.providerExecutionId ||
          (normalizedExecutionId !== currentSaleContract.executionId ? normalizedExecutionId : ""),
        triggeredAt: currentSaleContract.triggeredAt ?? now,
        completedAt:
          status === "completed" ? currentSaleContract.completedAt ?? now : null,
        failedAt: status === "failed" ? currentSaleContract.failedAt ?? now : null,
        documentUrl: documentUrl || currentSaleContract.documentUrl || "",
        errorMessage: errorMessage || currentSaleContract.errorMessage || "",
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
