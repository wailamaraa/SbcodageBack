const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Define routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const fournisseurRoutes = require('./routes/fournisseurs');
const categoryRoutes = require('./routes/categories');
const itemRoutes = require('./routes/items');
const carRoutes = require('./routes/cars');
const reparationRoutes = require('./routes/reparations');
const serviceRoutes = require('./routes/services');
const dashboardRoutes = require('./routes/dashboard');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fournisseurs', fournisseurRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reparations', reparationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('Stock Management API is running...');
});

// Error handling middleware
app.use(errorHandler);

// Set up the port and start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 