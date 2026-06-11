import express from 'express';
import Settings from '../models/Settings.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
