# Memory Puzzle Game

A browser-based image tile-swap puzzle game with audio rewards. Solve puzzles to unlock hidden audio messages.

## Overview

This is a simple, calming puzzle game where:
- Each level presents an image as a shuffled tile puzzle
- Players swap tiles to reconstruct the original image
- Upon completion, a hidden audio message is revealed and plays automatically
- Levels progress sequentially with increasing difficulty

**Audio is a reward, not background content.** The audio file remains completely hidden until the puzzle is solved.

## How the Puzzle Works

1. **Tile Grid**: The image is divided into an N×N grid of tiles
2. **Shuffling**: Tiles are randomly shuffled (but always solvable)
3. **Swapping**: Click/tap two tiles to swap their positions
4. **Visual Feedback**: Correctly placed tiles show a subtle green border
5. **Completion**: When all tiles are in their correct positions:
   - The puzzle locks
   - The completed image is displayed
   - The audio message plays automatically
   - "Replay Audio" and "Next Memory" buttons appear

### Difficulty Progression

| Level | Grid Size |
|-------|-----------|
| 1     | 3×3 (9 tiles) |
| 2     | 4×4 (16 tiles) |
| 3     | 5×5 (25 tiles) |
| 4+    | 6×6 (36 tiles, max) |

## Adding New Levels

Adding a new level requires **no code changes**. Simply create a new folder:

### Step 1: Create Level Folder

```
levels/
├── level_1/
├── level_2/
└── level_3/    <-- Create new folder
```

### Step 2: Add Required Files

Each level folder must contain exactly:
- **One image file**: `image.jpg`, `image.png`, `photo.jpg`, etc.
- **One audio file**: `audio.mp3`, `message.mp3`, `voice.wav`, etc.

### Folder Naming Rules

- Must start with `level_` followed by a number
- Examples: `level_1`, `level_2`, `level_10`, `level_99`
- Levels are sorted numerically (level_2 comes before level_10)
- Gaps in numbering are allowed (level_1, level_3, level_5 works)

### Supported File Formats

**Images:**
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

**Audio:**
- `.mp3`
- `.wav`
- `.ogg`
- `.m4a`

### Example Level Structure

```
levels/
├── level_1/
│   ├── birthday_photo.jpg
│   └── birthday_message.mp3
├── level_2/
│   ├── vacation.png
│   └── memory.mp3
└── level_3/
    ├── family_portrait.jpg
    └── story.mp3
```

## Local Development

### Prerequisites

- Node.js 16.0.0 or higher
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tile-swap-puzzle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add your level content to the `levels/` folder

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser to `http://localhost:3000`

### Development Mode

The app runs with the same command in development:
```bash
npm run dev
```

## Railway Deployment

### Quick Deploy

1. Push your code to a GitHub repository

2. Go to [Railway](https://railway.app)

3. Click "New Project" → "Deploy from GitHub repo"

4. Select your repository

5. Railway will automatically:
   - Detect the Node.js project
   - Install dependencies
   - Run `npm start`

### Configuration

The app is pre-configured for Railway:

- `railway.json` contains deployment settings
- Server binds to `process.env.PORT` automatically
- No environment variables required

### Manual Configuration (if needed)

If Railway doesn't auto-detect settings:

1. Set the build command: `npm install`
2. Set the start command: `npm start`
3. Ensure the root directory contains `package.json`

## Project Structure

```
/
├── levels/                 # Level content (not in public/)
│   ├── level_1/
│   │   ├── image.jpg
│   │   └── audio.mp3
│   └── level_2/
│       ├── image.jpg
│       └── audio.mp3
│
├── public/                 # Static web files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # All styles
│   ├── app.js             # Game logic
│   └── favicon.ico        # Browser icon
│
├── server.js              # Express server
├── package.json           # Dependencies
├── railway.json           # Railway config
├── README.md              # This file
└── .gitignore             # Git ignore rules
```

## API Endpoints

The server provides two API endpoints for the frontend:

### GET /api/levels

Returns a list of valid level folder names.

**Response:**
```json
{
  "levels": ["level_1", "level_2", "level_3"]
}
```

### GET /api/levels/:levelName

Returns file information for a specific level.

**Response:**
```json
{
  "level": "level_1",
  "image": "photo.jpg",
  "audio": "message.mp3"
}
```

## Common Issues

### "No levels found" Error

**Cause:** The `levels/` folder is empty or contains no valid level folders.

**Solution:** Add at least one level folder with an image and audio file.

### Level Not Appearing

**Cause:** Level folder doesn't meet requirements.

**Check:**
- Folder name starts with `level_`
- Contains at least one image file
- Contains at least one audio file
- File extensions are supported formats

### Audio Not Playing

**Cause:** Browser autoplay policies may block audio.

**Solution:**
- User interaction (clicking "Begin") enables audio
- Use the "Replay Audio" button if needed
- Check browser console for errors

### Image Not Loading

**Cause:** Image file may be corrupted or unsupported format.

**Solution:**
- Use standard formats (JPG, PNG)
- Ensure file isn't corrupted
- Check file permissions

### Puzzle Seems Unsolvable

**Cause:** This shouldn't happen - the shuffle algorithm ensures solvability.

**Solution:** The puzzle is always solvable. Keep swapping tiles - you'll get there!

## Technical Notes

### Image Handling

- Images are sliced dynamically in the browser using Canvas
- Aspect ratio is preserved (square crop from center)
- Large images are handled gracefully (no pre-slicing required)

### Audio Security

- Audio files are never loaded until puzzle completion
- No preloading or DOM elements exist before solve
- Audio creation is gated by `isSolved === true`

### Mobile Support

- Touch-friendly tile interaction
- Responsive layout adapts to screen size
- No zoom/pinch issues (viewport configured)

### Accessibility

- Keyboard navigation supported (Tab + Enter)
- Reduced motion respected
- Focus indicators visible

## Tech Stack

- **Frontend:** Plain HTML5, CSS3, Vanilla JavaScript (ES6)
- **Backend:** Node.js with Express
- **Dependencies:** Express only (minimal)

## License

MIT License - See LICENSE file for details.
