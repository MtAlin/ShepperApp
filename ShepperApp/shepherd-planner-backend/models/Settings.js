import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  churchName: { type: String, default: 'Grace Community Church' },
  website: { type: String, default: 'www.gracecommunity.org' },
  themeColor: { type: String, default: '#5D9CEC' },
  emailNotifications: { type: Boolean, default: true },
  meetingReminders: { type: Boolean, default: true },
  newMemberAlerts: { type: Boolean, default: true },
  roles: {
    type: Map,
    of: Boolean,
    default: {
      Admin: true,
      Pastor: true,
      DepartmentLeader: true,
      Member: true
    }
  }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
