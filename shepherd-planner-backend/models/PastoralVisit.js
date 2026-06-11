import mongoose from 'mongoose';

const pastoralVisitSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number, // 0-11
    required: true,
  },
  status: {
    type: String,
    enum: ['PLANNED', 'CONFIRMED', 'COMPLETED', 'RESCHEDULE_REQUESTED', 'CANCELLED'],
    default: 'PLANNED',
  },
  notes: {
    type: String,
    default: '',
  },
  rescheduleReason: {
    type: String,
    default: '',
  },
  reminderSentDays: {
    type: [Number], // e.g. [7, 3] — days before visit when reminder was "sent"
    default: [],
  },
  completedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export default mongoose.model('PastoralVisit', pastoralVisitSchema);
