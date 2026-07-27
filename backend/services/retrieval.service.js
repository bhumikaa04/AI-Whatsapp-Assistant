// server/services/retrieval.service.js
const FAQ = require("../models/FAQ");
const AIKnowledge = require("../models/AIKnowledge");
const { normalize } = require("../utils/normalize");
const { generateEmbedding } = require("./embedding.service");
const { cosineSimilarity } = require("../utils/cosineSimilarity");

/**
 * Calculates word intersection between two strings
 */
function hasWordOverlap(q1, q2) {
  const words1 = q1.split(" ").filter(w => w.length > 2);
  const words2 = q2.split(" ").filter(w => w.length > 2);
  return words1.some(w => words2.includes(w));
}

/**
 * Safely extracts text and vector embedding regardless of schema variation
 */
function extractDocData(doc) {
  const question = doc.primaryQuestion || doc.question || "";
  const answer = doc.primaryResponse || doc.answer || doc.generatedAnswer || "";
  const normQ = (doc.normalizedQuestion || normalize(question)).toLowerCase().trim();
  const vector = doc.questionEmbedding || doc.embedding || [];

  return { question, answer, normQ, vector };
}

/**
 * Orchestrates Phase 2 of the pipeline tiering strategy
 */
async function retrieveAnswerPipeline(expertSystemID, rawCustomerMessage) {
  const normalizedQuery = normalize(rawCustomerMessage).toLowerCase().trim();
  
  if (!normalizedQuery) {
    return { found: false, answer: null, source: null };
  }

  const allFAQs = await FAQ.find({ expertSystemID }).lean();
  const allKnowledge = await AIKnowledge.find({ expertSystemID }).lean();

  // ✅ LOG AT THE VERY START
  console.log(`🔍 [Pipeline Debug] Searching FAQs for System ID: ${expertSystemID}`);
  console.log(`📊 [Pipeline Debug] Found ${allFAQs.length} FAQs & ${allKnowledge.length} AIKnowledge entries in DB`);

  // =========================================================================
  // TIER 1: Exact or Partial Substring Match
  // =========================================================================
  // =========================================================================
  // TIER 1: Exact Match OR Substring Match (Strict minimum length check)
  // =========================================================================
  for (const faq of allFAQs) {
    const { answer, normQ } = extractDocData(faq);
    
    if (!normQ || !answer) continue;

    // 1. Exact match (Always accurate)
    if (normQ === normalizedQuery) {
      console.log(`🎯 [Pipeline] Tier 1 Exact Match on FAQ: "${normQ}"`);
      return { found: true, answer, source: "exact_faq_match" };
    }

    // 2. Substring match ONLY if the FAQ string is at least 4 characters long
    // Prevents short strings like "hi", "ok", "no" from matching words like "sHIpping" or "nOtice"
    if (normQ.length >= 4 && normalizedQuery.includes(normQ)) {
      console.log(`🎯 [Pipeline] Tier 1 Substring Match on FAQ: "${normQ}"`);
      return { found: true, answer, source: "substring_faq_match" };
    }
  }

  for (const entry of allKnowledge) {
    const { answer, normQ } = extractDocData(entry);

    if (!normQ || !answer) continue;

    if (normQ === normalizedQuery) {
      console.log(`🎯 [Pipeline] Tier 1 Exact Match on AIKnowledge: "${normQ}"`);
      return { found: true, answer, source: "exact_aiknowledge_match" };
    }

    if (normQ.length >= 4 && normalizedQuery.includes(normQ)) {
      console.log(`🎯 [Pipeline] Tier 1 Substring Match on AIKnowledge: "${normQ}"`);
      return { found: true, answer, source: "substring_aiknowledge_match" };
    }
  }

  // =========================================================================
  // TIER 2: Semantic Vector Search
  // =========================================================================
  let queryVector = [];
  try {
    queryVector = await generateEmbedding(normalizedQuery);
  } catch (err) {
    console.error("Embedding generation error in pipeline:", err);
  }

  if (!queryVector || queryVector.length === 0) {
    return { found: false, answer: null, source: null };
  }

  const wordCount = normalizedQuery.split(" ").length;
  const EFFECTIVE_THRESHOLD = wordCount <= 2 ? 0.55 : 0.62; 

  // --- Evaluate FAQ Vector Space ---
  let bestFAQMatch = null;
  let highestFAQScore = 0;

  for (const faq of allFAQs) {
    const { question, answer, normQ, vector } = extractDocData(faq);

    if (vector && vector.length > 0 && answer) {
      let score = cosineSimilarity(queryVector, vector);
      
      // ✅ Apply word overlap bonus regardless of word count if there's direct keyword match
      if (hasWordOverlap(normalizedQuery, normQ)) {
        score += 0.10; 
      }

      console.log(`  📐 [Vector Eval] Q: "${question.substring(0, 30)}..." | Score: ${score.toFixed(3)}`);

      if (score > highestFAQScore) {
        highestFAQScore = score;
        bestFAQMatch = { answer, score, question };
      }
    } else {
      console.log(`  ⚠️ [Vector Eval Skipped] FAQ "${question.substring(0, 30)}..." has EMPTY vector embedding!`);
    }
  }

  if (highestFAQScore >= EFFECTIVE_THRESHOLD && bestFAQMatch) {
    console.log(`🎯 [Pipeline] FAQ Vector Match! Score: ${highestFAQScore.toFixed(3)} (Threshold: ${EFFECTIVE_THRESHOLD}) | Q: "${bestFAQMatch.question}"`);
    return {
      found: true,
      answer: bestFAQMatch.answer,
      source: `semantic_faq_match (score: ${highestFAQScore.toFixed(2)})`
    };
  }

  // --- Evaluate AIKnowledge Vector Space ---
  let bestKnowledgeMatch = null;
  let highestKnowledgeScore = 0;

  for (const entry of allKnowledge) {
    const { question, answer, normQ, vector } = extractDocData(entry);

    if (vector && vector.length > 0 && answer) {
      let score = cosineSimilarity(queryVector, vector);
      
      if (hasWordOverlap(normalizedQuery, normQ)) {
        score += 0.10;
      }

      if (score > highestKnowledgeScore) {
        highestKnowledgeScore = score;
        bestKnowledgeMatch = { _id: entry._id, answer, score };
      }
    }
  }

  if (highestKnowledgeScore >= EFFECTIVE_THRESHOLD && bestKnowledgeMatch) {
    console.log(`🎯 [Pipeline] AIKnowledge Vector Match! Score: ${highestKnowledgeScore.toFixed(3)} (Threshold: ${EFFECTIVE_THRESHOLD})`);

    await AIKnowledge.updateOne(
      { _id: bestKnowledgeMatch._id },
      { $inc: { usageCount: 1 } }
    );

    return {
      found: true,
      answer: bestKnowledgeMatch.answer,
      source: `semantic_aiknowledge_match (score: ${highestKnowledgeScore.toFixed(2)})`
    };
  }

  console.log(`❌ [Pipeline Miss] Highest FAQ Score was ${highestFAQScore.toFixed(3)} (Required >= ${EFFECTIVE_THRESHOLD})`);

  // =========================================================================
  // TIER 3: Fallback to Ollama LLM
  // =========================================================================
  return {
    found: false,
    answer: null,
    source: null,
    queryVector
  };
}

module.exports = { retrieveAnswerPipeline };