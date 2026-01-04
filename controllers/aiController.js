// server/controllers/aiController.js
const model = require('../config/aiConfig');
const axios = require('axios');
const Website = require('../models/Website'); 

// --- 1. UTILITY: REQUEST QUEUE & IMAGE GENERATION ---

// Simple queue to prevent rate limiting issues
let requestQueue = Promise.resolve();
const queueRequest = (fn) => {
  requestQueue = requestQueue.then(() => fn().catch(() => {}));
  return requestQueue;
};

// Helper to clean search terms (e.g., "hero image of a cat" -> "cat")
const cleanSearchTerm = (prompt) => {
  const stopWords = ["website", "hero", "background", "image", "photo", "picture", "high quality", "4k", "landing page", "ui", "view", "section", "vector", "illustration"];
  let cleaned = prompt.toLowerCase();
  stopWords.forEach(word => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });
  // Remove non-alphanumeric chars but keep spaces
  return cleaned.replace(/[^a-z0-9 ]/g, '').trim() || "modern architecture"; 
};

// Generates the image URL (Now using Web Search Proxy)
const getMultiSourceImage = (imagePrompt) => {
  const query = cleanSearchTerm(imagePrompt);

  return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query)}&w=1024&h=600&c=7&rs=1&p=0`;
};

const cleanAndParseJSON = (rawText) => {
  let text = rawText;

  text = text.replace(/```json/g, '').replace(/```/g, '');

  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');

  if (firstOpen !== -1 && lastClose !== -1) {
    text = text.substring(firstOpen, lastClose + 1);
  } else {
    throw new Error("No JSON object found in AI response");
  }

  // 3. Attempt Parse
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("⚠️ Standard JSON parse failed. Attempting repairs...");

    text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ""); 

    // Retry Parse
    return JSON.parse(text);
  }
};

exports.proxyImage = async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).send('Prompt required');

  const fetchImageTask = async () => {
    try {
      // Direct redirect to the search proxy is faster and lighter on your server
      const imageUrl = getMultiSourceImage(prompt);
      res.redirect(imageUrl);
      
    } catch (error) {
      // Fallback if image generation fails
      if (!res.headersSent) res.redirect(`https://placehold.co/1024x600?text=Error`);
    }
  };

  queueRequest(fetchImageTask);
};

// --- 3. MAIN GENERATOR ---
exports.generateSiteContent = async (req, res) => {
  const { prompt, siteId } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt is required" });

  try {
    console.log("⚡ Generating Structure for:", prompt);

    const systemInstruction = `
      You are a Senior Frontend Architect. Create a modern, animated website for: "${prompt}".

      RULES:
      1. ANIMATION: Use 'hover:scale-105', 'hover:-translate-y-1', 'transition-all duration-300' on cards/buttons.
      2. LAYOUT: Every section must use 'py-20' or 'py-24' for vertical spacing.
      3. COLORS: Use 'bg-slate-900 text-white' for Hero/Footer, 'bg-white text-slate-800' for content.

      RETURN JSON ONLY (No Markdown, No Conversational Text):
      {
        "title": "Site Title",
        "blocks": [
          { "id": "nav", "name": "Navigation Bar", "code": "<nav class='...'>...</nav>" },
          { "id": "hero", "name": "Hero Section", "code": "<header class='...'>...</header>" }
        ]
      }
      VISUALS: src="AI_IMAGE:detailed_description"
    `;

    // 1. CALL AI MODEL
    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    let rawText = response.text();

    // 2. SANITIZE & PARSE RESPONSE (UPDATED)
    let siteData;
    try {
       siteData = cleanAndParseJSON(rawText);
    } catch (error) {
       console.error("❌ Final JSON Parse Error:", error.message);
       console.log("❌ Raw Text was:", rawText); // Log this to debug if it fails again
       return res.status(500).json({ 
         message: "AI generated invalid JSON. Please try again.", 
         details: error.message 
       });
    }

    // 3. DATABASE SETUP (FIND OR CREATE)
    let websiteDoc;
    if (siteId) {
      websiteDoc = await Website.findById(siteId);
      if (!websiteDoc) return res.status(404).json({ message: "Site ID not found" });
    } else {
      websiteDoc = new Website({
        userId: req.user ? req.user._id : "65e9f4a1c5d8a123456789ab", // Fallback ID
        title: siteData.title,
        prompt: prompt,
        content: {}, 
        imageCache: {} // Initialize as empty object
      });
    }

    // 4. PROCESS IMAGES (FIXED MAP VS OBJECT LOGIC)
    // We treat imageCache as a standard Object {}
    let imageCache = websiteDoc.imageCache || {}; 
    let cacheUpdated = false;

    if (siteData.blocks) {
      console.log("🔄 Processing images...");
      
      for (let block of siteData.blocks) {
        // Find all src="AI_IMAGE:..." patterns
        const matches = [...block.code.matchAll(/src=["']AI_IMAGE:([^"']+)["']/g)];
        
        for (const match of matches) {
          const placeholder = match[0];     // The full string: src="AI_IMAGE:cat"
          const imagePrompt = match[1];     // The description: cat

          let imageUrl;

          // Check if we already generated this image (using Object syntax)
          if (imageCache[imagePrompt]) {
            imageUrl = imageCache[imagePrompt];
          } else {
            // Generate new URL (USING WEB SEARCH)
            imageUrl = getMultiSourceImage(imagePrompt);
            
            // Save to cache (using Object syntax)
            imageCache[imagePrompt] = imageUrl;
            cacheUpdated = true;
          }

          // Replace the placeholder in the HTML code
          block.code = block.code.replace(placeholder, `src="${imageUrl}"`);
        }
      }
    }

    // 5. SAVE UPDATES
    websiteDoc.content = siteData; 
    
    // If we generated new images, update the cache and tell Mongoose it changed
    if (cacheUpdated) {
      websiteDoc.imageCache = imageCache; 
      websiteDoc.markModified('imageCache'); // CRITICAL for Mongoose Mixed types
    }
    
    // Update title if it's a new generation on an existing site
    if (siteId) {
        websiteDoc.title = siteData.title;
    }

    await websiteDoc.save();

    console.log("✅ Site generated successfully:", websiteDoc._id);
    res.json({ ...siteData, _id: websiteDoc._id });

  } catch (error) {
    console.error("❌ Generation Error:", error.message);
    res.status(500).json({ 
        message: "Generation Failed", 
        error: error.message 
    });
  }
};