// server/services/embedding.service.js
const axios = require("axios");

/**
 * Generates a vector embedding array for a given text string.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input for embedding generation");
  }

  try {
    // Target your local Ollama instance or your chosen provider
    // Using 'nomic-embed-text' or 'all-minilm' as standard light examples
    const response = await axios.post("http://localhost:11434/api/embeddings", {
      model: "nomic-embed-text", 
      prompt: text
    });

    return response.data.embedding; // Expects an array of floats
  } catch (error) {
    console.error("Error generating embedding vector:", error.message);
    // Return empty array fallback or throw depending on how strict you want your app to be
    return [];
  }
}

module.exports = {
  generateEmbedding
};