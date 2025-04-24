/** @typedef {import('./dyno-collage.d.ts').CommonCanvas} CommonCanvas */

/**
 * Generates a collage image with positioned text and images
 * @param {CommonCanvas} canvas - Canvas element to draw on
 * @param {Object} size - Size of the output image
 * @param {number} size.width - Width of the image
 * @param {number} size.height - Height of the image
 * @param {Array<string>} content - Array of instructions with values and styling
 * @returns {Promise<CommonCanvas>} - Canvas element with the collage
 */
async function generateCollage(canvas, size, content) {
  // Validate input parameters
  if (!canvas || !size || !content || !Array.isArray(content)) {
    throw new Error('Invalid input parameters');
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size
  canvas.width = size.width;
  canvas.height = size.height;

  // Set white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size.width, size.height);

  // Process each content instruction
  for (const instruction of content) {
    try {
      const [value, ...transformParts] = instruction.split(';');
      const transform = {};
      for (const pair of transformParts) {
        const [key, val] = pair.trim().split(' ');
        if (key && val) {
          transform[key] = val;
        }
      }

      // Calculate absolute positions from percentages
      const x = (parseFloat(transform.position?.split(',')[0] || '0') / 100) * size.width;
      const y = (parseFloat(transform.position?.split(',')[1] || '0') / 100) * size.height;

      if (value.toLowerCase().startsWith('text://')) {
        // Handle text
        const text = value.substring(7); // Remove #text: prefix
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Set font size if specified
        const fontSize = transform['font-size'] || '12';
        ctx.font = `${fontSize}px Arial`;

        // Handle rotation if specified
        if (transform['rotate']) {
          const rotation = parseFloat(transform['rotate']) * Math.PI / 180;
          if (!isNaN(rotation)) {
            ctx.save();
            const metrics = ctx.measureText(text);
            ctx.translate(x + metrics.width/2, y + parseInt(fontSize)/2);
            ctx.rotate(rotation);
            ctx.fillText(text, -metrics.width/2, -parseInt(fontSize)/2);
            ctx.restore();
          }
        } else {
          ctx.fillText(text, x, y);
        }
      } else {
        // Handle image URL
        try {
          let img;
          if (typeof window !== 'undefined') {
            // Browser environment
            img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = value;
            });
          } else {
            // Node.js environment
            const { loadImage } = await import('@napi-rs/canvas');
            img = await loadImage(value);
          }

          // Calculate scaling
          let scale = 1;
          if (transform['scale']) {
            scale = parseFloat(transform['scale']);
          }

          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          // Handle rotation if specified
          if (transform['rotate']) {
            const rotation = parseFloat(transform['rotate']) * Math.PI / 180;
            if (!isNaN(rotation)) {
              ctx.save();
              ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
              ctx.rotate(rotation);
              ctx.drawImage(
                img,
                -scaledWidth / 2,
                -scaledHeight / 2,
                scaledWidth,
                scaledHeight
              );
              ctx.restore();
            }
          } else {
            // Draw the image without rotation
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          }
        } catch (error) {
          console.error(`Error loading image from URL: ${value}`, error);
          // Draw error text
          ctx.fillStyle = 'red';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.font = '12px Arial';
          ctx.fillText('Error loading image', x, y);
        }
      }
    } catch (error) {
      console.error(`Error processing instruction: ${instruction}`, error);
    }
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
