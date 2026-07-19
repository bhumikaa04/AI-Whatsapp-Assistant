// server/services/ai.service.js
require("dotenv").config(); 
const axios = require("axios");

const OLLAMA_BASE_URL = "http://localhost:11434";

/**
 * 1. Generates local vector embeddings using nomic-embed-text
 */
exports.getEmbedding = async (text) => {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: "nomic-embed-text",
      prompt: text,
    });
    return response.data.embedding;
  } catch (error) {
    console.error("❌ Ollama Local Embedding Error:", error.message);
    throw error;
  }
};

/**
 * 2. Compares vector spaces via Cosine Similarity
 */
exports.calculateCosineSimilarity = (vectorA, vectorB) => {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * 3. Text Generation Fallback via local Llama3 - NOW UPGRADED WITH MEMORY CONTEXT
 */
exports.generateChatFallback = async (userMessage, contextPrompt) => {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: "llama3",
      // Context prompt serves as the absolute framing canvas instruction sequence
      prompt: `${contextPrompt}\n\nCustomer Message: ${userMessage}\nAssistant Response:`,
      stream: false,
    });
    return response.data.response.trim();
  } catch (error) {
    console.error("❌ Ollama Fallback Error:", error.message);
    return "Something went wrong on our end. A team member will respond shortly.";
  }
};

/**
 * 4. High-Performance Intent & Lead Scoring Classifier (Llama3)
 */
exports.analyzeLeadIntent = async (formattedHistoryString) => {
  try {
    const systemInstruction = `Analyze the conversation history. Respond ONLY with a valid JSON object matching this schema. Do not use markdown blocks.
{
  "intent": "Choose only one: New Lead, Interested, Product Inquiry, Support Request, Complaint, Converted, Cold Lead, Spam",
  "leadScore": (Number between 0 and 100 based on buyer readiness)
}`;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: "llama3",
      prompt: `${systemInstruction}\n\nConversation:\n${formattedHistoryString}`,
      stream: false,
    });

    const rawText = response.data.response.trim();
    const cleanJSON = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJSON);
  } catch (error) {
    console.error("❌ Ollama Intent Detection Error:", error.message);
    return null;
  }
};