require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');

const app = express();

const URL = process.env.MONGODB_URI;

const PORT = process.env.PORT || 4001;
mongoose.connect(URL)
  .then(() => {
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('error connecting to MongoDB', error.message);
  });