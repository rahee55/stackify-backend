const express = require('express');
const router = express.Router();
const { 
  createSite, getSiteById, getUserSites, deleteSite, submitForShowcase, 
  getPublicSites, cloneSite
} = require('../controllers/siteController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public', getPublicSites); 

router.get('/', protect, getUserSites);
router.post('/', protect, createSite);
router.get('/:id', protect, getSiteById);
router.delete('/:id', protect, deleteSite);
router.put('/:id/submit', protect, submitForShowcase);
router.post('/:id/clone', protect, cloneSite); 

module.exports = router;