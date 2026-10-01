const mysql = require('mysql2/promise');

const poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
};

// Add SSL for cloud databases (TiDB, etc)
if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    };
}

const pool = mysql.createPool(poolConfig);

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected to', process.env.DB_HOST + ':' + process.env.DB_PORT);
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('   Host:', process.env.DB_HOST);
        console.error('   Port:', process.env.DB_PORT);
        console.error('   User:', process.env.DB_USER);
        console.error('   Database:', process.env.DB_NAME);
    }
};

testConnection();

module.exports = pool;
