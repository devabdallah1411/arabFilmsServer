const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { configureCloudinary } = require('./utils/cloudinary');

const PORT = process.env.PORT || 5000;

connectDB();
try {
  configureCloudinary();
  console.log('✅ Cloudinary configured');
} catch (err) {
  console.error('❌ Cloudinary config error:', err.message);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
