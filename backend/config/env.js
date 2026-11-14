require('dotenv').config();

const PORT = process.env.PORT || 4001;
const MONGODB_URI = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODB_URI : process.env.MONGODB_URI;

const rawLowStock = process.env.LOW_STOCK_DEFAULT;

let LOW_STOCK_DEFAULT;
if (!rawLowStock) {
  LOW_STOCK_DEFAULT = 10;
} else {
  LOW_STOCK_DEFAULT = Number(rawLowStock);
  if (!Number.isInteger(LOW_STOCK_DEFAULT)|| LOW_STOCK_DEFAULT < 0) {
    throw new Error('LOW_STOCK_DEFAULT must be a whole number of 0 or more');
  }
}

module.exports = {  PORT, MONGODB_URI, LOW_STOCK_DEFAULT };