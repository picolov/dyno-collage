import { Resvg } from '@resvg/resvg-js';

/**
 * Generates a collage image with positioned text and images
 * @param {Object} size - Size of the output image
 * @param {number} size.width - Width of the image
 * @param {number} size.height - Height of the image
 * @param {string} svgData - SVG data
 * @returns {Promise<Buffer>} - PNG image buffer
 */
export async function generateCollage(size, svgData) {
    // Create Resvg instance with the SVG data
    const resvg = new Resvg(svgData, {
        fitTo: {
            mode: 'original'
        },
        background: 'white',
    });

    // Render the SVG to PNG
    const pngData = resvg.render();
    
    // Convert to buffer
    return pngData.asPng();
}