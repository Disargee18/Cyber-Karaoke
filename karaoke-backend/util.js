/**
 * Cleans up YouTube titles to extract a clean Artist and Song Title.
 * Example: "Queen - Bohemian Rhapsody (Official Video) [HD]" -> { artist: "Queen", title: "Bohemian Rhapsody" }
 */
function cleanYoutubeTitle(rawTitle) {
    if (!rawTitle) return { artist: '', title: '' };

    // 1. Remove common text garbage in brackets or parentheses
    let clean = rawTitle.replace(/\s*[\(\[][^)]*[\)\]]/g, '');

    // 2. Remove common marketing buzzwords case-insensitively
    const junkWords = [
        /official video/gi, /official audio/gi, /lyric video/gi,
        /lyrics/gi, /hd/gi, /4k/gi, /remastered/gi, /high quality/gi, /hq/gi
    ];
    junkWords.forEach(regex => clean = clean.replace(regex, ''));

    // 3. Split by standard delimiters like "-" or "–" or "—"
    const splitParts = clean.split(/[-–—]/);

    if (splitParts.length >= 2) {
        return {
            artist: splitParts[0].trim(),
            title: splitParts[1].trim()
        };
    }

    // Failsafe: If no hyphen is present, return the whole thing as the title
    return {
        artist: '',
        title: clean.trim()
    };
}

module.exports = { cleanYoutubeTitle };