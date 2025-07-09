
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();




const productRoutes = require('./routes/productRoutes');
const productAdminRoutes = require('./routes/productAdminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const userRoutes = require('./routes/userRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inventoryProductRoutes = require('./routes/inventoryProductRoutes');
const businessRoutes = require('./routes/businessRoutes');


const app = express();
app.use(cors());
app.use(express.json());
// Serve business logos and other uploads statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check or welcome route
app.get('/', (req, res) => {
  res.send('ZeroFlow API is running!');
});


console.log('DEBUG: MONGO_URI from .env is:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('Mongo Error:', err));




app.use('/api/products', productRoutes);
app.use('/api/products', productAdminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory', inventoryProductRoutes);
app.use('/api/business', businessRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
