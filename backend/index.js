const env = require('./config/env');


const express = require('express');


const app = express();
app.use(express.json());



const connectDB = require('./config/db');
const productController = require('./controllers/productController');

app.get('/api/products', productController.getAllController);

app.get('/api/products/:id', productController.getByIdController);

app.put('/api/products/:id', productController.putController);

app.delete('/api/products/:id', productController.deleteController);

app.post('/api/products', productController.postController);

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