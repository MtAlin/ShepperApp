import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    const existing = await User.findOne({ email: 'admin@church.org' });
    if (!existing) {
      await User.create({ name: 'Admin', email: 'admin@church.org', password: 'password123', role: 'ADMIN' });
      console.log('Created admin user');
    } else {
      existing.password = 'password123';
      await existing.save();
      console.log('Updated admin user password');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
seed();
