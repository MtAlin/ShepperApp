import express from 'express';
import Event from '../models/Event.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all events
// @route   GET /api/events
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({})
      .populate('attendees', 'name')
      .sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Admin
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { title, description, date, category, location } = req.body;
    const event = await Event.create({ title, description, date, category, location });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('attendees', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    RSVP to event (join)
// @route   POST /api/events/:id/rsvp
// @access  Private
router.post('/:id/rsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user._id.toString();
    const alreadyJoined = event.attendees.map(a => a.toString()).includes(userId);

    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'Already joined this event' });
    }

    event.attendees.push(req.user._id);
    await event.save();
    await event.populate('attendees', 'name');
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Leave event (cancel RSVP)
// @route   DELETE /api/events/:id/rsvp
// @access  Private
router.delete('/:id/rsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.attendees = event.attendees.filter(a => a.toString() !== req.user._id.toString());
    await event.save();
    await event.populate('attendees', 'name');
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
