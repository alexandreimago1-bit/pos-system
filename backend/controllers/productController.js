const Product = require('../models/Product');

const getAllController = (req,res,next) => {
  Product.find({})
    .then(products => {
      res.json(products);
    })
    .catch(error => {
      next(error);
    });
};

const getByIdController = (req, res, next) => {
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
};

const putController = (req,res,next) => {
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
};

const deleteController = (req,res,next) => {
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
};

const postController = (req,res,next) => {
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
};

module.exports = { getAllController, getByIdController, putController,deleteController, postController };