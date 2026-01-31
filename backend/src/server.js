import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from "url";
import transferRoutes from "./routes/transfer.routes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.use("/api/transfers", transferRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const frontendPath = path.resolve(__dirname, "..", "..", "frontend");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const server = app.listen(3001, () => {
  console.log("Server running on port 3001");
});

// Graceful Shutdown: Ensures port is released immediately when you stop the server
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed. Port 3001 released.');
    process.exit(0);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).json({ error: "Something went wrong! details: " + err.message });
});
