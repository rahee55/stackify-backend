const mongoose = require('mongoose');

const WebsiteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { type: String, required: true },
  prompt: { type: String, required: true },

  // --- UPDATED CONTENT STRUCTURE ---
  // This supports the Split-Screen Preview (Left: List, Right: Preview)
  content: { 
    title: String, 
    blocks: [
      {
        id: String,   // e.g., "nav", "hero"
        name: String, // e.g., "Navigation Bar"
        code: String  // The actual HTML for that section
      }
    ]
  }, 

  // --- SHOWCASE & ADMIN FIELDS ---
  isPublic: { type: Boolean, default: false }, // true = shown on showcase page
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'rejected'], 
    default: 'draft' 
  }, // 'pending' = waiting for Admin approval
  
  subdomain: { type: String, unique: true, sparse: true },
  views: { type: Number, default: 0 },

  imageCache: { 
    type: Map, 
    of: String, 
    default: {} 
  }
}, { timestamps: true });

module.exports = mongoose.model('Website', WebsiteSchema);