import { errorHandler } from '../middleware/errorHandler';

const { dbOperations } = require('../db');
const ShortUniqueId = require('short-unique-id');

export async function getQRById(req, _url) {
    try {
        const id = req.params.id;
        const qr = await dbOperations.getQRById(id);
        if (!qr) {
            return errorHandler(new Error('QR not found'));
        }
        // Redirect to the generate endpoint with the stored content
        return new Response(JSON.stringify({
            redirect: `${window.location.origin}/generate/${qr.content}`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return errorHandler(error, 'Failed to get QR by id');
    }
}

export async function saveQR(req, _url) {
    try {
        const content = req.parsedBody.content;
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
        return errorHandler(error, 'Failed to save QR');
    }
}