FROM node:18-bookworm-slim

# Install ffmpeg (required by yt-dlp for audio processing/streaming)
# We also install python3 and ca-certificates just as a reliable fallback
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (this will also trigger our postinstall script to fetch yt-dlp)
COPY package*.json ./
COPY download-ytdlp.js ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
