const app = require('../app');
const supertest = require('supertest');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { test, before, after, beforeEach } = require('node:test');
const connectDB = require('../config/db');
const assert = require('node:assert');


const api = supertest(app);

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

before(async () => {
  await connectDB();
  console.log('connected to:', mongoose.connection.name);
  if (mongoose.connection.name !== 'pos_test') {
    throw new Error(`Tests must run on pos_test, got ${mongoose.connection.name}`);
  }
});

beforeEach(async () => {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(initialProducts);
});
// GET PRODUCTS TEST
test('all products are returned', async () => {
  const response = await api.get('/api/products')
    .expect(200)
    .expect('Content-Type', /application\/json/);  

  assert.strictEqual(response.body.length, initialProducts.length);
  
});

// POST TESTS
test('a valid product can be added', async () => {
  const newProduct = {
    name: 'TEST-POST-PRODUCT-1',
    barcode: 'TEST-POST-BARCODE-1',
    priceInCentavos: 1250,
    stock: 13,
  };
  await api
    .post('/api/products')
    .send(newProduct)
    .expect(201)
    .expect('Content-type',/application\/json/);

  const productsInDB = await Product.find({});
  const productsAtEnd = productsInDB.map(product => product.toJSON());

  assert.strictEqual(productsAtEnd.length, initialProducts.length + 1);

  const names = productsAtEnd.map(product => product.name);
  assert(names.includes('TEST-POST-PRODUCT-1'));
  
});

test('posting a product with the same barcode returns 409', async() => {
  const newProduct = {
    name: 'TEST-POST-PRODUCT-2',
    barcode: 'TEST-BARCODE-1',
    priceInCentavos: 1550,
    stock: 18,
  };

  await api
    .post('/api/products')
    .send(newProduct)
    .expect(409);
  
  const response = await api.get('/api/products');
  assert.strictEqual(response.body.length, initialProducts.length);
});

after(async () => {
  await mongoose.connection.close();
});