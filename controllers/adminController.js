const Website = require('../models/Website');

// 1. Get ALL Pending Sites
exports.getPendingSites = async (req, res) => {
  try {
    // Find sites where status is 'pending'
    // Populate 'userId' to show the Author's name/email
    const sites = await Website.find({ status: 'pending' })
      .populate('userId', 'name email') 
      .sort({ createdAt: -1 }); // Newest first

    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 2. Approve or Reject a Site
exports.updateSiteStatus = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  try {
    const site = await Website.findById(id);
    if (!site) return res.status(404).json({ message: "Site not found" });

    if (action === 'approve') {
      site.status = 'approved';
      site.isPublic = true; // Make it live on showcase
    } else if (action === 'reject') {
      site.status = 'rejected';
      site.isPublic = false;
    }

    await site.save();
    res.json({ message: `Site ${action}d successfully`, site });
  } catch (error) {
    res.status(500).json({ message: "Update Failed", error: error.message });
  }
};