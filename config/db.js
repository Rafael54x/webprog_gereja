const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    connectionLimit: 10
});

module.exports = {
    query: async (sql, params) => {
        try {
            const [results] = await pool.execute(sql, params);
            return [results];
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },
    getConnection: async () => {
        return await pool.getConnection();
    }
};