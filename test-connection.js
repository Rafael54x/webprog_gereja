const db = require('./config/db');

async function testConnection() {
    try {
        const [result] = await db.query('SELECT 1 as test');
        console.log('✅ Database connected successfully!');
        console.log('Test result:', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();