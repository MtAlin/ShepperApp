import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
