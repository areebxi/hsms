/**
 * Express application — middleware, health checks, and all /api/v1 route modules.
 */
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Registers all Mongoose models before any route touches the database.
import "./models/index.js";

import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import membersUnitsRoutes from "./modules/membersUnits/routes.js";
import billingPaymentsRoutes from "./modules/billingPayments/routes.js";
import complaintsCommunicationRoutes from "./modules/complaintsCommunication/routes.js";
import securityVisitorsRoutes from "./modules/securityVisitors/routes.js";
import inventoryExpensesRoutes from "./modules/inventoryExpenses/routes.js";

const app = express();

// Behind Render, Vercel proxy, nginx, etc. — required for express-rate-limit client IPs.
if (process.env.TRUST_PROXY === "1" || process.env.RENDER === "true") {
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

// Must be last — catches errors thrown in route handlers and middleware above.
app.use(errorHandler);

export default app;
