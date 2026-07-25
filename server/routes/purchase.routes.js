const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const [purchases] = await pool.execute(
            `SELECT
                p.id,
                CONCAT('PO-', LPAD(p.id, 6, '0')) as reference_number,
                p.supplier_id,
                s.name as supplier_name,
                p.purchase_date,
                p.total_amount,
                p.status,
                COUNT(pi.id) as items_count
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
            GROUP BY p.id
            ORDER BY p.purchase_date DESC`
        );

        res.json({ success: true, data: purchases });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', authorizeRole('Administrator'), async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { supplier_id, items } = req.body;

        if (!supplier_id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Supplier and at least one item are required' });
        }

        const normalizedItems = items.map((item) => ({
            product_id: parseInt(item.product_id, 10),
            quantity: parseInt(item.quantity, 10),
            cost_price: parseFloat(item.cost_price)
        }));

        if (normalizedItems.some((item) => !item.product_id || !item.quantity || item.quantity < 1 || Number.isNaN(item.cost_price))) {
            return res.status(400).json({ success: false, message: 'Each purchase item needs a product, quantity, and cost price' });
        }

        const totalAmount = normalizedItems.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);

        await connection.beginTransaction();

        const [purchaseResult] = await connection.execute(
            'INSERT INTO purchases (supplier_id, total_amount, status, created_by) VALUES (?, ?, ?, ?)',
            [supplier_id, totalAmount, 'received', req.user.id]
        );

        const purchaseId = purchaseResult.insertId;

        for (const item of normalizedItems) {
            const lineTotal = item.quantity * item.cost_price;

            await connection.execute(
                'INSERT INTO purchase_items (purchase_id, product_id, quantity, cost_price, total) VALUES (?, ?, ?, ?, ?)',
                [purchaseId, item.product_id, item.quantity, item.cost_price, lineTotal]
            );

            await connection.execute(
                'UPDATE products SET quantity = quantity + ?, cost_price = ? WHERE id = ?',
                [item.quantity, item.cost_price, item.product_id]
            );

            await connection.execute(
                'INSERT INTO inventory_movements (product_id, movement_type, quantity, reference_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                [item.product_id, 'purchase', item.quantity, purchaseId, 'Purchase received', req.user.id]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Purchase recorded successfully',
            data: { id: purchaseId, reference_number: `PO-${String(purchaseId).padStart(6, '0')}`, total_amount: totalAmount }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create purchase error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
});

module.exports = router;
