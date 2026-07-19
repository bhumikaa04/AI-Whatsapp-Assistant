// server/services/retrieval.service.js
const FAQ = require("../models/FAQ");
const AIKnowledge = require("../models/AIKnowledge");
const { normalize } = require("../utils/normalize");
const { generateEmbedding } = require("./embedding.service");
const { cosineSimilarity } = require("../utils/cosineSimilarity");

// Set minimum similarity match threshold for semantic routing (85%)
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Orchestrates Phase 2 of the pipeline tiering strategy:
 * Exact String Match -> FAQ Vector Match -> AIKnowledge Vector Match
 * * @param {string} expertSystemID 
 * @param {string} rawCustomerMessage 
 * @returns {Promise<{ found: boolean, answer: string|null, source: string|null }>}
 */
async function retrieveAnswerPipeline(expertSystemID, rawCustomerMessage) {
  const normalizedQuery = normalize(rawCustomerMessage);
  
  if (!normalizedQuery) {
    return { found: false, answer: null, source: null };
  }

  // Tier 1: Exact Normalized Text Match on baseline FAQs
  const exactFAQMatch = await FAQ.findOne({
    expertSystemID,
    normalizedQuestion: normalizedQuery
  }).lean();

  if (exactFAQMatch) {
    return {
      found: true,
      answer: exactFAQMatch.answer,
      source: "exact_faq_match"
    };
  }

  // Tier 1b: Exact Normalized Text Match on AIKnowledge database records
  const exactKnowledgeMatch = await AIKnowledge.findOne({
    expertSystemID,
    normalizedQuestion: normalizedQuery
  }).lean();

  if (exactKnowledgeMatch) {
    return {
      found: true,
      answer: exactKnowledgeMatch.answer,
      source: "exact_aiknowledge_match"
    };
  }

  // If exact strings fail, we elevate to Semantic Vector Searches
  // Step A: Vectorize the user query string
  const queryVector = await generateEmbedding(normalizedQuery);
  if (!queryVector || queryVector.length === 0) {
    return { found: false, answer: null, source: null };
  }

  // Tier 2: FAQ Vector Space Evaluation
  const allFAQs = await FAQ.find({ expertSystemID, embedding: { $exists: true, $not: { $size: 0 } } }).lean();
  let bestFAQMatch = null;
  let highestFAQScore = 0;

  for (const faq of allFAQs) {
    const score = cosineSimilarity(queryVector, faq.embedding);
    if (score > highestFAQScore) {
      highestFAQScore = score;
      bestFAQMatch = faq;
    }
  }

  if (highestFAQScore >= SIMILARITY_THRESHOLD && bestFAQMatch) {
    return {
      found: true,
      answer: bestFAQMatch.answer,
      source: "semantic_faq_match"
    };
  }

  // Tier 3: AIKnowledge Vector Space Evaluation
  const allKnowledge = await AIKnowledge.find({ expertSystemID, questionEmbedding: { $exists: true, $not: { $size: 0 } } }).lean();
  let bestKnowledgeMatch = null;
  let highestKnowledgeScore = 0;

  for (const entry of allKnowledge) {
    const score = cosineSimilarity(queryVector, entry.questionEmbedding);
    if (score > highestKnowledgeScore) {
      highestKnowledgeScore = score;
      bestKnowledgeMatch = entry;
    }
  }

  if (highestKnowledgeScore >= SIMILARITY_THRESHOLD && bestKnowledgeMatch) {
    // Increment structural usage metrics passively for Milestone 5 analytics tracking
    await AIKnowledge.updateOne(
      { _id: bestKnowledgeMatch._id },
      {
        $inc: {
          usageCount: 1
        }
      }
    );

    return {
      found: true,
      answer: bestKnowledgeMatch.answer,
      source: "semantic_aiknowledge_match"
    };
  }

  // If nothing meets thresholds across all tiers, trigger fallback fallback protocols
  return {
    found: false,
    answer: null,
    source: null,
    queryVector // Return vector to avoid recalculation downstream in the Ollama phase
  };
}

module.exports = { retrieveAnswerPipeline };