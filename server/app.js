const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/backup', require('./routes/backup.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/purchases', require('./routes/purchase.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/suppliers', require('./routes/supplier.routes'));
app.use('/api/users', require('./routes/user.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});

module.exports = app;
