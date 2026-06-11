import mongoose from 'mongoose';

const meetingRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  preferredDate: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'DECLINED'],
    default: 'PENDING',
  },
}, { timestamps: true });

export default mongoose.model('MeetingRequest', meetingRequestSchema);
