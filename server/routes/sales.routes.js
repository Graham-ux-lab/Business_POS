const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { writeAuditLog } = require('../utils/audit');

router.use(authenticateToken);

// GET all sales
router.get('/', async (req, res) => {
    try {
        const [sales] = await pool.execute(
            'SELECT s.*, u.full_name as cashier_name, (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count FROM sales s LEFT JOIN users u ON s.cashier_id = u.id ORDER BY s.created_at DESC LIMIT 100'
        );
        res.json({ success: true, data: sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET single sale
router.get('/:id', async (req, res) => {
    try {
        const [sales] = await pool.execute('SELECT s.*, u.full_name as cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.id WHERE s.id = ?', [req.params.id]);
        if (sales.length === 0) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }
        const [items] = await pool.execute('SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?', [req.params.id]);
        res.json({ success: true, data: { ...sales[0], items } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create sale
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { paymentMethod, amountPaid, items, subtotal, tax, discount, total } = req.body;
        const receiptNumber = 'INV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const changeAmount = amountPaid - total;
        
        // Insert sale
        const [saleResult] = await connection.execute(
            'INSERT INTO sales (receipt_number, subtotal, tax_amount, discount_amount, total_amount, payment_method, amount_paid, change_amount, cashier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [receiptNumber, subtotal, tax, discount || 0, total, paymentMethod, amountPaid, changeAmount, req.user.id]
        );
        
        const saleId = saleResult.insertId;
        
        // Insert sale items and update inventory
        for (const item of items) {
            await connection.execute(
                'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)',
                [saleId, item.id, item.quantity, item.selling_price, item.selling_price * item.quantity]
            );
            
            await connection.execute(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.id]
            );
            
            await connection.execute(
                'INSERT INTO inventory_movements (product_id, movement_type, quantity, reference_id, created_by) VALUES (?, ?, ?, ?, ?)',
                [item.id, 'sale', -item.quantity, saleId, req.user.id]
            );
        }
        
        await connection.commit();
        await writeAuditLog(pool, req, {
            action: `Made sale ${receiptNumber} for ${total}`,
            entityType: 'sale',
            entityId: saleId
        });
        
        res.status(201).json({
            success: true,
            data: { id: saleId, receipt_number: receiptNumber, total_amount: total, change_amount: changeAmount }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Sale error:', error);
        res.status(500).json({ success: false, message: 'Failed to process sale' });
    } finally {
        connection.release();
    }
});

module.exports = router;
