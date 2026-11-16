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

test('an aborted transaction rolls back its writes', async () => {
  const session = await mongoose.startSession();
  const productsAtStart = await helper.productsInDb();
  const product = productsAtStart[0];
  let count;
  try{

    session.startTransaction();

    const response = await Product.updateOne(
      { _id: product.id },
      { $inc: { stock: 5 } },
      { session },
    );

    count = response.modifiedCount;

    throw new Error('Simulated movement creation failure');
  }catch (error) {
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }

  const productsAfter = await helper.productsInDb();
  assert.strictEqual(productsAfter[0].stock, productsAtStart[0].stock);
  assert.strictEqual(count, 1);
});

test('a committed transaction keeps its writes', async () => {
  const session = await mongoose.startSession();
  const productAtStart = await helper.productsInDb();
  const product = productAtStart[0];
  let count;
  try{
    session.startTransaction();
    const response = await Product.updateOne(
      { _id: product.id },
      { $inc: { stock: 5 } },
      { session },
    );
    count = response.modifiedCount;

    await session.commitTransaction();
  }catch (error) {
    await session.abortTransaction();
  } finally{
    await session.endSession();
  }
  assert.strictEqual(count, 1);
  const productsAfter = await helper.productsInDb();
  assert.strictEqual(productsAfter[0].stock, productAtStart[0].stock + 5);
});

after(async () => {
  await mongoose.connection.close();
});