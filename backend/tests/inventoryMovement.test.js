const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const InventoryMovement = require('../models/InventoryMovement');

describe('model registration',  () => {
  test('uses the InventoryMovement model name', async () => {
    assert.strictEqual(InventoryMovement.modelName, 'InventoryMovement');
  });
});

describe('movement fields', () => {
  test('a valid movement passes validation', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,
      reason: 'Supplier delivery',
    });

    await assert.doesNotReject(movement.validate());
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

  test('movement that has a reason with white spaces will automatically trim', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,
      reason: ' Supplier delivery ',
    });

    assert.strictEqual(movement.reason, 'Supplier delivery');
  });

  test('a whitespace-only reason is rejected', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,
      reason: '  ',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.reason);
      return true;
    });
  });

  test('rejecting an empty inventoryMovement', async () => {
    const movement = new InventoryMovement({

    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.product);
      assert.ok(error.errors.type);
      assert.ok(error.errors.quantity);
      assert.ok(error.errors.stockBefore);
      assert.ok(error.errors.stockAfter);
      assert.ok(error.errors.reason);
      return true;
    });
  });
});

describe('movement quantity validation', () => {
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
    await assert.doesNotReject(movement.validate());
  });

  test('a positive adjustment is valid', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'adjustment',
      quantity: 3,
      stockBefore: 10,
      stockAfter: 13,
      reason: 'Physical count found extra stock',
    });

    await assert.doesNotReject(movement.validate());
  });

  test('a valid negative adjustment', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'adjustment',
      quantity: -3,
      stockBefore: 10,
      stockAfter: 7,
      reason: 'Physical count found extra stock',
    });

    await assert.doesNotReject(movement.validate());
  });
});

describe('stock arithmetic validation', () => {
  test('inconsistent positive movement', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 14,
      reason: 'Supplier delivery',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.stockAfter);
      return true;
    });
  });

  test('consistent positive movement', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 5,
      stockBefore: 10,
      stockAfter: 15,
      reason: 'Supplier delivery',
    });

    await assert.doesNotReject(movement.validate());
  });

  test('consistent negative movement', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'damage',
      quantity: -3,
      stockBefore: 10,
      stockAfter: 7,
      reason: 'Damaged goods removed from inventory',
    });

    await assert.doesNotReject(movement.validate());
  });

  test('inconsistent negative movement', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'damage',
      quantity: -3,
      stockBefore: 10,
      stockAfter: 10,
      reason: 'Damaged goods removed from inventory',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.stockAfter);
      return true;
    });
  });
});

describe('stock value validation', () => {
  test('rejecting a negative stockBefore', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'restock',
      quantity: 15,
      stockBefore: -10,
      stockAfter: 5,
      reason: 'Damaged goods removed from inventory',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.stockBefore);
      return true;
    });
  });

  test('rejecting a decimal stockBefore', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'damage',
      quantity: -3,
      stockBefore: 10.5,
      stockAfter: 10,
      reason: 'Damaged goods removed from inventory',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.stockBefore);
      return true;
    });
  });

  test('rejecting a negative stockAfter', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'damage',
      quantity: -3,
      stockBefore: 10,
      stockAfter: -10,
      reason: 'Damaged goods removed from inventory',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.stockAfter);
      return true;
    });
  });

  test('rejecting a decimal stockAfter', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'damage',
      quantity: -3,
      stockBefore: 10,
      stockAfter: 10.111111,
      reason: 'Damaged goods removed from inventory',
    });

    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.stockAfter);
      return true;
    });
  });
});

describe('movement type validation', async () => {
  test('rejecting an invalid movement type', async () => {
    const movement = new InventoryMovement({
      product: new mongoose.Types.ObjectId(),
      type: 'transfer',
      quantity: 3,
      stockBefore: 10,
      stockAfter: 13,
      reason: 'Damaged goods removed from inventory',
    });
    await assert.rejects(movement.validate(), (error) => {
      assert.ok(error.errors.type);
      return true;
    });
  });
});

