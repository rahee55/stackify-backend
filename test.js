const axios = require('axios');
const fs = require('fs');

// YOUR KEY (Do not share this)
const API_KEY = "sk_B9JAihvFddEGKGurE0deI606AWFdC557"; 

async function testGeneration() {
  console.log("🔑 Testing API Key with image.pollinations.ai...");

  try {
    // 1. We call the specific ENDPOINT (/prompt/...), not the root URL
    const url = "https://image.pollinations.ai/prompt/futuristic%20cyberpunk%20cat";
    
    const response = await axios({
      method: 'GET',
      url: url,
      params: {
        width: 1024,
        height: 1024,
        model: 'flux', // Best quality model
        seed: 42,
        nologo: 'true'
      },
      headers: {
        // This Authorization header is what skips the queue
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'NodeJS-Test-Script'
      },
      responseType: 'stream' // Crucial for downloading images
    });

    // 2. Save the image to verify it worked
    const writer = fs.createWriteStream('test-image.jpg');
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log("✅ SUCCESS! Image saved as 'test-image.jpg'.");
        console.log("   (The 404 on the root URL doesn't matter!)");
        resolve();
      });
      writer.on('error', reject);
    });

  } catch (error) {
    console.error("❌ FAILED:", error.message);
    if (error.response) {
      console.log("Server Response:", error.response.status); // 403 means key is wrong, 404 means URL is wrong
    }
  }
}

testGeneration();