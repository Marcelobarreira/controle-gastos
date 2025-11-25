require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const prisma = require("./prisma");
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const obligationRoutes = require("./routes/obligations");
const profileRoutes = require("./routes/profile");
const payCycleRoutes = require("./routes/payCycles");
const futureEntryRoutes = require("./routes/futureEntries");

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173,http://localhost:4000";
const allowedOrigins = CLIENT_URL.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Database unreachable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/obligations", obligationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/pay-cycles", payCycleRoutes);
app.use("/api/future-entries", futureEntryRoutes);

const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));
app.get(/^\/(?!api).*/, (_req, res) => {
  return res.sendFile(path.join(clientDistPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ message: "Erro interno" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
