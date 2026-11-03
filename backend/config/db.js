const mongoose = require('mongoose');
const env = require('./env');

const connectDB = () => {
  return mongoose.connect(env.MONGODB_URI);
};

module.exports = connectDB;
