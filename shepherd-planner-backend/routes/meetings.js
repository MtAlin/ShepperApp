import express from 'express';
import Meeting from '../models/Meeting.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all meetings for the current user (organizer or participant)
// @route   GET /api/meetings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user._id },
        { participants: req.user._id }
      ]
    })
    .populate('organizer', 'name email')
    .populate('participants', 'name email')
    .sort({ date: 1 });
    
    res.json({ success: true, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a meeting
// @route   POST /api/meetings
// @access  Private/Admin
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { title, description, date, participants, location } = req.body;
    
    const meeting = await Meeting.create({
      title,
      description,
      organizer: req.user._id,
      participants: participants || [],
      date,
      location: location || ''
    });
    
    const populated = await meeting.populate([
      { path: 'organizer', select: 'name email' },
      { path: 'participants', select: 'name email' }
    ]);
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a meeting
// @route   PUT /api/meetings/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('organizer', 'name email')
      .populate('participants', 'name email');
      
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a meeting
// @route   DELETE /api/meetings/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, message: 'Meeting removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
