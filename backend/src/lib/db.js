import mongoose from "mongoose";

/**
 * Connects to MongoDB when MONGODB_URI is set; otherwise logs and continues
 * (useful for local UI/API wiring before the database is running).
 */
export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[db] MONGODB_URI not set — starting without MongoDB connection.");
    return;
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("[db] Connected to MongoDB");
}
