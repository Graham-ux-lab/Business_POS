const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');
const { writeAuditLog } = require('../utils/audit');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
        let params = [];

        if (search) {
            query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
            params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
        }

        if (category) {
            query += ' AND p.category_id = ?';
            params.push(category);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await pool.execute(query, params);
        const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM products WHERE is_active = true');

        res.json({ success: true, data: products, total, page: parseInt(page) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [products] = await pool.execute(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: products[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { name, sku, barcode, category_id, description, cost_price, selling_price, quantity, low_stock_threshold } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO products (name, sku, barcode, category_id, description, cost_price, selling_price, quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name,
                sku,
                barcode || null,
                category_id || null,
                description || null,
                cost_price || 0,
                selling_price || 0,
                quantity || 0,
                low_stock_threshold || 10
            ]
        );

        await writeAuditLog(pool, req, {
            action: `Added product "${name}" at selling price ${selling_price || 0}`,
            entityType: 'product',
            entityId: result.insertId
        });

        res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { name, sku, barcode, category_id, description, cost_price, selling_price } = req.body;
        const [beforeRows] = await pool.execute('SELECT name, selling_price FROM products WHERE id = ?', [req.params.id]);
        
        await pool.execute(
            'UPDATE products SET name=?, sku=?, barcode=?, category_id=?, description=?, cost_price=?, selling_price=? WHERE id=?',
            [name, sku, barcode || null, category_id || null, description || null, cost_price || 0, selling_price || 0, req.params.id]
        );

        const previous = beforeRows[0];
        const priceChanged = previous && Number(previous.selling_price) !== Number(selling_price || 0);
        await writeAuditLog(pool, req, {
            action: priceChanged
                ? `Edited product "${name}" price from ${previous.selling_price} to ${selling_price || 0}`
                : `Edited product "${name}"`,
            entityType: 'product',
            entityId: req.params.id
        });

        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const [products] = await pool.execute('SELECT name FROM products WHERE id = ?', [req.params.id]);
        await pool.execute('UPDATE products SET is_active = false WHERE id = ?', [req.params.id]);
        await writeAuditLog(pool, req, {
            action: `Deleted product "${products[0]?.name || req.params.id}"`,
            entityType: 'product',
            entityId: req.params.id
        });
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
