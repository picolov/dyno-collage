const path = require('path');
const { getSSLConfig } = require('./utility/ssl');
const { router } = require('./middleware/router');
const { errorHandler } = require('./middleware/errorHandler');

function main() {
    const tls = getSSLConfig();
    
    // Create the server
    const server = Bun.serve({
        port: process.env.PORT || (tls ? 8443 : 8080),
        tls,
        async fetch(req) {
            try {
                // Route request
                const response = await router(req);
                if (response) {
                    return response;
                }

                // Serve static files from public directory
                const publicPath = path.join(process.cwd(), 'public', new URL(req.url).pathname);
                const file = Bun.file(publicPath);
                if (await file.exists() && !(await file).type.includes('directory')) {
                    return new Response(file);
                }

                return new Response('Not Found', { status: 404 });
            } catch (error) {
                return errorHandler(error);
            }
        },
        error(error) {
            return errorHandler(error);
        }
    });

    console.log(`Server running on ${tls ? 'HTTPS' : 'HTTP'} at port ${server.port}`);
    
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        console.log('Received SIGINT signal. Shutting down server...');
        server.stop();
        process.exit(0);
    });
}

main();
