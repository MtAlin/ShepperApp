import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user directory (for members to find people to message)
// @route   GET /api/users/directory
// @access  Private (any authenticated user)
router.get('/directory', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('name role');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
router.put('/:id', protect, async (req, res) => {
  try {
    // Check authorization: User can only update their own profile unless they are an ADMIN
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }

    const { name, email, role, password } = req.body;
    
    // Non-admins cannot change roles or emails (usually)
    const updateData = {};
    if (name) updateData.name = name;
    
    if (req.user.role === 'ADMIN') {
      if (email) updateData.email = email;
      if (role) updateData.role = role;
    }

    // Since we hash password in pre-save middleware, we can't use findByIdAndUpdate if password is changed
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Apply updates
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.role) user.role = updateData.role;
    if (password) user.password = password;

    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User removed' });
  } catch (error) {
    console.error('DELETE /users/:id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
