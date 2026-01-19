/**
 * Tile-Swap Puzzle Game Server
 *
 * A minimal Node.js server that:
 * - Serves static files from /public
 * - Serves level assets from /levels
 * - Provides an API endpoint to list available levels
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve level assets from levels directory
app.use('/levels', express.static(path.join(__dirname, 'levels')));

/**
 * API endpoint to get list of available levels
 * Returns sorted array of level folder names that contain valid assets
 */
app.get('/api/levels', (req, res) => {
    const levelsDir = path.join(__dirname, 'levels');

    try {
        // Check if levels directory exists
        if (!fs.existsSync(levelsDir)) {
            return res.status(404).json({
                error: 'Levels directory not found',
                levels: []
            });
        }

        // Read all items in levels directory
        const items = fs.readdirSync(levelsDir);

        // Filter to only valid level folders
        const levels = items
            .filter(item => {
                const itemPath = path.join(levelsDir, item);

                // Must be a directory
                if (!fs.statSync(itemPath).isDirectory()) {
                    return false;
                }

                // Must start with 'level_'
                if (!item.startsWith('level_')) {
                    return false;
                }

                // Must contain required files
                const files = fs.readdirSync(itemPath);
                const hasImage = files.some(f =>
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
                );
                const hasAudio = files.some(f =>
                    /\.(mp3|wav|ogg|m4a)$/i.test(f)
                );

                return hasImage && hasAudio;
            })
            // Sort by level number
            .sort((a, b) => {
                const numA = parseInt(a.replace('level_', ''), 10) || 0;
                const numB = parseInt(b.replace('level_', ''), 10) || 0;
                return numA - numB;
            });

        res.json({ levels });

    } catch (error) {
        console.error('Error reading levels:', error);
        res.status(500).json({
            error: 'Failed to read levels directory',
            levels: []
        });
    }
});

/**
 * API endpoint to get files for a specific level
 * Returns the image and audio file names for the level
 */
app.get('/api/levels/:levelName', (req, res) => {
    const { levelName } = req.params;
    const levelDir = path.join(__dirname, 'levels', levelName);

    try {
        // Validate level name format
        if (!levelName.startsWith('level_')) {
            return res.status(400).json({ error: 'Invalid level name format' });
        }

        // Check if level directory exists
        if (!fs.existsSync(levelDir)) {
            return res.status(404).json({ error: 'Level not found' });
        }

        const files = fs.readdirSync(levelDir);

        // Find image file
        const imageFile = files.find(f =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
        );

        // Find audio file
        const audioFile = files.find(f =>
            /\.(mp3|wav|ogg|m4a)$/i.test(f)
        );

        if (!imageFile || !audioFile) {
            return res.status(400).json({
                error: 'Level is missing required files (image or audio)'
            });
        }

        res.json({
            level: levelName,
            image: imageFile,
            audio: audioFile
        });

    } catch (error) {
        console.error('Error reading level:', error);
        res.status(500).json({ error: 'Failed to read level data' });
    }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧩 Puzzle Game Server running on port ${PORT}`);
    console.log(`   Local: http://localhost:${PORT}`);
});
