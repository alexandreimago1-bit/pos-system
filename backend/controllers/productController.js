const Product = require('../models/Product');

const getAllController = async (req,res) => {
  const products = await Product.find({});
  res.json(products);
};

const getByIdController = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404).end();
  }
};

const putController = async (req,res) => {

  if (!req.body) {
    return res.status(400).end();
  }
  const { name, barcode, priceInCentavos } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).end();
  }
  product.name = name;
  product.barcode = barcode;
  product.priceInCentavos = priceInCentavos;

  const savedProduct = await product.save();
  return res.json(savedProduct);
};

const deleteController = async (req,res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).end();
  }

  product.isActive = false;

  await product.save();
  return res.status(204).end();
};

const postController = async (req,res) => {
  const body = req.body;
  if (!body) {
    return res.status(400).end();
  }
  const product = new Product({
    name: body.name,
    barcode: body.barcode, 
    priceInCentavos: body.priceInCentavos,
    stock: body.stock,
  });

  const savedProduct = await product.save();
  res.status(201).json(savedProduct);
};

module.exports = { getAllController, getByIdController, putController,deleteController, postController };