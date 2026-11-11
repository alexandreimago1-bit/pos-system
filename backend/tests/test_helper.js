const Product = require('../models/Product');

const initialProducts = [
  {
    name: 'Test Product 1',
    barcode: 'TEST-BARCODE-1',
    priceInCentavos: 1000,
    stock: 10,
  },
  {
    name: 'Test Product 2',
    barcode: 'TEST-BARCODE-2',
    priceInCentavos: 2000,
    stock: 20,
  },
];

const nonExistingId = async () => {
  const product = new Product({
    name: 'willBeDeleted',
    barcode: 'willBeDeleted',
    priceInCentavos: 1000,
    stock: 12,
  });
  await product.save();
  await product.deleteOne();

  return product._id.toString();
};

const productsInDb = async () => {
  const products = await Product.find({});
  return products.map(product => product.toJSON());
};

module.exports = {
  initialProducts,
  nonExistingId,
  productsInDb,
};