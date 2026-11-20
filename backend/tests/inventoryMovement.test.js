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

    assert.doesNotReject(movement.validate());
  });

  test('a movement without reason is rejected', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.reason);
      return true;
    });
  });

  test('rejecting a restock with a negative quantity', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: -5,
      stockBefore: 10,
      stockAfter: 5,
      reason: 'Supplier Delivery',
    });
    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.quantity);
      return true;
    });


  });

  test('rejecting a movement with zero quantity', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 0,
      stockBefore: 10,
      stockAfter: 10,
      reason: 'Supply Update',
    });
    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.quantity);
      return true;
    });
  });
  test('a damage must be negative', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'damage',
      quantity: -3,
      stockBefore: 10,
      stockAfter: 7,
      reason: 'sale',
    });
    await assert.doesNotReject(movement.validate(), (error) => {
      assert.ok(error.errors.quantity);
      return true;
    });
  });
});