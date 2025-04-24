import { createCanvas } from '@napi-rs/canvas';
import { generateCollage as dynoGenerateCollage } from './dyno-collage.js';

/**
 * Generates a collage image with positioned text and images
 * @param {Object} size - Size of the output image
 * @param {number} size.width - Width of the image
 * @param {number} size.height - Height of the image
 * @param {Array<string>} content - Array of instructions with values and styling
 * @returns {Promise<Buffer>} - PNG image buffer
 */
export async function generateCollage(size, content) {
  // Create a canvas
  const canvas = createCanvas(size.width, size.height);
  
  // Generate the collage
  await dynoGenerateCollage(canvas, size, content);
  
  // Convert to buffer
  return canvas.toBuffer('image/png');
}