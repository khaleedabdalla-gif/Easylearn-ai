const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️  GEMINI_API_KEY is missing from .env — AI features will fail');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-1.5-flash is fast and free-tier friendly — good fit for
// summarization/segmentation tasks that don't need the heaviest model
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

module.exports = model;