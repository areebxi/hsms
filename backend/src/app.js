import express from "express";
import cors from "cors";
import morgan from "morgan";

import "./models/index.js";

import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import membersUnitsRoutes from "./modules/membersUnits/routes.js";
import billingPaymentsRoutes from "./modules/billingPayments/routes.js";
import complaintsCommunicationRoutes from "./modules/complaintsCommunication/routes.js";
import securityVisitorsRoutes from "./modules/securityVisitors/routes.js";
import inventoryExpensesRoutes from "./modules/inventoryExpenses/routes.js";

const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    service: "hsms-api",
    message: "HSMS backend API. Use routes under /api/v1.",
    health: "/api/v1/health",
  });
});

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "hsms-api" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", membersUnitsRoutes);
app.use("/api/v1", billingPaymentsRoutes);
app.use("/api/v1", complaintsCommunicationRoutes);
app.use("/api/v1", securityVisitorsRoutes);
app.use("/api/v1", inventoryExpensesRoutes);

app.use(errorHandler);

export default app;
