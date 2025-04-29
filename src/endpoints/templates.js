import { errorHandler } from '../middleware/errorHandler';

const { dbOperations } = require('../db');
const LZString = require('../../public/lz-string.min');
const { getSVGDimensions } = require('../utility/svg');

export async function searchTemplatesWithPaging(_req, url) {
    try {
        const page = parseInt(url.searchParams.get('page')) || 1;
        const pageSize = parseInt(url.searchParams.get('pageSize')) || 12;
        const search = url.searchParams.get('search') || '';

        const result = await dbOperations.getAllTemplates(page, pageSize, search);
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to get templates');
    }
}

export async function saveTemplate(req, _url) {
    try {
        const { id, content } = req.parsedBody;
        const svg = LZString.decompressFromEncodedURIComponent(content);
        const { width, height } = getSVGDimensions(svg);
        await dbOperations.saveTemplate(id, width, height, content);
        return new Response(JSON.stringify({ id }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        // Check if error is due to duplicate name
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return errorHandler(error, 'A template with this name already exists. Please choose a different name.');
        } else {
            return errorHandler(error, 'Failed to save template');
        }
    }
}

export async function getTemplatesTotalCount(_req, url) {
    try {
        const search = url.searchParams.get('search') || '';
        const count = await dbOperations.getTemplatesTotalCount(search);
        return new Response(JSON.stringify({ total: count }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to get templates total count');
    }
}

export async function getTemplateById(req, _url) {
    try {
        const template = await dbOperations.getTemplateById(req.params.id);
        if (!template) {
            return new Response(JSON.stringify({ error: 'Template not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify(template), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to get template by id');
    }
}

export async function deleteTemplate(req, _url) {
    try {
        await dbOperations.deleteTemplate(req.params.id);
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to delete template');
    }
}