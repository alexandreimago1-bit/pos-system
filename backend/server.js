const env = require('./config/env');

const app = require('./app');

const connectDB = require('./config/db');

const PORT = env.PORT;
connectDB()
  .then(() => {
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('error connecting to MongoDB', error.message);
  });