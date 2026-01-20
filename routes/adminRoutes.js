const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const adminAuth = require('../middleware/adminAuth');

// 1. Get Pending Sites (For Approval Queue)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const sites = await Website.find({ status: 'pending' }).populate('userId', 'name email');
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Approve or Reject Site
router.put('/action/:id', adminAuth, async (req, res) => {
  const { action } = req.body; 
  const status = action === 'approve' ? 'approved' : 'rejected';
  
  try {
    const site = await Website.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get All Approved Sites (For Showcase Management)
router.get('/showcase', adminAuth, async (req, res) => {
  try {
    const sites = await Website.find({ status: 'approved' }).populate('userId', 'name email');
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete a Site (Admin Management)
router.delete('/site/:id', adminAuth, async (req, res) => {
  try {
    await Website.findByIdAndDelete(req.params.id);
    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;