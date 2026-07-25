const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET all users
router.get('/', authorizeRole('Administrator'), async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
        );
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET single user
router.get('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [req.params.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create user
router.post('/', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { username, email, password, full_name, role_id } = req.body;

        // Validate required fields
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: username, email, password, full_name' 
            });
        }

        // Check if username exists
        const [existingUser] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, role_id || 2]
        );

        // Get the created user
        const [users] = await pool.execute(
            'SELECT u.id, u.username, u.email, u.full_name, u.is_active, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            data: users[0]
        });

    } catch (error) {
        console.error('Create user error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create user. Please try again.' 
        });
    }
});

// PUT update user
router.put('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { username, email, full_name, role_id, is_active } = req.body;
        
        await pool.execute(
            'UPDATE users SET username=?, email=?, full_name=?, role_id=?, is_active=? WHERE id=?',
            [username, email, full_name, role_id, is_active, req.params.id]
        );

        res.json({ success: true, message: 'User updated' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT reset password
router.put('/:id/reset-password', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.params.id]
        );

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE user
router.delete('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        // Don't allow deleting yourself
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot delete your own account' 
            });
        }

        await pool.execute(
            'UPDATE users SET is_active = false WHERE id = ?',
            [req.params.id]
        );

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
