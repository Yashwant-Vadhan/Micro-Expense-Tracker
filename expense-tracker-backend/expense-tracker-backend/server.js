require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app'); // Import the Express app setup
const colors = require('colors'); // optional, for colorful console logs
const bcrypt = require('bcryptjs');
// console.log("✅ BcryptJS version:", bcrypt.version);

//To test bcrypt

// (async () => {
//   const hash = await bcrypt.hash("123456", 10);
//   const result = await bcrypt.compare("123456", hash);
//   console.log("🔍 Bcrypt test hash:", hash);
//   console.log("✅ Bcrypt test compare result:", result);
// })();

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
