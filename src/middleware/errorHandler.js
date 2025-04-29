export class APIError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

export function errorHandler(error, message) {
    console.error('API Error:', error, message);
    if (message) {
        error.message = message;
    }
    const response = {
        error: error.message || 'Internal Server Error',
        statusCode: error.statusCode || 500,
        timestamp: error.timestamp || new Date().toISOString()
    };
    
    if (error.details) {
        response.details = error.details;
    }
    
    return new Response(JSON.stringify(response), {
        status: response.statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
} 