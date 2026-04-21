const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const {
  getVehicleAnalyticsOverview,
  incrementVehicleAnalytics,
  normalizeTrackingPayload,
} = require("../utils/vehicleAnalytics");

async function getAnalyticsOverview(req, res) {
  try {
    const overview = await getVehicleAnalyticsOverview(req.query.days);
    return res.status(200).json(overview);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar analytics dos veiculos." });
  }
}

async function findTrackableVehicle(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Vehicle.findOne({ _id: id, active: true }).select({ _id: 1 }).lean();
}

async function trackVehicleView(req, res) {
  try {
    const vehicle = await findTrackableVehicle(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const tracking = normalizeTrackingPayload(req.body);
    await incrementVehicleAnalytics(vehicle._id, "view", tracking);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Erro ao registrar visualizacao do veiculo." });
  }
}

async function trackVehicleWhatsappClick(req, res) {
  try {
    const vehicle = await findTrackableVehicle(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const tracking = normalizeTrackingPayload(req.body);
    await incrementVehicleAnalytics(vehicle._id, "whatsapp", tracking);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Erro ao registrar clique de WhatsApp." });
  }
}

module.exports = {
  getAnalyticsOverview,
  trackVehicleView,
  trackVehicleWhatsappClick,
};
