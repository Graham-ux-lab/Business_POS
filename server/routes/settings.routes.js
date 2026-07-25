const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET settings
router.get('/', async (req, res) => {
    try {
        const [settings] = await pool.execute('SELECT * FROM business_settings');
        const settingsObj = {};
        settings.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
        res.json({ success: true, data: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT update settings
router.put('/', authorizeRole('Administrator'), async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            await pool.execute(
                'INSERT INTO business_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        }
        res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
