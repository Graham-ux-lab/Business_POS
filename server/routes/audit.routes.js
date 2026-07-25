const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);
router.use(authorizeRole('Administrator'));

router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
        const [logs] = await pool.execute(
            `SELECT
                a.id,
                a.action,
                a.entity_type,
                a.entity_id,
                a.ip_address,
                a.created_at,
                u.username,
                u.full_name
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?`,
            [limit]
        );

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
