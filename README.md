# Cyber Karaoke 🎤✨

Welcome to **Cyber Karaoke**, a full-stack, futuristic karaoke web application that lets you sing your heart out to your favorite YouTube videos with synchronized lyrics and dynamic audio visualization!

## 🌟 Features

- **YouTube Audio Streaming**: Paste any YouTube link, and the backend will seamlessly stream the high-quality audio directly to your browser without downloading the full video.
- **Automated Synced Lyrics**: The app automatically fetches synchronized `.lrc` lyrics for your songs using LRCLIB, allowing you to sing along in real-time.
- **Dynamic Audio Visualizer**: Watch the music come to life with a responsive audio visualizer synced to the streaming track.
- **Webcam Background**: Perform like a star by using your webcam as the dynamic backdrop while you sing.
- **LRC Editor**: Fine-tune or edit synced lyrics directly within the app.
- **Cyberpunk / Retro Aesthetics**: A visually stunning UI built with modern tools and styled with retro and cyber bling.

## 🛠️ Tech Stack

### Frontend (`Karaoke-Site`)
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Core Components**: MediaCenter, AudioVisualizer, LyricsDisplay, LrcEditor, WebcamBg, RetroWindow.

### Backend (`karaoke-backend`)
- **Runtime**: Node.js
- **Server**: Express.js
- **Audio Extraction**: `yt-dlp` (Streamed directly via child processes)
- **Lyrics Provider**: LRCLIB API (OEmbed & fuzzy search fallback integration)
- **Utilities**: Custom YouTube title parsing for precise artist and track matching.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher recommended).
- `yt-dlp` installed and available in your system PATH (or placed inside the `karaoke-backend` directory).

### Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd Karaoke
   ```

2. **Start the Backend**:
   Navigate to the backend directory, install dependencies, and start the server.
   ```bash
   cd karaoke-backend
   npm install
   npm start
   ```
   *The backend will run on `http://localhost:3001`.*

3. **Start the Frontend**:
   Open a new terminal, navigate to the frontend directory, install dependencies, and run the Vite development server.
   ```bash
   cd Karaoke-Site
   npm install
   npm run dev
   ```
   *The frontend will typically run on `http://localhost:5173`.*

## 📂 Project Structure

```text
Karaoke/
├── Karaoke-Site/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components (LyricsDisplay, AudioVisualizer, etc.)
│   │   └── ...
│   └── package.json
└── karaoke-backend/       # Node.js Express server
    ├── server.js          # Main server logic, yt-dlp integration, and lyrics fetching
    ├── util.js            # Utilities like title cleaning
    └── package.json
```

## 🎮 How to Use

1. Launch both the backend and frontend servers.
2. Open the frontend in your browser.
3. Paste a YouTube URL into the Media Center.
4. The backend will automatically fetch the track's audio and synchronized lyrics.
5. Turn on your webcam, watch the audio visualizer, and start singing!

## 📝 License
ISC License
