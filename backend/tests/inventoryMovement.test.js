const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const InventoryMovement = require('../models/InventoryMovement');

describe('InventoryMovement model', () => {
  test('a valid movement passes validation', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,
      reason: 'Supplier delivery',
    });

    await movement.validate();

    assert.doesNotReject(movement.validate());
    // await assert.rejects(movement.validate(), (error) => {
    //   assert.ok(error.errors.reason);
    //   return true;
    // });
  });

  test('a movement without reason is rejected', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,

    });

    await movement.validate();

    assert.doesNotReject(movement.validate());
    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.reason);
      return true;
    });
  });
});