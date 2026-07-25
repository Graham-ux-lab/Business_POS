const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET all categories
router.get('/', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true WHERE c.is_active = true GROUP BY c.id ORDER BY c.name'
        );
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET single category
router.get('/:id', async (req, res) => {
    try {
        const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (categories.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, data: categories[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create category
router.post('/', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name, description } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT update category
router.put('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.execute(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE category
router.delete('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        await pool.execute('UPDATE categories SET is_active = false WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
