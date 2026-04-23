const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const crmDealRoutes = require("./routes/deals");
const financeRoutes = require("./routes/financeRoutes");
const crmLeadRoutes = require("./routes/leads");
const crmTaskRoutes = require("./routes/tasks");
const uploadRoutes = require("./routes/uploadRoutes");
const crmVehicleFinanceRoutes = require("./routes/vehicleFinance");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

connectDB();

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API DM Motors rodando." });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/crm/deals", crmDealRoutes);
app.use("/finance", financeRoutes);
app.use("/crm/leads", crmLeadRoutes);
app.use("/crm/tasks", crmTaskRoutes);
app.use("/upload", uploadRoutes);
app.use("/crm/vehicle-finance", crmVehicleFinanceRoutes);
app.use("/vehicles", vehicleRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}.`);
});
