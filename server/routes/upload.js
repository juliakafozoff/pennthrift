const upload                        = require("../middleware/upload");
const express                       = require("express");
const router                        = express.Router();
const mongoose                      = require('mongoose');
const Grid                          = require("gridfs-stream");



let gfs, gridfsBucket;

const connection = mongoose.connection;
connection.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
      bucketName: 'photos'
    })
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('photos');
});



router.post('/upload', upload.single('file'), async (req, res) => {
    if (req.file === undefined) {
        return res.status(400).json({ error: 'you must select a file.' });
    }

    // URL encode the filename for safe URL construction
    const encodedFilename = encodeURIComponent(req.file.filename);
    
    // Return relative path (preferred for DB storage) and full URL
    // Relative path: /api/file/filename (no encoding needed in path)
    const relativePath = `/api/file/${req.file.filename}`;
    
    // Full URL: construct from request (works for both localhost and production)
    // Use req.protocol and req.get('host') to get the actual request origin
    const baseUrl = req.protocol + '://' + req.get('host');
    const fullUrl = `${baseUrl}/api/file/${encodedFilename}`;

    return res.json({
        path: relativePath,
        url: fullUrl,
        filename: req.file.filename
    });
});

router.get("/:filename", async (req, res) => {
    try {
        // Decode URL-encoded filename if needed
        const filename = decodeURIComponent(req.params.filename);
        
        // Use toArray() to properly handle async cursor
        const cursor = gridfsBucket.find({filename: filename});
        const files = await cursor.toArray();
        
        if (files.length === 0) {
            return res.status(404).send('File not found');
        }
        
        const file = files[0];
        
        // Set proper content type headers
        res.set('Content-Type', file.contentType || 'image/jpeg');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        
        const readStream = gridfsBucket.openDownloadStream(file._id);
        
        readStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) {
                res.status(500).send('Error reading file');
            }
        });
        
        readStream.pipe(res);
    } catch (error) {
        console.error('Error serving file:', error);
        if (!res.headersSent) {
            res.status(500).send('Error serving file');
        }
    }
});

router.delete("/:filename", async (req, res) => {
    try {
        
        const cursor = gridfsBucket.find({filename: req.params.filename});
        cursor.forEach(image => {
            gridfsBucket.delete(image._id);
        });
        res.send("success");
    } catch (error) {
        console.log(error);
        res.send("An error occured.");
    }
});


module.exports = router;