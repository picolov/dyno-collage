import { errorHandler } from '../middleware/errorHandler';

const { replaceTemplatePlaceholders } = require('../utility/html');
const path = require('path');

export async function getIndexPage(req, _url) {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    const file = Bun.file(indexPath);
    if (!await file.exists()) {
        return errorHandler(new Error('File not found: index.html'));
    }

    // Read the HTML content
    let htmlContent = await file.text();

    // Replace placeholders
    htmlContent = replaceTemplatePlaceholders(htmlContent);

    return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html' }
    });
}

export async function getCollectionsPage(req, _url) {
    const collectionsPath = path.join(process.cwd(), 'public', 'collections.html');
    const file = Bun.file(collectionsPath);
    if (!await file.exists()) {
        return errorHandler(new Error('File not found: collections.html'));
    }

    // Read the HTML content
    let htmlContent = await file.text();

    // Replace placeholders
    htmlContent = replaceTemplatePlaceholders(htmlContent);

    return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html' }
    });
}
