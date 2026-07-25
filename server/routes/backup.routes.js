const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');
const { writeAuditLog } = require('../utils/audit');

const TABLES = [
    'roles',
    'users',
    'categories',
    'products',
    'suppliers',
    'purchases',
    'purchase_items',
    'sales',
    'sale_items',
    'inventory_movements',
    'business_settings',
    'audit_logs'
];

router.use(authenticateToken);
router.use(authorizeRole('Administrator'));

router.get('/', async (req, res) => {
    try {
        const data = {};
        for (const table of TABLES) {
            const [rows] = await pool.execute(`SELECT * FROM ${table}`);
            data[table] = rows;
        }

        res.json({
            success: true,
            exportedAt: new Date().toISOString(),
            version: 1,
            tables: TABLES,
            data
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ success: false, message: 'Failed to create backup' });
    }
});

router.post('/restore', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const backup = req.body;
        if (!backup?.data) {
            return res.status(400).json({ success: false, message: 'Invalid backup file' });
        }

        await connection.beginTransaction();
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of [...TABLES].reverse()) {
            await connection.query(`TRUNCATE TABLE ${table}`);
        }

        for (const table of TABLES) {
            const rows = backup.data[table] || [];
            for (const row of rows) {
                const columns = Object.keys(row);
                if (columns.length === 0) continue;
                const placeholders = columns.map(() => '?').join(', ');
                const values = columns.map((column) => row[column]);
                await connection.query(
                    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
                    values
                );
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();

        await writeAuditLog(pool, req, {
            action: `Restored backup exported at ${backup.exportedAt || 'unknown time'}`,
            entityType: 'backup',
            entityId: null
        });

        res.json({ success: true, message: 'Backup restored successfully' });
    } catch (error) {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.rollback();
        console.error('Restore error:', error);
        res.status(500).json({ success: false, message: 'Failed to restore backup' });
    } finally {
        connection.release();
    }
});

module.exports = router;
