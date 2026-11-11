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

test('all products are returned', async () => {
  const response = await api.get('/api/products')
    .expect(200)
    .expect('Content-Type', /application\/json/);  

  assert.strictEqual(response.body.length, initialProducts.length);
  
});

after(async () => {
  await mongoose.connection.close();
});