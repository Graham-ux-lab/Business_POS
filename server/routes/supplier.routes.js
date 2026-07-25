const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const [suppliers] = await pool.execute('SELECT * FROM suppliers WHERE is_active = true ORDER BY name');
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [suppliers] = await pool.execute('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (suppliers.length === 0) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        res.json({ success: true, data: suppliers[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { name, email, phone, address, contact_person } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO suppliers (name, email, phone, address, contact_person) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, address, contact_person]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { name, email, phone, address, contact_person } = req.body;
        await pool.execute(
            'UPDATE suppliers SET name=?, email=?, phone=?, address=?, contact_person=? WHERE id=?',
            [name, email, phone, address, contact_person, req.params.id]
        );
        res.json({ success: true, message: 'Supplier updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        await pool.execute('UPDATE suppliers SET is_active = false WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Supplier deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
