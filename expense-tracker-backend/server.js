require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./app'); // Import the Express app setup
const colors = require('colors'); // optional, for colorful console logs

// Server Configuration
const PORT = process.env.PORT || 5000;

// Start the Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(colors.green.bold(`✅ Server running on port ${PORT}`));
      console.log(colors.cyan(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`));
    });
  })
  .catch((err) => {
    console.error(colors.red.bold('❌ Database connection failed!'));
    console.error(err);
    process.exit(1); // exit process if DB connection fails
  });
