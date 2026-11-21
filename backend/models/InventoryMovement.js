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
      validate: {
        validator: function (value) {
          if (!Number.isInteger(value) || value === 0) {
            return false;
          }

          if (this.type === 'restock') return value > 0;
          if (this.type === 'damage') return value < 0;

          return true;
        },
        message: 'Quantity does not match movement type',
      }, 
    },
    stockBefore: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Value must be a whole number',
      },
    },
    stockAfter: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          if (!Number.isInteger(value) || value < 0) {
            return false;
          }
          return value === this.stockBefore + this.quantity;
        },
        message: 'stock after must be a non-negative whole number matching stockBefore and  quantity',
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

InventorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('InventoryMovement', InventorySchema);