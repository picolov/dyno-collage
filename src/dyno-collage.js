/** @typedef {import('./dyno-collage.d.ts').CommonCanvas} CommonCanvas */

/**
 * Generates a collage image from SVG data
 * @param {HTMLCanvasElement|CommonCanvas} canvas - Canvas element to draw on
 * @param {string} svgData - SVG image content
 * @returns {Promise<HTMLCanvasElement|CommonCanvas>} - Canvas element with the rendered SVG
 */
async function generateCollage(canvas, svgData) {
    if (typeof window !== 'undefined') {
        // Browser environment
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);
    } else {
        // Node.js environment
        const { loadImage } = await import('@napi-rs/canvas');
        const { JSDOM } = await import('jsdom');
        const { DOMParser } = new JSDOM().window;
        
        // Parse SVG to get dimensions
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgData, 'image/svg+xml');
        const svg = doc.documentElement;
        
        // Get SVG dimensions
        const width = parseInt(svg.getAttribute('width') || '400');
        const height = parseInt(svg.getAttribute('height') || '400');
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Convert SVG to PNG and draw directly to canvas
        const img = await loadImage(Buffer.from(svgData));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
    }
    
    return canvas;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateCollage };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.dynoCollage = { generateCollage };
}
