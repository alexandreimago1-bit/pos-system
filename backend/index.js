const env = require('./config/env');

const express = require('express');

const app = express();
app.use(express.json());

const connectDB = require('./config/db');


const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const unknownEndpoint = require('./middleware/notFound');
app.use(unknownEndpoint);

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);


const PORT = env.PORT;
connectDB()
  .then(() => {
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('error connecting to MongoDB', error.message);
  });