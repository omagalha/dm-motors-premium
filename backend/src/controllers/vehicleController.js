const Vehicle = require("../models/Vehicle");
const { normalizeVehiclePayload, serializeVehicle } = require("../utils/vehicleContract");
const {
  deleteVehicleAnalyticsSummary,
  getVehicleAnalyticsMap,
  getVehicleAnalyticsSummary,
} = require("../utils/vehicleAnalytics");

async function getVehicles(req, res) {
  try {
    const query = req.admin ? {} : { active: true };
    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    const analyticsMap = req.admin
      ? await getVehicleAnalyticsMap(vehicles.map((vehicle) => vehicle._id))
      : {};

    return res
      .status(200)
      .json(
        vehicles.map((vehicle) =>
          serializeVehicle(vehicle, {
            isAdmin: Boolean(req.admin),
            metricsOverride: analyticsMap[String(vehicle._id)] ?? vehicle.metrics,
          }),
        ),
      );
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar veiculos." });
  }
}

async function getVehicleById(req, res) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle || (!req.admin && !vehicle.active)) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const metricsOverride = req.admin
      ? await getVehicleAnalyticsSummary(vehicle._id)
      : undefined;

    return res.status(200).json(
      serializeVehicle(vehicle, {
        isAdmin: Boolean(req.admin),
        metricsOverride,
      }),
    );
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar veiculo." });
  }
}

async function createVehicle(req, res) {
  try {
    const vehicle = await Vehicle.create(normalizeVehiclePayload(req.body));
    return res.status(201).json(serializeVehicle(vehicle, { isAdmin: Boolean(req.admin) }));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar veiculo.",
      error: error.message,
    });
  }
}

async function updateVehicle(req, res) {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      normalizeVehiclePayload(req.body, { partial: true }),
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const metricsOverride = req.admin
      ? await getVehicleAnalyticsSummary(updatedVehicle._id)
      : undefined;

    return res.status(200).json(
      serializeVehicle(updatedVehicle, {
        isAdmin: Boolean(req.admin),
        metricsOverride,
      }),
    );
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao atualizar veiculo.",
      error: error.message,
    });
  }
}

async function deleteVehicle(req, res) {
  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!deletedVehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    await deleteVehicleAnalyticsSummary(deletedVehicle._id);

    return res.status(200).json({ message: "Veiculo removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover veiculo." });
  }
}

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
