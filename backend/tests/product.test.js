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
    test('updates price with the same barcode returns 200 and ignores stock', async () => {
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

    test('updating a product with a non-existing ID returns a 404', async () => {
      const validNonExistingID = await helper.nonExistingId();
      const updatedProduct = {
        name: 'Test Product 3',
        barcode: 'TEST-BARCODE-3',
        priceInCentavos: 1560,
        stock: 20,
      };
      await api 
        .put(`/api/products/${validNonExistingID}`)
        .send(updatedProduct)
        .expect(404);
      const productsAfter = await helper.productsInDb();
      assert.strictEqual(productsAfter.length, helper.initialProducts.length);
    });

    test('passing the same barcode, to update a product returns a 409', async () => {
      const productsBefore = await helper.productsInDb();
      const productToUpdate = productsBefore.find(p => p.barcode === 'TEST-BARCODE-1');
      const otherProduct = productsBefore.find(p => p.barcode === 'TEST-BARCODE-2');
      const updatedProduct = {
        name: productToUpdate.name,
        barcode: otherProduct.barcode,
        priceInCentavos: 2400,
        stock: 23,
      };
      await api
        .put(`/api/products/${productToUpdate.id}`)
        .send(updatedProduct)
        .expect(409);
      const productsAtEnd = await helper.productsInDb();
      assert.strictEqual(productsAtEnd.length, productsBefore.length);
      const productAfter = await Product.findById(productToUpdate.id);
      assert.strictEqual(productAfter.barcode, productToUpdate.barcode);
    });
  });

  describe('delete tests archives the product by switching isActive to false', () => {


    test('a delete requests returning a 204 switches that products isActive property to false', async () => {
      const productsBefore = await helper.productsInDb();
      const productToArchive = productsBefore.find(p => p.barcode === 'TEST-BARCODE-1');

      await api 
        .delete(`/api/products/${productToArchive.id}`)
        .expect(204);

      const productsAfter = await helper.productsInDb();
      const productAfter = await Product.findById(productToArchive.id);
      const ids = productsAfter.map(p => p.id);

      assert(ids.includes(productToArchive.id));
      assert.strictEqual(productsBefore.length,productsAfter.length);
      assert.strictEqual(productAfter.isActive, false);
      assert.strictEqual(productAfter.name, productToArchive.name);
      assert.strictEqual(productAfter.barcode, productToArchive.barcode);
      assert.strictEqual(productAfter.priceInCentavos, productToArchive.priceInCentavos);
      assert.strictEqual(productAfter.stock, productToArchive.stock);
    });

    test('checking for indempotency that returns 204' ,async () => {
      const productsBefore = await helper.productsInDb();
      const productsToDelete = productsBefore.find(p => p.barcode === 'TEST-BARCODE-1');

      await api.delete(`/api/products/${productsToDelete.id}`).expect(204);

      await api.delete(`/api/products/${productsToDelete.id}`).expect(204);

      const productsAfter = await helper.productsInDb();
      const productAfter = await Product.findById(productsToDelete.id);

      assert.strictEqual(productAfter.isActive, false);
      assert.strictEqual(productsBefore.length, productsAfter.length);
    });

    test('deleting a non-existing id returns a 404', async () => {
      const validNonExistingId = await helper.nonExistingId();

      await api
        .delete(`/api/products/${validNonExistingId}`)
        .expect(404);
      
      const productsAfter = await helper.productsInDb();
      assert.strictEqual(productsAfter.length, helper.initialProducts.length);
    });

    test('deleting a malformed Id returns 400', async () => {
      const invalidID = '123454565676';

      await api
        .delete(`/api/products/${invalidID}`)
        .expect(400);

      const productsAfter = await helper.productsInDb();
      assert.strictEqual(productsAfter.length, helper.initialProducts.length);
    });
  });
});



after(async () => {
  await mongoose.connection.close();
});