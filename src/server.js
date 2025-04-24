const { generateCollage } = require('./index');
const LZString = require('./lz-string.min');
const path = require('path');
const fs = require('fs');

// Check for SSL certificate files
const domain = 'picolov.com';
const certPath = `/etc/letsencrypt/live/${domain}`;
let tls = null;

try {
    // Verify certificate files exist and are readable
    const certFiles = ['privkey.pem', 'cert.pem', 'chain.pem'];
    for (const file of certFiles) {
        const filePath = `${certPath}/${file}`;
        if (!fs.existsSync(filePath)) {
            throw new Error(`Certificate file not found: ${filePath}`);
        }
        if (!fs.readFileSync(filePath, 'utf8')) {
            throw new Error(`Certificate file is empty: ${filePath}`);
        }
    }

    tls = {
        key: Bun.file(`${certPath}/privkey.pem`),
        cert: Bun.file(`${certPath}/cert.pem`),
        ca: Bun.file(`${certPath}/chain.pem`)
    };
    
    console.log('SSL certificates found and validated, HTTPS server will be started');
} catch (error) {
    console.error('SSL configuration error:', error.message);
    console.log('Only HTTP server will be started');
}

// Create the server
const server = Bun.serve({
    port: process.env.PORT || 8080,
    tls,
    async fetch(req) {
        const url = new URL(req.url);
        
        // Handle static files
        if (url.pathname === '/dyno-collage.js') {
            return new Response(Bun.file(path.join(__dirname, 'dyno-collage.js')), {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        if (url.pathname === '/lz-string.min.js') {
            return new Response(Bun.file(path.join(__dirname, 'lz-string.min.js')), {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        // Handle compressed parameters in URL path
        if (url.pathname.startsWith('/generate/')) {
            try {
                const compressedParams = url.pathname.split('/generate/')[1];
                const params = JSON.parse(LZString.decompressFromEncodedURIComponent(compressedParams));
                const width = parseInt(String(params[0] || '200'));
                const height = parseInt(String(params[1] || '200'));
                const content = String(params[2] || '').split('\n').filter(line => line.trim());
                
                if (!width || !height || !content.length) {
                    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                const imageBuffer = await generateCollage({ width, height }, content);
                
                return new Response(imageBuffer, {
                    headers: {
                        'Content-Type': 'image/png',
                        'Content-Disposition': 'inline; filename=collage.png'
                    }
                });
            } catch (error) {
                console.error('Error generating collage:', error);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Handle uncompressed parameters as query parameters
        if (url.pathname === '/generate') {
            try {
                const width = parseInt(String(url.searchParams.get('width') || '200'));
                const height = parseInt(String(url.searchParams.get('height') || '200'));
                const content = String(url.searchParams.get('content') || '').split('\n').filter(line => line.trim());
                
                if (!width || !height || !content.length) {
                    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                const imageBuffer = await generateCollage({ width, height }, content);
                
                return new Response(imageBuffer, {
                    headers: {
                        'Content-Type': 'image/png',
                        'Content-Disposition': 'inline; filename=collage.png'
                    }
                });
            } catch (error) {
                console.error('Error generating collage:', error);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Root route
        if (url.pathname === '/') {
            const indexPath = path.join(process.cwd(), 'public', 'index.html');
            if (fs.existsSync(indexPath)) {
                return new Response(Bun.file(indexPath), {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            return new Response('Not Found', { status: 404 });
        }
        
        // Serve static files from public directory
        const publicPath = path.join(process.cwd(), 'public', url.pathname);
        if (fs.existsSync(publicPath) && !fs.lstatSync(publicPath).isDirectory()) {
            return new Response(Bun.file(publicPath));
        }
        
        // 404 for unknown routes
        return new Response('Not Found', { status: 404 });
    },
    error(error) {
        console.error('Server Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});

console.log(`Server running on ${tls ? 'HTTPS' : 'HTTP'} at port ${server.port}`);