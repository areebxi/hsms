/**
 * Entry point — loads env vars, connects to MongoDB, then starts the HTTP server.
 */
import "dotenv/config";
import { connectDb } from "./lib/db.js";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

async function main() {
  // DB must be ready before routes that use Mongoose start handling requests.
  await connectDb();
  const server = app.listen(PORT, () => {
    console.log(`HSMS API listening on http://localhost:${PORT}`);
  });
  // Fail fast with a clear message when another process already owns the port.
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[server] Port ${PORT} is already in use. Stop the other process or set PORT.`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
