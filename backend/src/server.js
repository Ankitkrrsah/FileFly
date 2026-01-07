import express from "express";
import cors from "cors";
import path from "path";
import transferRoutes from "./routes/transfer.routes.js";

const app = express();

app.use(cors({

}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// 👇 SERVE FRONTEND FROM BACKEND
app.use(express.static(path.join(process.cwd(), "../frontend")));

app.use("/api/transfers", transferRoutes);

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
