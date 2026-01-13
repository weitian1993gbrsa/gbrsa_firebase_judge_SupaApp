import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target src/main.js
const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');

try {
    let content = fs.readFileSync(mainJsPath, 'utf8');

    // Generate Format: YYYYMMDD_HHmm (Matches the format used in main.js)
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');

    // Create timestamp: 20260108_0945
    const timestamp =
        now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        '_' +
        pad(now.getHours()) +
        pad(now.getMinutes());

    // Regex to find: const BUILD_ID = '...';
    // Matches explicit single quotes as per the file style
    // Regex to find: const BUILD_ID = '...'; or "..."
    // Matches both single and double quotes
    const regex = /const BUILD_ID = ['"].*?['"];/;
    const replacement = `const BUILD_ID = '${timestamp}';`;

    if (content.match(regex)) {
        const newContent = content.replace(regex, replacement);
        fs.writeFileSync(mainJsPath, newContent, 'utf8');
        console.log(`[Build] Updated src/main.js BUILD_ID to: ${timestamp}`);
    } else {
        console.log('[Build] Warning: BUILD_ID constant not found in src/main.js');
        process.exit(1); // Fail the build if we can't update version
    }

} catch (err) {
    console.error('[Build] Error updating timestamp:', err);
    process.exit(1);
}
