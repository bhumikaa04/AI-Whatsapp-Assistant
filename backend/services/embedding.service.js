// server/services/embedding.service.js
const { pipeline } = require("@xenova/transformers");

let extractor = null;

/**
 * Initializes the feature extraction pipeline lazily to conserve memory.
 */
async function getExtractor() {
  if (!extractor) {
    console.log("⚙️ Loading local embedding model (all-MiniLM-L6-v2)...");
    // Downloads model weights (~25MB) on first start, then caches locally
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Local embedding model ready.");
  }
  return extractor;
}

/**
 * Generates a vector embedding array for a given text string locally.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input for embedding generation");
  }

  try {
    const generate = await getExtractor();
    const output = await generate(text, { pooling: "mean", normalize: true });
    
    // Convert Tensor output to standard JavaScript Array
    return Array.from(output.data);
  } catch (error) {
    console.error("❌ Error generating local embedding vector:", error.message);
    return [];
  }
}

module.exports = { generateEmbedding };