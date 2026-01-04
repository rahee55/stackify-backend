const Website = require('../models/Website');

// @desc    Get all sites for logged-in user
// @route   GET /api/sites
exports.getMySites = async (req, res) => {
  const sites = await Website.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(sites);
};

// @desc    Get public sites (Showcase)
// @route   GET /api/sites/public
exports.getPublicSites = async (req, res) => {
  const sites = await Website.find({ isPublic: true }).sort({ views: -1 });
  res.json(sites);
};

// @desc    Create a new site (Save AI result)
// @route   POST /api/sites
exports.createSite = async (req, res) => {
  const { title, prompt, blocks } = req.body;

  const site = await Website.create({
    userId: req.user.id,
    title,
    prompt,
    content: { blocks },
    isPublic: false
  });
  res.status(201).json(site);
};

exports.getSiteById = async (req, res) => {
  const site = await Website.findById(req.params.id);

  if (site) {
    if (site.isPublic || (req.user && site.userId.toString() === req.user.id)) {
      res.json(site);
    } else {
      res.status(401).json({ message: 'Not authorized to view this site' });
    }
  } else {
    res.status(404).json({ message: 'Site not found' });
  }
};

exports.getUserSites = async (req, res) => {
  try {
    const sites = await Website.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE: Remove a site
exports.deleteSite = async (req, res) => {
  try {
    await Website.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Site deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// PUT: Submit site for Admin Review (Showcase Request)
exports.submitForShowcase = async (req, res) => {
  try {
    const site = await Website.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!site) return res.status(404).json({ message: "Site not found" });
    
    // Change status to 'pending' so it appears in Admin Panel
    site.status = 'pending';
    await site.save();
    
    res.json({ message: "Submitted for review", site });
  } catch (error) {
    res.status(500).json({ message: "Submission failed" });
  }
};

exports.getPublicSites = async (req, res) => {
  try {
    // Only get sites that are Approved AND Public
    const sites = await Website.find({ 
      status: 'approved', 
      isPublic: true 
    })
    .populate('userId', 'name') // Get author name
    .sort({ createdAt: -1 });   // Newest first

    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// POST: Clone a site to the current user's account
exports.cloneSite = async (req, res) => {
  try {
    const originalSite = await Website.findById(req.params.id);
    if (!originalSite) return res.status(404).json({ message: "Site not found" });

    // Create a COPY of the site
    const newSite = new Website({
      userId: req.user._id, // Assign to YOU (the logged-in user)
      title: `${originalSite.title} (Clone)`,
      prompt: originalSite.prompt,
      content: originalSite.content,
      imageCache: originalSite.imageCache, // Re-use the generated images!
      status: 'draft', // Reset status
      isPublic: false  // Private by default
    });

    await newSite.save();
    res.json({ message: "Site cloned successfully", siteId: newSite._id });

  } catch (error) {
    res.status(500).json({ message: "Clone failed", error: error.message });
  }
};