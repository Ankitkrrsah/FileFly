import express from "express";
import { uploadFile, downloadFile } from "../controllers/transfer.controller.js";

const router = express.Router();

router.post("/upload", uploadFile);
router.get("/:code", downloadFile);

export default router;
