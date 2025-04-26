const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database
const db = new sqlite3.Database(path.join(process.cwd(), 'collages.db'));

// Create tables if they don't exist
db.serialize(() => {
    // Drop existing table if it exists
    // db.run('DROP TABLE IF EXISTS collages');
    
    // Create new table with unique name constraint
    db.run(`
        CREATE TABLE IF NOT EXISTS collages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS qr (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

const dbOperations = {
    saveCollage: (name, width, height, content) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO collages (name, width, height, content) VALUES (?, ?, ?, ?)',
                [name, width, height, content],
                function(err) {
                    if (err) reject(err);
                    else resolve({ lastInsertRowid: this.lastID });
                }
            );
        });
    },

    getAllCollages: (page = 1, pageSize = 12, search = '') => {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * pageSize;
            let query = `
                SELECT id, name, width, height, content, created_at 
                FROM collages
            `;
            let params = [];
            let searchTerm = '';

            if (search) {
                searchTerm = `%${search}%`;
                query += `
                    WHERE name LIKE ? 
                    OR width LIKE ? 
                    OR height LIKE ? 
                    OR content LIKE ?
                `;
                params = [searchTerm, searchTerm, searchTerm, searchTerm];
            }

            query += `
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            params.push(pageSize, offset);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM collages';
            if (search) {
                countQuery += `
                    WHERE name LIKE ? 
                    OR width LIKE ? 
                    OR height LIKE ? 
                    OR content LIKE ?
                `;
            }

            db.get(countQuery, search ? [searchTerm, searchTerm, searchTerm, searchTerm] : [], (err, countResult) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({
                        collages: rows,
                        total: countResult.total,
                        page,
                        pageSize,
                        totalPages: Math.ceil(countResult.total / pageSize)
                    });
                });
            });
        });
    },

    getTotalCount: (search = '') => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as total FROM collages';
            let params = [];
            let searchTerm = '';

            if (search) {
                searchTerm = `%${search}%`;
                query += `
                    WHERE name LIKE ? 
                    OR width LIKE ? 
                    OR height LIKE ? 
                    OR content LIKE ?
                `;
                params = [searchTerm, searchTerm, searchTerm, searchTerm];
            }

            db.get(query, params, (err, result) => {
                if (err) reject(err);
                else resolve(result.total);
            });
        });
    },

    getCollageById: (id) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id, name, width, height, content, created_at FROM collages WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    deleteCollage: (id) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM collages WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve({ success: true });
                }
            );
        });
    },

    saveQR: (id, content) => {
        return new Promise((resolve, reject) => {
            // First try to find existing QR with the same content
            db.get('SELECT id FROM qr WHERE content = ?', [content], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // If content exists, update its updated_at timestamp
                    db.run(
                        'UPDATE qr SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [row.id],
                        function(err) {
                            if (err) reject(err);
                            else resolve({ id: row.id });
                        }
                    );
                } else {
                    // If content doesn't exist, insert new record
                    db.run(
                        'INSERT INTO qr (id, content) VALUES (?, ?)',
                        [id, content],
                        function(err) {
                            if (err) reject(err);
                            else resolve({ id });
                        }
                    );
                }
            });
        });
    },

    getQRById: (id) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT content FROM qr WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
};

module.exports = { dbOperations }; 