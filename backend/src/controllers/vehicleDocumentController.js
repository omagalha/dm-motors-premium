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

    const currentSaleContract = vehicleDoc.documentWorkflow?.saleContract;

    if (currentSaleContract?.status === "pending") {
      return res.status(409).json({
        error: "Ja existe uma geracao de contrato em andamento para este veiculo.",
        currentExecutionId: currentSaleContract.executionId || null,
      });
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
          const now = new Date();
          automationTriggered = true;
          automationStatus = "pending";
          automationExecutionId = executionId;
          automationProviderExecutionId = providerExecutionId || null;
          vehicleDoc.documentWorkflow = vehicleDoc.documentWorkflow || {};
          vehicleDoc.documentWorkflow.saleContract = {
            executionId,
            providerExecutionId: providerExecutionId || "",
            status: "pending",
            documentUrl: "",
            errorMessage: "",
            createdAt: now,
            updatedAt: now,
            triggeredAt: now,
            completedAt: null,
            failedAt: null,
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
      return res.status(404).json({
        error: "Nenhum workflow de contrato encontrado para este veiculo.",
      });
    }

    const matchesCurrentExecution =
      normalizedExecutionId === normalizeExecutionId(currentSaleContract.executionId) ||
      normalizedExecutionId === normalizeExecutionId(currentSaleContract.providerExecutionId);

    console.log(
      "COMPARE executionId === current.executionId:",
      normalizedExecutionId === normalizeExecutionId(vehicle.documentWorkflow?.saleContract?.executionId),
    );
    console.log(
      "COMPARE executionId === current.providerExecutionId:",
      normalizedExecutionId === normalizeExecutionId(
        vehicle.documentWorkflow?.saleContract?.providerExecutionId,
      ),
    );

    if (!matchesCurrentExecution) {
      return res.status(409).json({
        error: "Callback de execucao antiga. O workflow atual ja foi substituido por uma nova geracao.",
        callbackExecutionId: normalizedExecutionId,
        currentExecutionId: currentSaleContract.executionId || null,
        currentProviderExecutionId: currentSaleContract.providerExecutionId || null,
      });
    }

    const now = new Date();

    if (status === "completed") {
      currentSaleContract.status = "completed";
      currentSaleContract.documentUrl = documentUrl || "";
      currentSaleContract.errorMessage = "";
      currentSaleContract.updatedAt = now;
      currentSaleContract.completedAt = now;
      currentSaleContract.failedAt = null;
    }

    if (status === "failed") {
      currentSaleContract.status = "failed";
      currentSaleContract.documentUrl = "";
      currentSaleContract.errorMessage = errorMessage || "Falha ao gerar contrato";
      currentSaleContract.updatedAt = now;
      currentSaleContract.failedAt = now;
      currentSaleContract.completedAt = null;
    }

    console.log("CALLBACK status:", status);
    console.log("CALLBACK documentUrl:", documentUrl);
    console.log("ANTES DE SALVAR saleContract:", currentSaleContract);

    await vehicle.save();

    console.log("SALE CONTRACT SALVO:", vehicle.documentWorkflow?.saleContract);

    return res.status(200).json({
      message: "Callback processado com sucesso",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}

async function resetSaleContractWorkflow(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Veiculo nao encontrado" });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ error: "Veiculo nao encontrado" });
    }

    if (!vehicle.documentWorkflow?.saleContract) {
      return res.status(404).json({ error: "Nenhum workflow encontrado" });
    }

    const now = new Date();
    vehicle.documentWorkflow.saleContract.status = "cancelled";
    vehicle.documentWorkflow.saleContract.errorMessage = "Workflow resetado manualmente";
    vehicle.documentWorkflow.saleContract.updatedAt = now;
    vehicle.documentWorkflow.saleContract.completedAt = null;
    vehicle.documentWorkflow.saleContract.failedAt = null;
    vehicle.documentWorkflow.saleContract.documentUrl = "";

    await vehicle.save();

    return res.status(200).json({
      message: "Workflow resetado com sucesso",
      currentExecutionId: vehicle.documentWorkflow.saleContract.executionId || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao resetar workflow",
      details: error.message,
    });
  }
}

module.exports = {
  getVehicleDocumentPayload,
  getVehicleDocumentReadiness,
  startSaleContractWorkflow,
  saleContractWorkflowCallback,
  resetSaleContractWorkflow,
};
