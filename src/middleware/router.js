import { searchCollagesWithPaging, getCollagesTotalCount, getCollageById, deleteCollage, saveCollage } from '../endpoints/collages';
import { searchTemplatesWithPaging, getTemplatesTotalCount, getTemplateById, deleteTemplate, saveTemplate } from '../endpoints/templates';
import { shareImage, shareTemplate } from '../endpoints/share';
import { getQRById, saveQR } from '../endpoints/qr';
import { getCollectionsPage, getIndexPage } from '../endpoints/static_resource';
import { APIError, errorHandler } from './errorHandler';

const routes = {
    '/api/templates': {
        GET: {
            handler: searchTemplatesWithPaging,
            validator: async (req, url) => {
                const page = parseInt(url.searchParams.get('page'));
                const pageSize = parseInt(url.searchParams.get('pageSize'));

                if (page && (isNaN(page) || page < 1)) {
                    throw new APIError('Page must be a positive integer', 400);
                }
                if (pageSize && (isNaN(pageSize) || pageSize < 1 || pageSize > 100)) {
                    throw new APIError('Page size must be between 1 and 100', 400);
                }
            }
        },
        POST: {
            handler: saveTemplate,
            validator: async (req, url) => {
                if (!req.parsedBody.id || typeof req.parsedBody.id !== 'string' || req.parsedBody.id.trim().length === 0) {
                    throw new APIError('Name is required and must be a non-empty string', 400);
                }
                if (!req.parsedBody.content || typeof req.parsedBody.content !== 'string') {
                    throw new APIError('Content is required and must be a string', 400);
                }
            }
        }
    },
    '/api/templates/count': {
        GET: getTemplatesTotalCount
    },
    '/api/templates/:id': {
        GET: getTemplateById,
        DELETE: deleteTemplate
    },
    '/api/collages': {
        GET: {
            handler: searchCollagesWithPaging,
            validator: async (req, url) => {
                const page = parseInt(url.searchParams.get('page'));
                const pageSize = parseInt(url.searchParams.get('pageSize'));

                if (page && (isNaN(page) || page < 1)) {
                    throw new APIError('Page must be a positive integer', 400);
                }
                if (pageSize && (isNaN(pageSize) || pageSize < 1 || pageSize > 100)) {
                    throw new APIError('Page size must be between 1 and 100', 400);
                }
            }
        },
        POST: {
            handler: saveCollage,
            validator: async (req, url) => {
                if (!req.parsedBody.name || typeof req.parsedBody.name !== 'string' || req.parsedBody.name.trim().length === 0) {
                    throw new APIError('Name is required and must be a non-empty string', 400);
                }
                if (!req.parsedBody.content || typeof req.parsedBody.content !== 'string') {
                    throw new APIError('Content is required and must be a string', 400);
                }
                if (req.parsedBody.content.length > 2000) {
                    throw new APIError('Content length exceeds maximum limit of 2000 characters', 400);
                }
            }
        }
    },
    '/api/collages/count': {
        GET: getCollagesTotalCount
    },
    '/api/collages/:id': {
        GET: getCollageById,
        DELETE: deleteCollage
    },
    '/qr': {
        POST: {
            handler: saveQR,
            validator: async (req, url) => {
                if (!req.parsedBody.content || typeof req.parsedBody.content !== 'string') {
                    throw new APIError('Content is required and must be a string', 400);
                }
            }
        }
    },
    '/qr/:id': {
        GET: getQRById,
    },
    '/collections': {
        GET: getCollectionsPage
    },
    '/:type/:content': {
        GET: shareImage
    },
    '/:type/:id/...': {
        GET: shareTemplate
    },
    '/': {
        GET: getIndexPage
    }
};

// Methods that can have a body
const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

export async function router(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // Find matching route
    for (const [route, handler] of Object.entries(routes)) {
        let match;
        const params = {};
        if (route.endsWith('/...')) {
            const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '([^/]+)'));
            match = path.match(routePattern);
        } else {
            const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '([^/]+)') + '$');
            match = path.match(routePattern);
        }
        if (match) {
            // Add route parameters to request
            const paramNames = route.match(/:[^/]+/g) || [];
            paramNames.forEach((param, index) => {
                params[param.slice(1)] = match[index + 1];
            });
            if (route.endsWith('/...')) {
                //check if after paramNames, if there still is a /, then we need to add it to the params
                const slashCount = route.split('/').length - 1;
                let remainingPath = path;
                for (let i = 0; i < slashCount; i++) {
                    const slashPos = remainingPath.indexOf('/');
                    if (slashPos != -1) {
                        remainingPath = remainingPath.slice(slashPos + 1);
                    }
                }
                params.params = remainingPath.split('/').map(param => decodeURIComponent(param));
            }
            req.params = params;

            // Only parse body for methods that can have a body
            if (BODY_METHODS.includes(method)) {
                try {
                    req.parsedBody = await req.json();
                } catch (error) {
                    // If body parsing fails, return 400 Bad Request
                    return errorHandler(new APIError('Invalid JSON body', 400));
                }
            }

            if (handler[method] && handler[method].validator) {
                try {
                    await handler[method].validator(req, url);
                } catch (error) {
                    return errorHandler(error);
                }
            }
            if (handler[method] && handler[method].handler) {
                return await handler[method].handler(req, url);
            } else {
                return await handler[method](req, url);
            }
        }
    }

    return null;
} 