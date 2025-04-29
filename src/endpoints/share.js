import { errorHandler } from '../middleware/errorHandler';

const { dbOperations } = require('../db');
const LZString = require('../../public/lz-string.min');
const { renderSVGToImage } = require('../utility/svg');

const shareTypes = {
    'png': 'image',
    'whatsapp': 'meta-preview',
    'slack': 'image',
    'instagram': 'image',
    'telegram': 'image',
    'twitter': 'image'
};

export async function shareImage(req, url) {
    for (const [shareType, returnType] of Object.entries(shareTypes)) {
        if (req.params.type === shareType) {
            try {
                const content = req.params.content;
                if (returnType === 'meta-preview') {
                    // Create image URL for preview
                    let imageUrl;
                    if (process.env.NODE_ENV === 'production') {
                        imageUrl = `${url.origin}/compose/png/${content}`;
                    } else {
                        imageUrl = `${url.origin}/png/${content}`;
                    }
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
                } else {
                    let imageBuffer;
                    if (content.startsWith('%3Csvg') || content.startsWith('<svg')) {
                        const decodedContent = decodeURIComponent(content);
                        imageBuffer = renderSVGToImage(decodedContent);
                    } else {
                        const svg = LZString.decompressFromEncodedURIComponent(content);
                        imageBuffer = renderSVGToImage(svg);
                    }

                    return new Response(imageBuffer, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Content-Disposition': 'inline; filename=collage.png'
                        }
                    });
                }
            } catch (error) {
                return errorHandler(error, 'Failed to share');
            }
        }
    }
    return errorHandler(new Error('Invalid share type'), 'Invalid share type');
}

export async function shareTemplate(req, url) {
    for (const [shareType, returnType] of Object.entries(shareTypes)) {
        if (req.params.type === shareType) {
            try {
                const params = req.params.params;
                const id = req.params.id;
                if (returnType === 'meta-preview') {
                    // Create image URL for preview
                    let imageUrl;
                    if (process.env.NODE_ENV === 'production') {
                        imageUrl = `${url.origin}/compose/png/${id}/${params.join('/')}`;
                    } else {
                        imageUrl = `${url.origin}/png/${id}/${params.join('/')}`;
                    }
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
                } else {
                    let imageBuffer;
                    const template = await dbOperations.getTemplateById(id);
                    if (!template) {
                        return new Response(JSON.stringify({ error: 'Template not found' }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    let svg = LZString.decompressFromEncodedURIComponent(template.content);
                    // replace svg string for each {1} with templateParams[1]
                    for (let i = 0; i < params.length; i++) {
                        svg = svg.replace(`{param${i + 1}}`, params[i]);
                    }
                    imageBuffer = renderSVGToImage(svg);

                    return new Response(imageBuffer, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Content-Disposition': 'inline; filename=collage.png'
                        }
                    });
                }
            } catch (error) {
                return errorHandler(error, 'Failed to share');
            }
        }
    }
    return errorHandler(new Error('Invalid share type'), 'Invalid share type');
}