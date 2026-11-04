
const express = require('express');
const productRoutes = require('./routes/productRoutes');

const unknownEndpoint = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use('/api/products', productRoutes);
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;