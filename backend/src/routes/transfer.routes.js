import express from "express";
import { uploadFile, downloadFile } from "../controllers/transfer.controller.js";

const router = express.Router();

import { downloadRateLimiter } from "../middleware/rateLimiter.js";

router.post("/upload", uploadFile);
router.get("/:code", downloadRateLimiter, downloadFile);

export default router;
