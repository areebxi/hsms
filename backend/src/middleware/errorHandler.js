import { ZodError } from "zod";

/**
 * Central JSON error handler — keeps API responses consistent for the React client.
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues.map((e) => e.message).join("; "),
    });
    return;
  }
  if (err.name === "CastError") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
}
