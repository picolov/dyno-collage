const express = require('express');
const { generateCollage } = require('./index');
const LZString = require('./lz-string.min');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();

// Check for SSL certificate files
const domain = 'picolov.com'; // Replace with your domain
const certPath = `/etc/letsencrypt/live/${domain}`;
let httpsServer = null;

try {
    const privateKey = fs.readFileSync(`${certPath}/privkey.pem`, 'utf8');
    const certificate = fs.readFileSync(`${certPath}/cert.pem`, 'utf8');
    const ca = fs.readFileSync(`${certPath}/chain.pem`, 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    // Create HTTPS server if certificates exist
    httpsServer = https.createServer(credentials, app);
    console.log('SSL certificates found, HTTPS server will be started');
} catch (error) {
    console.log('SSL certificates not found, only HTTP server will be started');
}

// Create HTTP server
const httpServer = http.createServer(app);

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

// Start servers
const HTTP_PORT = process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP Server running on port ${HTTP_PORT}`);
});

if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
    });
}