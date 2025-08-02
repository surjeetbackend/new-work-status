
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const allowedOrigins = process.env.FRONTEND_ORIGIN.split(',');

// ✅ Setup CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/work', require('./routes/workRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/supervisor', require('./routes/supervisorRoutes'));
app.use('/api/account', require('./routes/accountRoutes'));
app.use('/api',require('./routes/routeReport'))

app.use('/excel', express.static(path.join(__dirname, 'public', 'excel')));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
