const express = require('express');
const cors = require('cors');
const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { cleanYoutubeTitle } = require('./util');

// Dynamically resolve yt-dlp path (checks local backend folder first, then falls back to system PATH)
function getYtdlpPath() {
    const localExeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const localPath = path.join(__dirname, localExeName);
    if (fs.existsSync(localPath)) {
        return localPath;
    }
    return 'yt-dlp';
}

// Asynchronously and non-blockingly fetch YouTube video titles (oEmbed -> yt-dlp fallback)
async function getYoutubeVideoTitle(youtubeUrl) {
    // Attempt 1: Fast, non-blocking YouTube oEmbed API (~50-100ms)
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
            const data = await res.json();
            if (data && data.title) {
                console.log(`⚡ Fast oEmbed Title Match: "${data.title}"`);
                return data.title;
            }
        }
    } catch (err) {
        console.warn('⚠️ oEmbed fetch failed, falling back to yt-dlp:', err.message);
    }

    // Attempt 2: Fallback to non-blocking yt-dlp exec (does not block Node event loop)
    return new Promise((resolve, reject) => {
        const ytdlpPath = getYtdlpPath();
        const isWin = process.platform === 'win32';
        const cmd = isWin ? `"${ytdlpPath}" --get-title "${youtubeUrl}"` : `python3 "${ytdlpPath}" --get-title "${youtubeUrl}"`;
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    try {
        const ls = execSync('ls -la').toString();
        const ytdlp = fs.existsSync(getYtdlpPath()) ? 'EXISTS' : 'MISSING';
        const python = execSync('python3 --version').toString();
        let ytdlpVer = 'ERROR';
        try {
            ytdlpVer = execSync(`python3 ${getYtdlpPath()} --version`).toString();
        } catch(e) {
            ytdlpVer = e.message;
        }
        res.json({ ls, ytdlp, python, ytdlpVer });
    } catch(err) {
        res.json({ error: err.message });
    }
});

/**
 * ROUTE 1: GET AUDIO STREAM FROM YOUTUBE
 * Pipes raw audio bytes from yt-dlp straight to the client browser
 */
app.get('/api/stream', (req, res) => {
    const youtubeUrl = req.query.url;

    if (!youtubeUrl) {
        return res.status(400).json({ error: 'Missing YouTube URL' });
    }

    console.log(`🎵 Streaming audio for: ${youtubeUrl}`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    const ytdlpPath = getYtdlpPath();
    const isWin = process.platform === 'win32';
    
    // Spawns yt-dlp to output the audio straight to stdout (-)
    const cmd = isWin ? ytdlpPath : 'python3';
    const args = isWin ? [
        '--no-playlist',
        '-f', 'bestaudio/best',
        '-o', '-',
        youtubeUrl
    ] : [
        ytdlpPath,
        '--no-playlist',
        '-f', 'bestaudio/best',
        '-o', '-',
        youtubeUrl
    ];

    const ytdlp = spawn(cmd, args);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (data) => {
        // Keeps track of internal backend downloading logs silently
        console.error(`yt-dlp stderr: ${data.toString()}`);
    });

    req.on('close', () => {
        console.log('🛑 User stopped singing. Killing audio stream process.');
        ytdlp.kill();
    });
});

/**
 * ROUTE 2: AUTOMATIC LYRICS FINDER (.LRC)
 * Scans a YouTube URL, extracts metadata, cleans it, and fetches synced lyrics
 */
app.get('/api/lyrics', async (req, res) => {
    const youtubeUrl = req.query.url;

    if (!youtubeUrl) {
        return res.status(400).json({ error: 'Missing YouTube URL' });
    }

    try {
        console.log(`🔍 Automating lyrics search for: ${youtubeUrl}`);

        // 1. Fetch title asynchronously (fast oEmbed API or non-blocking yt-dlp)
        const rawTitle = await getYoutubeVideoTitle(youtubeUrl);
        console.log(`🏷️ Resolved YouTube Title: "${rawTitle}"`);

        // 2. Pass the title through our Awesome Sauce cleaning script
        const { artist, title } = cleanYoutubeTitle(rawTitle);
        console.log(`🧼 Cleaned Meta -> Artist: "${artist}" | Track: "${title}"`);

        if (!title) {
            return res.status(404).json({ error: "Could not parse track title from link." });
        }

        // 3. Try to get exact match from LRCLIB first
        let data = null;
        if (artist && title) {
            try {
                const lrclibUrl = `https://lrclib.net/api/get?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}`;
                const response = await fetch(lrclibUrl);
                if (response.ok) {
                    data = await response.json();
                }
            } catch (err) {
                console.warn('⚠️ LRCLIB exact match failed:', err.message);
            }
        }

        // 4. Fallback: If exact match failed or has no synced lyrics, run search API with fuzzy matching
        if (!data || !data.syncedLyrics) {
            try {
                const searchQuery = artist ? `${artist} ${title}` : title;
                console.log(`🔍 Exact match failed. Performing fuzzy search for: "${searchQuery}"`);
                
                const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
                const response = await fetch(searchUrl);
                
                if (response.ok) {
                    const results = await response.json();
                    if (Array.isArray(results) && results.length > 0) {
                        // Find first track with synced lyrics
                        const matchedTrack = results.find(t => t.syncedLyrics);
                        if (matchedTrack) {
                            console.log(`✨ Fuzzy search match found: "${matchedTrack.artistName} - ${matchedTrack.name}"`);
                            data = {
                                artist: matchedTrack.artistName,
                                track: matchedTrack.name,
                                syncedLyrics: matchedTrack.syncedLyrics,
                                plainLyrics: matchedTrack.plainLyrics
                            };
                        }
                    }
                }
            } catch (err) {
                console.warn('⚠️ LRCLIB fuzzy search failed:', err.message);
            }
        }

        // 5. Return the synchronized karaoke lyrics text back to the React application
        if (data && (data.syncedLyrics || data.plainLyrics)) {
            return res.json({
                artist: data.artist || artist,
                title: data.track || title,
                syncedLyrics: data.syncedLyrics || null,
                plainLyrics: data.plainLyrics || null
            });
        }

        return res.status(404).json({
            error: "Lyrics missing in global database.",
            parsedMeta: { artist, title }
        });

    } catch (error) {
        console.error("❌ Lyrics Automation Error:", error.message);
        res.status(500).json({ error: "Internal server failed to process lyrics automation." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Karaoke Backend running at http://localhost:${PORT}`);
});