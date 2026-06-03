const fs = require('fs');
const path = require('path');
const https = require('https');

const isWin = process.platform === 'win32';
const fileName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${fileName}`;
const filePath = path.join(__dirname, fileName);

if (!fs.existsSync(filePath)) {
    console.log(`Downloading ${fileName}...`);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            // Follow redirect
            https.get(response.headers.location, (redirectResponse) => {
                redirectResponse.pipe(file);
                file.on('finish', () => {
                    file.close();
                    if (!isWin) {
                        fs.chmodSync(filePath, '755'); // Make executable on Linux/Mac
                    }
                    console.log(`Successfully downloaded ${fileName}`);
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => {});
                console.error(`Error downloading: ${err.message}`);
            });
        } else {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                if (!isWin) {
                    fs.chmodSync(filePath, '755');
                }
                console.log(`Successfully downloaded ${fileName}`);
            });
        }
    }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        console.error(`Error downloading: ${err.message}`);
    });
} else {
    console.log(`${fileName} already exists. Skipping download.`);
}
