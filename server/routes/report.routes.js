const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

const toNumber = (value) => Number(value || 0);

router.get('/dashboard', async (req, res) => {
    try {
        const range = ['weekly', 'monthly', 'yearly'].includes(req.query.range) ? req.query.range : 'weekly';

        const [[today]] = await pool.execute(
            `SELECT
                COALESCE(SUM(total_amount), 0) as sales,
                COUNT(*) as transactions
            FROM sales
            WHERE status = 'completed' AND DATE(created_at) = CURDATE()`
        );

        const [[yesterday]] = await pool.execute(
            `SELECT COALESCE(SUM(total_amount), 0) as sales
            FROM sales
            WHERE status = 'completed' AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
        );

        const [[month]] = await pool.execute(
            `SELECT COALESCE(SUM(total_amount), 0) as revenue
            FROM sales
            WHERE status = 'completed'
              AND YEAR(created_at) = YEAR(CURDATE())
              AND MONTH(created_at) = MONTH(CURDATE())`
        );

        const [[lastMonth]] = await pool.execute(
            `SELECT COALESCE(SUM(total_amount), 0) as revenue
            FROM sales
            WHERE status = 'completed'
              AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
        );

        const [[products]] = await pool.execute(
            `SELECT
                COUNT(*) as totalProducts,
                SUM(CASE WHEN quantity <= COALESCE(low_stock_threshold, 10) THEN 1 ELSE 0 END) as lowStockItems
            FROM products
            WHERE is_active = true`
        );

        const [[customers]] = await pool.execute(
            `SELECT COUNT(DISTINCT cashier_id) as totalCustomers FROM sales WHERE cashier_id IS NOT NULL`
        );

        const chartSql = {
            weekly: `
                SELECT DATE_FORMAT(day_series.day, '%a') as label, COALESCE(SUM(s.total_amount), 0) as sales
                FROM (
                    SELECT CURDATE() - INTERVAL 6 DAY as day UNION ALL
                    SELECT CURDATE() - INTERVAL 5 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 4 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 3 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 2 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 1 DAY UNION ALL
                    SELECT CURDATE()
                ) day_series
                LEFT JOIN sales s ON DATE(s.created_at) = day_series.day AND s.status = 'completed'
                GROUP BY day_series.day
                ORDER BY day_series.day
            `,
            monthly: `
                SELECT DATE_FORMAT(created_at, '%d %b') as label, COALESCE(SUM(total_amount), 0) as sales
                FROM sales
                WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at), label
                ORDER BY DATE(created_at)
            `,
            yearly: `
                SELECT DATE_FORMAT(created_at, '%b') as label, COALESCE(SUM(total_amount), 0) as sales
                FROM sales
                WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY YEAR(created_at), MONTH(created_at), label
                ORDER BY YEAR(created_at), MONTH(created_at)
            `
        };

        const [salesData] = await pool.execute(chartSql[range]);

        const [topProducts] = await pool.execute(
            `SELECT p.name, SUM(si.quantity) as quantity, SUM(si.total) as value
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'completed'
            GROUP BY p.id, p.name
            ORDER BY quantity DESC
            LIMIT 5`
        );

        const [recentTransactions] = await pool.execute(
            `SELECT
                s.id,
                s.receipt_number as receipt,
                s.total_amount as amount,
                s.payment_method as payment,
                s.status,
                s.created_at,
                u.full_name as cashier
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 5`
        );

        const [lowStockProducts] = await pool.execute(
            `SELECT name, quantity as stock, COALESCE(low_stock_threshold, 10) as threshold
            FROM products
            WHERE is_active = true AND quantity <= COALESCE(low_stock_threshold, 10)
            ORDER BY quantity ASC, name ASC
            LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                stats: {
                    todaySales: toNumber(today.sales),
                    yesterdaySales: toNumber(yesterday.sales),
                    todayTransactions: toNumber(today.transactions),
                    totalProducts: toNumber(products.totalProducts),
                    lowStockItems: toNumber(products.lowStockItems),
                    totalCustomers: toNumber(customers.totalCustomers),
                    monthlyRevenue: toNumber(month.revenue),
                    lastMonthRevenue: toNumber(lastMonth.revenue),
                },
                salesData: salesData.map((row) => ({ date: row.label, sales: toNumber(row.sales) })),
                topProducts: topProducts.map((row) => ({
                    name: row.name,
                    quantity: toNumber(row.quantity),
                    value: toNumber(row.value)
                })),
                recentTransactions: recentTransactions.map((row) => ({
                    id: row.id,
                    receipt: row.receipt,
                    customer: row.cashier || 'Walk-in customer',
                    amount: toNumber(row.amount),
                    payment: row.payment,
                    status: row.status,
                    time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })),
                lowStockProducts: lowStockProducts.map((row) => ({
                    name: row.name,
                    stock: toNumber(row.stock),
                    threshold: toNumber(row.threshold)
                }))
            }
        });
    } catch (error) {
        console.error('Dashboard report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const startDate = req.query.startDate || new Date().toISOString().slice(0, 10);
        const endDate = req.query.endDate || startDate;
        let rows = [];
        let summary = {};

        if (type === 'daily-sales' || type === 'sales') {
            const dateFilter = type === 'daily-sales'
                ? 'DATE(s.created_at) = ?'
                : 'DATE(s.created_at) BETWEEN ? AND ?';
            const params = type === 'daily-sales' ? [startDate] : [startDate, endDate];

            [rows] = await pool.execute(
                `SELECT
                    s.receipt_number,
                    s.created_at,
                    u.full_name as cashier,
                    s.payment_method,
                    s.subtotal,
                    s.tax_amount,
                    s.discount_amount,
                    s.total_amount,
                    s.amount_paid,
                    s.change_amount,
                    s.status
                FROM sales s
                LEFT JOIN users u ON s.cashier_id = u.id
                WHERE ${dateFilter}
                ORDER BY s.created_at DESC`,
                params
            );

            const [[totals]] = await pool.execute(
                `SELECT
                    COUNT(*) as transactions,
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COALESCE(SUM(tax_amount), 0) as total_tax,
                    COALESCE(SUM(discount_amount), 0) as total_discount
                FROM sales s
                WHERE ${dateFilter} AND s.status = 'completed'`,
                params
            );
            summary = {
                transactions: toNumber(totals.transactions),
                totalSales: toNumber(totals.total_sales),
                totalTax: toNumber(totals.total_tax),
                totalDiscount: toNumber(totals.total_discount)
            };
        } else if (type === 'inventory') {
            [rows] = await pool.execute(
                `SELECT
                    p.name,
                    p.sku,
                    p.barcode,
                    c.name as category,
                    p.quantity,
                    p.low_stock_threshold,
                    p.cost_price,
                    p.selling_price,
                    (p.quantity * p.cost_price) as stock_cost_value,
                    (p.quantity * p.selling_price) as stock_retail_value
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = true
                ORDER BY p.name`
            );

            summary = rows.reduce((acc, row) => ({
                products: acc.products + 1,
                units: acc.units + toNumber(row.quantity),
                costValue: acc.costValue + toNumber(row.stock_cost_value),
                retailValue: acc.retailValue + toNumber(row.stock_retail_value)
            }), { products: 0, units: 0, costValue: 0, retailValue: 0 });
        } else if (type === 'low-stock') {
            [rows] = await pool.execute(
                `SELECT
                    p.name,
                    p.sku,
                    c.name as category,
                    p.quantity,
                    COALESCE(p.low_stock_threshold, 10) as threshold,
                    p.selling_price
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = true AND p.quantity <= COALESCE(p.low_stock_threshold, 10)
                ORDER BY p.quantity ASC, p.name ASC`
            );
            summary = { products: rows.length };
        } else if (type === 'profit') {
            [rows] = await pool.execute(
                `SELECT
                    p.name,
                    p.sku,
                    SUM(si.quantity) as quantity_sold,
                    SUM(si.total) as revenue,
                    SUM(si.quantity * p.cost_price) as cost,
                    SUM(si.total - (si.quantity * p.cost_price)) as profit
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completed' AND DATE(s.created_at) BETWEEN ? AND ?
                GROUP BY p.id, p.name, p.sku
                ORDER BY profit DESC`,
                [startDate, endDate]
            );

            summary = rows.reduce((acc, row) => ({
                revenue: acc.revenue + toNumber(row.revenue),
                cost: acc.cost + toNumber(row.cost),
                profit: acc.profit + toNumber(row.profit)
            }), { revenue: 0, cost: 0, profit: 0 });
        } else if (type === 'best-sellers') {
            [rows] = await pool.execute(
                `SELECT
                    p.name,
                    p.sku,
                    c.name as category,
                    SUM(si.quantity) as quantity_sold,
                    SUM(si.total) as revenue
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completed' AND DATE(s.created_at) BETWEEN ? AND ?
                GROUP BY p.id, p.name, p.sku, c.name
                ORDER BY quantity_sold DESC, revenue DESC
                LIMIT 50`,
                [startDate, endDate]
            );

            summary = rows.reduce((acc, row) => ({
                products: acc.products + 1,
                quantitySold: acc.quantitySold + toNumber(row.quantity_sold),
                revenue: acc.revenue + toNumber(row.revenue)
            }), { products: 0, quantitySold: 0, revenue: 0 });
        } else {
            return res.status(404).json({ success: false, message: 'Unknown report type' });
        }

        res.json({
            success: true,
            data: {
                type,
                startDate,
                endDate,
                summary,
                rows
            }
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    res.json({ success: true, message: 'Reports API ready' });
});

module.exports = router;
