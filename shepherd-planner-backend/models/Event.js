import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    enum: ['SERVICE', 'SMALL_GROUP', 'PASTORAL_MEETING', 'REHEARSAL'],
    default: 'SERVICE',
  },
  location: {
    type: String,
    default: '',
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
