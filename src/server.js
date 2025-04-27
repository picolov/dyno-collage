const LZString = require('./lz-string.min');
const path = require('path');
const fs = require('fs');
const { dbOperations } = require('./db');
const ShortUniqueId = require('short-unique-id');
const { Resvg } = require('@resvg/resvg-js');
function renderSVG(svgData) {
    const resvg = new Resvg(svgData, {
        fitTo: {
            mode: 'original'
        },
        background: 'white',
    });
    const pngData = resvg.render();
    return pngData.asPng();
}
function getSVGDimensions(svgData) {
    let width,height;
    const svgWidthMatch = svgData.match(/width=["'](\d+)(px)?["']/i);
    const svgHeightMatch = svgData.match(/height=["'](\d+)(px)?["']/i);
    if (!svgWidthMatch || !svgHeightMatch) {
        const viewBoxMatch = svgData.match(/viewBox=["'](\d+)\s+(\d+)\s+(\d+)\s+(\d+)["']/i);
        if (viewBoxMatch) {
            // viewBox format: x y width height
            width = parseInt(viewBoxMatch[3]);
            height = parseInt(viewBoxMatch[4]);
        }
    } else {
        width = parseInt(svgWidthMatch[1]);
        height = parseInt(svgHeightMatch[1]);
    }
    return { width, height };
}
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
        ca: Bun.file(`${certPath}/chain.pem`),
        // More permissive TLS settings
        rejectUnauthorized: false,
        requestCert: false
    };
    
    console.log('SSL certificates found and validated, HTTPS server will be started');
} catch (error) {
    console.error('SSL configuration error:', error.message);
    console.log('Only HTTP server will be started');
}

// Create the server
const server = Bun.serve({
    port: process.env.PORT || (tls ? 8443 : 8080),
    tls,
    async fetch(req) {
        try {
            const url = new URL(req.url);
            
            // Handle static files
            
            if (url.pathname === '/lz-string.min.js') {
                const file = Bun.file(path.join(__dirname, 'lz-string.min.js'));
                if (!await file.exists()) {
                    throw new Error('File not found: lz-string.min.js');
                }
                return new Response(file, {
                    headers: { 'Content-Type': 'application/javascript' }
                });
            }
            
            // Root route
            if (url.pathname === '/') {
                const indexPath = path.join(process.cwd(), 'public', 'index.html');
                const file = Bun.file(indexPath);
                if (!await file.exists()) {
                    throw new Error('File not found: index.html');
                }
                return new Response(file, {
                    headers: { 'Content-Type': 'text/html' }
                });
            }

            // Collections page
            if (url.pathname === '/collections') {
                const collectionsPath = path.join(process.cwd(), 'public', 'collections.html');
                const file = Bun.file(collectionsPath);
                if (!await file.exists()) {
                    throw new Error('File not found: collections.html');
                }
                return new Response(file, {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            
            // API endpoints
            if (url.pathname === '/api/collages') {
                if (req.method === 'GET') {
                    try {
                        const page = parseInt(url.searchParams.get('page')) || 1;
                        const pageSize = parseInt(url.searchParams.get('pageSize')) || 12;
                        const search = url.searchParams.get('search') || '';
                        
                        const result = await dbOperations.getAllCollages(page, pageSize, search);
                        return new Response(JSON.stringify(result), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error getting collages:', error);
                        return new Response(JSON.stringify({ error: 'Failed to get collages' }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else if (req.method === 'POST') {
                    try {
                        const body = await req.json();
                        const { name, content } = body;
                        const { width, height } = getSVGDimensions(content);
                        // Check content length
                        if (content.length > 2000) {
                            return new Response(JSON.stringify({ 
                                error: 'Content length exceeds maximum limit of 2000 characters. sorry, this so that my server doesn\'t explode. this will be a Member only feature in the future.' 
                            }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }

                        // Check total records count
                        const totalCount = await dbOperations.getTotalCount('');
                        if (totalCount >= 10000) {
                            return new Response(JSON.stringify({ 
                                error: 'Our database has reached the maximum number of records (10,000). Please wait until we perform maintenance to add more capacity.' 
                            }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }

                        const result = await dbOperations.saveCollage(name, width, height, content);
                        return new Response(JSON.stringify({ id: result.lastInsertRowid }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error saving collage:', error);
                        let errorMessage = 'Failed to save collage';
                        
                        // Check if error is due to duplicate name
                        if (error.message && error.message.includes('UNIQUE constraint failed')) {
                            errorMessage = 'A collage with this name already exists. Please choose a different name.';
                        }
                        
                        return new Response(JSON.stringify({ error: errorMessage }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }

            if (url.pathname === '/api/collages/count') {
                if (req.method === 'GET') {
                    try {
                        const search = url.searchParams.get('search') || '';
                        const count = await dbOperations.getTotalCount(search);
                        return new Response(JSON.stringify({ total: count }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error getting total count:', error);
                        return new Response(JSON.stringify({ error: 'Failed to get total count' }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }

            if (url.pathname.startsWith('/api/collages/')) {
                const id = parseInt(url.pathname.split('/api/collages/')[1]);
                if (req.method === 'GET') {
                    try {
                        const collage = await dbOperations.getCollageById(id);
                        if (!collage) {
                            return new Response(JSON.stringify({ error: 'Collage not found' }), {
                                status: 404,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        return new Response(JSON.stringify(collage), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error getting collage:', error);
                        return new Response(JSON.stringify({ error: 'Failed to get collage' }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else if (req.method === 'DELETE') {
                    try {
                        await dbOperations.deleteCollage(id);
                        return new Response(JSON.stringify({ success: true }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error deleting collage:', error);
                        return new Response(JSON.stringify({ error: 'Failed to delete collage' }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }
            
            // Handle compressed parameters in URL path
            if (url.pathname.startsWith('/png/')) {
                try {
                    const param = url.pathname.split('/png/')[1];
                    let imageBuffer;
                    if (param.startsWith('%3Csvg') || param.startsWith('<svg')) {
                        const decodedParam = decodeURIComponent(param);
                        imageBuffer = renderSVG(decodedParam);
                    } else {
                        const svg = LZString.decompressFromEncodedURIComponent(param);
                        imageBuffer = renderSVG(svg);
                    }
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
            
            // Handle meta preview endpoint
            if (url.pathname.startsWith('/meta/')) {
                try {
                    const param = url.pathname.split('/meta/')[1];
                    let svg;
                    if (param.startsWith('%3Csvg') || param.startsWith('<svg')) {
                        svg = decodeURIComponent(param);
                    } else {
                        svg = LZString.decompressFromEncodedURIComponent(param);
                    }
                    
                    // Get dimensions
                    const { width, height } = getSVGDimensions(svg);
                    
                    // Create image URL for preview
                    const imageUrl = `${url.origin}/png/${param}`;
                    
                    // Create HTML with meta tags
                    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dyno Collage</title>
    
    <!-- Open Graph / Facebook / WhatsApp / Slack -->
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:description" content="Check out this collage">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${imageUrl}">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: white;
        }
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    <img src="${imageUrl}" alt="Collage" />
</body>
</html>`;
                    
                    return new Response(html, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                } catch (error) {
                    console.error('Error generating meta preview:', error);
                    return new Response(JSON.stringify({ error: error.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Handle QR code generation
            if (url.pathname.startsWith('/qr/')) {
                if (req.method === 'POST') {
                    try {
                        const content = url.pathname.split('/qr/')[1];
                        
                        // Generate ID: 6 chars (date) + 8 chars (short-unique-uuid)
                        const now = new Date();
                        const datePart = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear().toString().slice(-2)}`;
                        const short = new ShortUniqueId({ length: 10 });
                        const uuidPart = short.rnd();
                        const id = `${datePart}${uuidPart}`;
                        
                        const result = await dbOperations.saveQR(id, content);
                        
                        return new Response(JSON.stringify({ id: result.id }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error saving QR:', error);
                        return new Response(JSON.stringify({ error: 'Failed to save QR' }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else if (req.method === 'GET') {
                    try {
                        const id = url.pathname.split('/qr/')[1];
                        const qr = await dbOperations.getQRById(id);
                        
                        if (!qr) {
                            return new Response(JSON.stringify({ error: 'QR not found' }), {
                                status: 404,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        // Redirect to the generate endpoint with the stored content
                        return new Response(JSON.stringify({ 
                            redirect: `${window.location.origin}/generate/${qr.content}` 
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (error) {
                        console.error('Error getting QR:', error);
                        return new Response(JSON.stringify({ error: 'Failed to get QR' }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }
            
            // Serve static files from public directory
            const publicPath = path.join(process.cwd(), 'public', url.pathname);
            const file = Bun.file(publicPath);
            if (await file.exists() && !(await file).type.includes('directory')) {
                return new Response(file);
            }
            
            return new Response('Not Found', { status: 404 });
        } catch (error) {
            console.error('Server error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    },
    error(error) {
        console.error('Server Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});

console.log(`Server running on ${tls ? 'HTTPS' : 'HTTP'} at port ${server.port}`);