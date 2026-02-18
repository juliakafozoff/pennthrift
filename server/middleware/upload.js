const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");

const mongoUrl = process.env.DATABASE_ACCESS;
if (!mongoUrl) {
    throw new Error('DATABASE_ACCESS env var is missing. Please set it in your environment variables.');
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