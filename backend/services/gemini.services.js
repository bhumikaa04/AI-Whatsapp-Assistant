const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("ERROR: Missing Gemini API key in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-1.5-flash-001",
});

async function generateGeminiResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "AI Error: Unable to generate response.";
  }
}
module.exports = { generateGeminiResponse };
