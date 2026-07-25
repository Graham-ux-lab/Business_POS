const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

router.post('/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, password, rememberMe } = req.body;
        
        const [users] = await pool.execute(
            'SELECT u.*, r.name as role_name, r.permissions FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ? AND u.is_active = true',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role_name, permissions: JSON.parse(user.permissions || '{}') },
            JWT_SECRET,
            { expiresIn: rememberMe ? '30d' : '8h' }
        );

        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                role: user.role_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT u.id, u.username, u.full_name, u.email, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = true',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                role: user.role_name
            }
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
