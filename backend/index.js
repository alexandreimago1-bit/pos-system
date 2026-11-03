const env = require('./config/env');


const express = require('express');


const Product = require('./models/Product');
const app = express();
app.use(express.json());



const connectDB = require('./config/db');


app.get('/api/products', (req,res, next) => {
  Product.find({})
    .then(products => {
      res.json(products);
    })
    .catch(error => {
      next(error);
    });
});

app.get('/api/products/:id', (req,res, next) => {
  Product
    .findById(req.params.id)
    .then(product => {
      if (product) {
        res.json(product);
      }else {
        res.status(404).json({ error: 'product not found' });
      }
    })
    .catch( error => {
      next(error);
    });
});

app.put('/api/products/:id', (req, res, next) => {
  const { name, barcode, priceInCentavos } = req.body;

  Product.findById(req.params.id)
    .then(product => {
      if (!product) {
        return res.status(404).json({ error: 'product not found' });
      }

      product.name = name;
      product.barcode = barcode;
      product.priceInCentavos = priceInCentavos;

      return product.save().then(updatedProduct => {
        res.json(updatedProduct);
      });
    })
    .catch(error => next(error));
});

app.delete('/api/products/:id',(req, res, next) => {
  Product.findById(req.params.id)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ error: 'product not found' });
      } 

      product.isActive = false;
      
      return product.save().then(() => {
        res.status(204).end();
      });
    })
    .catch(error => next(error));
});

app.post('/api/products', (req,res, next) => {
  const body = req.body;

  const product = new Product({
    name: body.name,
    barcode: body.barcode, 
    priceInCentavos: body.priceInCentavos,
    stock: body.stock,
  });

  product
    .save()
    .then(savedProduct => {
      res.status(201).json(savedProduct);
    })
    .catch(error => {
      next(error);
    });
});

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