const express = require('express');
const router = express.Router();
const { getPendingSites, updateSiteStatus } = require('../controllers/adminController');

// Define Admin Routes
router.get('/pending', getPendingSites);
router.put('/action/:id', updateSiteStatus);

module.exports = router;