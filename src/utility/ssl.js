const fs = require('fs');

export function getSSLConfig() {
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

        console.log('SSL certificates found and validated');
        return tls;
    } catch (error) {
        console.error('SSL configuration error:', error.message);
        return null;
    }
}