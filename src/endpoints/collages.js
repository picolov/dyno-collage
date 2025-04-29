import { errorHandler } from '../middleware/errorHandler';

const { dbOperations } = require('../db');
const LZString = require('../../public/lz-string.min');
const { getSVGDimensions } = require('../utility/svg');

export async function searchCollagesWithPaging(_req, url) {
    try {
        const page = parseInt(url.searchParams.get('page')) || 1;
        const pageSize = parseInt(url.searchParams.get('pageSize')) || 12;
        const search = url.searchParams.get('search') || '';

        const result = await dbOperations.getAllCollages(page, pageSize, search);
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to get collages');
    }
}

export async function saveCollage(req, _url) {
    try {
        const { name, content } = req.parsedBody;
        const svg = LZString.decompressFromEncodedURIComponent(content);
        const { width, height } = getSVGDimensions(svg);
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
        const totalCount = await dbOperations.getCollagesTotalCount('');
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
        // Check if error is due to duplicate name
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return errorHandler(error, 'A collage with this name already exists. Please choose a different name.');
        } else {
            return errorHandler(error, 'Failed to save collage');
        }
    }
}

export async function getCollagesTotalCount(_req, url) {
    try {
        const search = url.searchParams.get('search') || '';
        const count = await dbOperations.getCollagesTotalCount(search);
        return new Response(JSON.stringify({ total: count }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to get collages total count');
    }
}

export async function getCollageById(req, _url) {
    try {
        const collage = await dbOperations.getCollageById(req.params.id);
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
        return errorHandler(error, 'Failed to get collage by id');
    }
}

export async function deleteCollage(req, _url) {
    try {
        await dbOperations.deleteCollage(req.params.id);
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to delete collage');
    }
}