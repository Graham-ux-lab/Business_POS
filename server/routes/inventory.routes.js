const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// GET inventory movements
router.get('/movements', async (req, res) => {
    try {
        const [movements] = await pool.execute(
            'SELECT im.*, p.name as product_name, u.full_name as created_by_name FROM inventory_movements im JOIN products p ON im.product_id = p.id LEFT JOIN users u ON im.created_by = u.id ORDER BY im.created_at DESC LIMIT 100'
        );
        res.json({ success: true, data: movements });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST adjust inventory
router.post('/adjust', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { product_id, quantity, notes } = req.body;
        
        await pool.execute('UPDATE products SET quantity = ? WHERE id = ?', [quantity, product_id]);
        
        await pool.execute(
            'INSERT INTO inventory_movements (product_id, movement_type, quantity, notes, created_by) VALUES (?, ?, ?, ?, ?)',
            [product_id, 'adjustment', quantity, notes, req.user.id]
        );
        
        res.json({ success: true, message: 'Inventory adjusted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
