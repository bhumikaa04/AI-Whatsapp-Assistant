// server/services/promptBuilder.service.js
const BusinessProfile = require("../models/BusinessProfile");
const FAQ = require("../models/FAQ");
const AIKnowledge = require("../models/AIKnowledge");
const { cosineSimilarity } = require("../utils/cosineSimilarity");

/**
 * Gathers business profiles and nearby context vectors to stitch 
 * together an enriched, context-aware instructions prompt template.
 * @param {string} expertSystemID 
 * @param {string} normalizedQuery 
 * @param {number[]} queryVector 
 * @returns {Promise<string>} Fully constructed system context prompt
 */
async function buildContextPrompt(expertSystemID, normalizedQuery, queryVector) {
  // 1. Fetch Business Profile
  const profile = await BusinessProfile.findOne({ expertSystemID }).lean();
  
  // Create safe fallback layout if profile doesn't exist yet
  const businessName = profile?.businessName || "Our Business";
  const description = profile?.businessDescription || "A professional service provider.";
  const products = profile?.products?.length ? profile.products.join(", ") : "Available upon request";
  const services = profile?.services?.length ? profile.services.join(", ") : "Available upon request";
  const policies = profile?.policies?.length ? profile.policies.join(", ") : "Standard terms apply";
  const instructions = profile?.additionalInstructions || "Be polite and helpful.";
  const tone = profile?.tone || "Professional";
  const language = profile?.language || "English";

  // 2. Fetch Relevant Semantic Context (Top 2 FAQs & Top 2 AIKnowledge entries)
  // We extract entries with reasonable similarity to avoid passing irrelevant noise to the context window
  const SIMILARITY_THRESHOLD = 0.65; 

  const allFAQs = await FAQ.find({ expertSystemID, embedding: { $exists: true, $not: { $size: 0 } } }).lean();
  const relevantFAQs = allFAQs
    .map(faq => ({ ...faq, score: cosineSimilarity(queryVector, faq.embedding) }))
    .filter(faq => faq.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const allKnowledge = await AIKnowledge.find({ expertSystemID, questionEmbedding: { $exists: true, $not: { $size: 0 } } }).lean();
  const relevantKnowledge = allKnowledge
    .map(entry => ({ ...entry, score: cosineSimilarity(queryVector, entry.questionEmbedding) }))
    .filter(entry => entry.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // 3. Assemble Core Structural Knowledge Markdown Blocks
  let contextBlocks = "";
  
  if (relevantFAQs.length > 0) {
    contextBlocks += "\n### Relevant FAQ Records:\n";
    relevantFAQs.forEach(f => {
      contextBlocks += `Q: ${f.question}\nA: ${f.answer}\n\n`;
    });
  }

  if (relevantKnowledge.length > 0) {
    contextBlocks += "\n### Historically Approved AI Knowledge Responses:\n";
    relevantKnowledge.forEach(k => {
      contextBlocks += `Q: ${k.question}\nA: ${k.answer}\n\n`;
    });
  }

  // 4. Construct Final Comprehensive Prompt Template Frame
  const systemPrompt = `You are an expert conversational AI CRM agent representing "${businessName}". Your task is to accurately answer the customer's query using the verified corporate context provided below.

[BUSINESS METADATA MEMORY]
- Description: ${description}
- Core Products Offered: ${products}
- Core Services Provided: ${services}
- Business Policies: ${policies}

[VERIFIED SYSTEM FACTS]${contextBlocks || "\nNo matching structural documentation found for this query. Rely on general business details above."}

[OPERATIONAL CONSTRAINTS]
- Tone Profile: ${tone}
- Language: ${language}
- Guardrails: ${instructions}
- Output constraint: Provide a concise, clear answer in 1-2 natural sentences. Do not mention system labels, internal markdown variables, rules, or database fields to the customer. If the answer cannot be confidently inferred from the business memory parameters, state that you are checking with a human representative.

Respond directly to the customer now.`;

  return systemPrompt;
}

module.exports = { buildContextPrompt };