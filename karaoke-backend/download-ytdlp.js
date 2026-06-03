const fs = require('fs');
const path = require('path');
const https = require('https');

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

let releaseName = 'yt-dlp';
if (isWin) {
    releaseName = 'yt-dlp.exe';
} else if (isMac) {
    releaseName = 'yt-dlp_macos';
} else {
    releaseName = 'yt-dlp'; // Standalone binary for Linux
}

const fileName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${releaseName}`;
const filePath = path.join(__dirname, fileName);

if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    console.log(`Downloading ${fileName}...`);
    
    if (!isWin) {
        // On Linux/Mac, use wget/curl which perfectly handle multiple redirects
        try {
            const { execSync } = require('child_process');
            execSync(`wget -qO ${filePath} ${url} || curl -Lo ${filePath} ${url}`, { stdio: 'inherit' });
            fs.chmodSync(filePath, '755');
            console.log(`Successfully downloaded ${fileName} via wget/curl`);
        } catch(e) {
            console.error(`Failed to download via wget/curl:`, e.message);
        }
    } else {
        // Windows fallback (simple redirect follower)
        const file = fs.createWriteStream(filePath);
        const getWithRedirects = (reqUrl) => {
            https.get(reqUrl, (response) => {
                if ([301, 302, 307, 308].includes(response.statusCode)) {
                    getWithRedirects(response.headers.location);
                } else {
                    response.pipe(file);
                    file.on('finish', () => { file.close(); console.log(`Successfully downloaded ${fileName}`); });
                }
            }).on('error', (err) => {
                fs.unlink(filePath, () => {});
                console.error(`Error downloading: ${err.message}`);
            });
        };
        getWithRedirects(url);
    }
} else {
    console.log(`${fileName} already exists. Skipping download.`);
}
