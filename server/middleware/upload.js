// Load environment variables for local dev (Render sets them via env vars)
require('dotenv').config();

const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");

const mongoUrl =
  process.env.DATABASE_ACCESS ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

console.log('GridFS mongoUrl set?', !!mongoUrl);

if (!mongoUrl) {
  throw new Error('Missing MongoDB URL. Set DATABASE_ACCESS (preferred) or MONGODB_URI/MONGO_URI');
}

const storage = new GridFsStorage({
    url: mongoUrl,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        const match = [];

        // Sanitize filename: remove spaces, special chars, keep only alphanumeric, dots, hyphens, underscores
        const sanitizedOriginal = file.originalname
            .replace(/\s+/g, '-')  // Replace spaces with hyphens
            .replace(/[^a-zA-Z0-9.\-_]/g, '')  // Remove special characters except dots, hyphens, underscores
            .toLowerCase();
        
        const sanitizedFilename = `${Date.now()}-pennthrift-${sanitizedOriginal}`;

        if (match.indexOf(file.mimetype) != -1) {
            return sanitizedFilename;
        }

        return {
            bucketName: "photos",
            filename: sanitizedFilename,
        };
    },
});

module.exports = multer({ storage });