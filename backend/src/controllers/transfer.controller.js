import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  dest: path.join(__dirname, "../uploads")
});

// UPLOAD: Handles file upload and generates a unique code
export const uploadFile = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Generate a 6-digit valid code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Set expiration to 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Store file metadata in database
      const fileResult = await pool.query(
        `INSERT INTO files (original_name, stored_name, mime_type, size)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.size
        ]
      );

      // Create transfer record linked to the file
      await pool.query(
        `INSERT INTO transfers (file_id, transfer_code, expires_at)
         VALUES ($1,$2,$3)`,
        [fileResult.rows[0].id, code, expiresAt]
      );

      console.log(`File uploaded. Code: ${code}, Expires: ${expiresAt}`);
      res.json({ transferCode: code, expiresAt });
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ error: "Failed to upload file." });
    }
  }
];

// DOWNLOAD: Retrieves file using the code
export const downloadFile = async (req, res) => {
  try {
    const { code } = req.params;

    // Find the transfer record
    const result = await pool.query(
      `SELECT f.*, t.*
       FROM transfers t
       JOIN files f ON t.file_id = f.id
       WHERE t.transfer_code = $1 AND t.is_active = true`,
      [code]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Invalid or expired code" });

    const transfer = result.rows[0];

    // Check expiration
    if (new Date() > transfer.expires_at)
      return res.status(410).json({ message: "Link has expired" });

    const filePath = path.join(__dirname, "../uploads", transfer.stored_name);
    console.log(`Downloading file: ${transfer.original_name}`);

    // Send file with correct original name
    res.download(filePath, transfer.original_name, (err) => {
      if (err) {
        console.error("Download Error:", err);
        // If header hasn't been sent, send 500. Otherwise stream closed.
        if (!res.headersSent) res.status(500).send("Could not download file");
      }
    });

  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
