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

        if (match.indexOf(file.mimetype) != -1) {
            const filename = `${Date.now()}-pennthrift-${file.originalname}`;
            return filename;
        }

        return {
            bucketName: "photos",
            filename: `${Date.now()}-pennthrift-${file.originalname}`,
        };
    },
});

module.exports = multer({ storage });