import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import messageRoutes from './routes/messages.js';
import settingsRoutes from './routes/settings.js';
import announcementRoutes from './routes/announcements.js';
import meetingRequestRoutes from './routes/meetingRequests.js';
import meetingRoutes from './routes/meetings.js';
import pastoralVisitRoutes from './routes/pastoralVisits.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection (cached for serverless)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shepherd-planner');
  isConnected = true;
  console.log('Connected to MongoDB');
};
connectDB().catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/meeting-requests', meetingRequestRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/pastoral-visits', pastoralVisitRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start server only when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
