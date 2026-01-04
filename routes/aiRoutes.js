const express = require('express');
const router = express.Router();
const { generateSiteContent, proxyImage } = require('../controllers/aiController');

// Route to generate the website JSON
router.post('/generate', generateSiteContent);

// NEW: Route to securely fetch images using your Key
router.get('/image', proxyImage);

module.exports = router;