const app = require('../app');
const supertest = require('supertest');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { test, before, after, beforeEach, describe } = require('node:test');
const connectDB = require('../config/db');
const assert = require('node:assert');
const helper = require('./test_helper');


const api = supertest(app);


before(async () => {
  await connectDB();
  if (mongoose.connection.name !== 'pos_test') {
    throw new Error(`Tests must run on pos_test, got ${mongoose.connection.name}`);
  }
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany(helper.initialProducts);
});

test('should roll back database changes when a transaction is aborted', async () => {
  const session = await mongoose.startSession();
  const productsAtStart = await helper.productsInDb();
  const product = productsAtStart[0];
  try{

    session.startTransaction();

    await Product.updateOne(
      { _id: product.id },
      { $inc: { stock: 5 } },
    );

    throw new Error('Simulated movement creation failure');
  }catch (error) {
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }

  const productsAfter = await helper.productsInDb();
  assert.strictEqual(productsAfter[0].stock, productsAtStart[0].stock);
});

after(async () => {
  await mongoose.connection.close();
});