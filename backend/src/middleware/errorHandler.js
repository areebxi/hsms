/**
 * Global error middleware — maps thrown errors to a single `{ error: "..." }` JSON shape.
 */
import { ZodError } from "zod";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues.map((e) => e.message).join("; "),
    });
    return;
  }
  // Mongoose throws CastError when :id in the URL is not a valid ObjectId.
  if (err.name === "CastError") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  // Log server-side failures; 4xx messages are safe to return to the client as-is.
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
}
