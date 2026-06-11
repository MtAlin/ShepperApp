import express from 'express';
import Announcement from '../models/Announcement.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('author', 'name')
      .sort({ pinned: -1, createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      pinned: pinned || false,
      author: req.user._id,
    });
    const populated = await announcement.populate('author', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name');
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
