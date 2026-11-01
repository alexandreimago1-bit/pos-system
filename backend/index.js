require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');

const Product = require('./models/Product');
const app = express();

const URL = process.env.MONGODB_URI;

app.get('/api/products', (req,res) => {
  Product.find({})
    .then(products => {
      res.json(products);
    })
    .catch(error => {
      console.error('error fetching products', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/api/products/:id', (req,res) => {
  Product
    .findById(req.params.id)
    .then(product => {
      if (product) {
        res.json(product);
      }else {
        res.status(404).end();
      }
    })
    .catch( error => {
      console.error(`error fetching ${req.params.id}`, error.message);
    });
});
const PORT = process.env.PORT || 4001;
mongoose.connect(URL)
  .then(() => {
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('error connecting to MongoDB', error.message);
  });