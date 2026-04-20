const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const uploadRoutes = require("./routes/uploadRoutes");
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

app.use("/upload", uploadRoutes);
app.use("/vehicles", vehicleRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}.`);
});
