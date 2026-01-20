const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",         
    process.env.CLIENT_URL || "*"        
  ],
  credentials: true
}));
app.use(express.json()); 

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/sites', require('./routes/siteRoutes'));
app.use('/api/admin', adminRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Stackify API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});