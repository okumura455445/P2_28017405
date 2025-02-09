const sqlite3 = require('sqlite3').verbose();

class ContactosModel {
    constructor() {
        this.db = new sqlite3.Database('./database.db', (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Conectado a la base de datos SQLite.');
        });

        this.db.run(`CREATE TABLE IF NOT EXISTS contactos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT NOT NULL,
                        name TEXT NOT NULL,
                        comment TEXT NOT NULL,
                        ip TEXT NOT NULL,
                        country TEXT NOT NULL,  // Added country field
                        date TEXT NOT NULL
                    )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });

        // Create users table
        this.db.run(`CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE,
                        password_hash TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    save(data) {
        return new Promise((resolve, reject) => {
            const { email, name, comment, ip, country, date } = data; // Include country
            const sql = `INSERT INTO contactos (email, name, comment, ip, country, date) VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [email, name, comment, ip, country, date], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM contactos`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    registerUser(username, passwordHash) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;
            this.db.run(sql, [username, passwordHash], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });
    }

    findUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE username = ?`;
            this.db.get(sql, [username], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Cerrada la conexión a la base de datos.');
        });
    }
}

module.exports = ContactosModel;
