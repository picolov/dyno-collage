const express = require('express');
const { generateCollage } = require('./index');
const LZString = require('./lz-string.min');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the browser version of dyno-collage
app.get('/dyno-collage.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(fs.readFileSync(path.join(__dirname, 'dyno-collage.js')));
});

// Serve the browser version of lz-string
app.get('/lz-string.min.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(fs.readFileSync(path.join(__dirname, 'lz-string.min.js')));
});

// Handle compressed parameters in URL path
app.get('/generate/:compressedParams', async (req, res) => {
  try {
    const params = JSON.parse(LZString.decompressFromEncodedURIComponent(req.params.compressedParams));
    const width = parseInt(String(params[0] || '200'));
    const height = parseInt(String(params[1] || '200'));
    const content = String(params[2] || '').split('\n').filter(line => line.trim());
    console.log('compressed content:',content);
    // Validate parameters
    if (!width || !height || !content.length) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate the collage
    const imageBuffer = await generateCollage(
      { width, height },
      content
    );

    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename=collage.png');

    // Send the image
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating collage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle uncompressed parameters as query parameters
app.get('/generate', async (req, res) => {
  try {
    const width = parseInt(String(req.query.width || '200'));
    const height = parseInt(String(req.query.height || '200'));
    const content = String(req.query.content || '').split('\n').filter(line => line.trim());
    console.log('uncompressed content:',content);
    // Validate parameters
    if (!width || !height || !content.length) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate the collage
    const imageBuffer = await generateCollage(
      { width, height },
      content
    );

    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename=collage.png');

    // Send the image
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating collage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 