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


describe('when there are initially some products saved', () => {
  beforeEach(async () => {
    await connectDB();
    await Product.deleteMany({});
    await Product.insertMany(helper.initialProducts);
  });

  describe('returning products', () => {
    describe('successful get requests', () => {
      test('all products are returned', async () => {
        const response = await api.get('/api/products')
          .expect(200)
          .expect('Content-Type', /application\/json/);  

        assert.strictEqual(response.body.length, helper.initialProducts.length);
      });
      test('products are identified by id', async () => {
        const response = await api.get('/api/products');

        assert(response.body[0].id);
        assert(!response.body[0]._id);
      });
      test('a specific product can be viewed', async () => {
        const productBefore = await helper.productsInDb();
        const productToView = productBefore[0];

        const resultingProduct = await api
          .get(`/api/products/${productToView.id}`)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        const expected = JSON.parse(JSON.stringify(productToView));
        assert.deepStrictEqual(resultingProduct.body, expected);
      });
    });
    describe('unsuccessful get requests', () => {
      test('fails with statuscode 404 when an ID is non-existent', async () => {
        const validNonExistingID = await helper.nonExistingId();

        await api
          .get(`/api/products/${validNonExistingID}`)
          .expect(404);
      });
      test('fails with statuscode 400 when ID is invalid', async () => {
        const invalidID = '123321456654789987';
        await api
          .get(`/api/products/${invalidID}`)
          .expect(400);
      });
    });
  });

  describe('creating new products', () => {

    describe('when successful', () => {
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

        const productsAtEnd = await helper.productsInDb();

        assert.strictEqual(productsAtEnd.length, helper.initialProducts.length + 1);

        const names = productsAtEnd.map(product => product.name);
        assert(names.includes('TEST-POST-PRODUCT-1'));
  
      });
    });
    describe('when unsuccessful', () => {
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
        assert.strictEqual(response.body.length, helper.initialProducts.length);
      });
    });
  });

  describe('updating an existing product', () => {
    test('successfully updating an existing product price returns 200 OK but ignores stocks', async () => {
      const productsBefore = await helper.productsInDb();
      const productsToEdit = productsBefore[0];
      const updatedProduct = {
        name: productsToEdit.name,
        barcode: productsToEdit.barcode,
        priceInCentavos: productsToEdit.priceInCentavos + 23,
        stock: productsToEdit.stock - 1,
      };

      await api
        .put(`/api/products/${productsToEdit.id}`)
        .send(updatedProduct)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const productsAfter = await helper.productsInDb();
      assert.strictEqual(productsAfter[0].priceInCentavos, productsToEdit.priceInCentavos + 23);
      assert.strictEqual(productsAfter[0].stock, productsToEdit.stock);
    });

    // test('updating a product with a missing ID')
  });
});



after(async () => {
  await mongoose.connection.close();
});