const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    }, 
    type: {
      type: String,
      enum: ['restock','damage','adjustment'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      // trim: true,
    },
  },
);

InventorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Inventory', InventorySchema);