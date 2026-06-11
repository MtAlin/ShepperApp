import express from 'express';
import MeetingRequest from '../models/MeetingRequest.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all meeting requests (admin sees all, member sees own)
// @route   GET /api/meeting-requests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'ADMIN' ? {} : { requester: req.user._id };
    const requests = await MeetingRequest.find(filter)
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a meeting request
// @route   POST /api/meeting-requests
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { topic, preferredDate, notes } = req.body;
    const request = await MeetingRequest.create({
      requester: req.user._id,
      topic,
      preferredDate,
      notes: notes || '',
    });
    const populated = await request.populate('requester', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update meeting request status (admin only)
// @route   PUT /api/meeting-requests/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await MeetingRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('requester', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a meeting request (member cancels own, admin can delete any)
// @route   DELETE /api/meeting-requests/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await MeetingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    // Members can only delete their own requests
    if (req.user.role !== 'ADMIN' && request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await request.deleteOne();
    res.json({ success: true, message: 'Meeting request cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
