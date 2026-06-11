import express from 'express';
import PastoralVisit from '../models/PastoralVisit.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ─── GET all visits (admin sees all, member sees own) ────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'ADMIN' ? {} : { family: req.user._id };
    const visits = await PastoralVisit.find(filter)
      .populate('family', 'name email')
      .populate('createdBy', 'name')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET visits for a specific year ──────────────────────────────────────────
router.get('/year/:year', protect, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const filter = { year };
    if (req.user.role !== 'ADMIN') filter.family = req.user._id;

    const visits = await PastoralVisit.find(filter)
      .populate('family', 'name email')
      .populate('createdBy', 'name')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET upcoming reminders (visits in next 7 days) ──────────────────────────
router.get('/reminders', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const visits = await PastoralVisit.find({
      scheduledDate: { $gte: now, $lte: in7Days },
      status: { $in: ['PLANNED', 'CONFIRMED'] },
    })
      .populate('family', 'name email')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST create a visit (admin only) ────────────────────────────────────────
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { family, scheduledDate, notes } = req.body;
    const date = new Date(scheduledDate);
    const visit = await PastoralVisit.create({
      family,
      scheduledDate: date,
      year: date.getFullYear(),
      month: date.getMonth(),
      notes: notes || '',
      createdBy: req.user._id,
    });
    const populated = await visit.populate([
      { path: 'family', select: 'name email' },
      { path: 'createdBy', select: 'name' },
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT update a visit ───────────────────────────────────────────────────────
//  Admin can update anything; member can only request reschedule
router.put('/:id', protect, async (req, res) => {
  try {
    const visit = await PastoralVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

    if (req.user.role === 'ADMIN') {
      // Admin can update all fields
      const { scheduledDate, status, notes } = req.body;
      if (scheduledDate) {
        const date = new Date(scheduledDate);
        visit.scheduledDate = date;
        visit.year = date.getFullYear();
        visit.month = date.getMonth();
      }
      if (status) visit.status = status;
      if (notes !== undefined) visit.notes = notes;
      if (status === 'COMPLETED') visit.completedAt = new Date();
    } else {
      // Member can only confirm or request reschedule
      const { action, rescheduleReason } = req.body;
      if (String(visit.family) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (action === 'CONFIRM') {
        visit.status = 'CONFIRMED';
      } else if (action === 'REQUEST_RESCHEDULE') {
        visit.status = 'RESCHEDULE_REQUESTED';
        visit.rescheduleReason = rescheduleReason || '';
      }
    }

    await visit.save();
    const populated = await visit.populate([
      { path: 'family', select: 'name email' },
      { path: 'createdBy', select: 'name' },
    ]);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE a visit (admin only) ─────────────────────────────────────────────
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const visit = await PastoralVisit.findByIdAndDelete(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, message: 'Visit removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
