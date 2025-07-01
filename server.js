
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const workRoutes = require('./routes/workRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');


 // ✅ allow all origins

// OR (optional: allow only frontend origin)


const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/work', workRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supervisor', require('./routes/supervisorRoutes'));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const accountRoutes = require('./routes/accountRoutes');
app.use('/api/account', accountRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
