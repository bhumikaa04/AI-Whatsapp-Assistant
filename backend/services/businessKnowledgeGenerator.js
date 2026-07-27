// server/services/knowledgeGenerator.service.js
const axios = require("axios");
const PendingAIResponse = require("../models/PendingAIResponse");
const FAQ = require("../models/FAQ");
const { normalize } = require("../utils/normalize");
const { generateEmbedding } = require("./embedding.service");

/**
 * Trigger LLM knowledge extraction from Business Profile
 * @param {Object} profile - Business Profile 
 */
async function generateBusinessKnowledge(profile) {
  if (!profile || !profile.expertSystemID) {
    throw new Error("Invalid BusinessProfile provided to knowledge generator.");
  }

  const startTime = Date.now();
  console.log("\n=======================================================");
  console.log(`🚀 [Knowledge Generator] STARTING for ExpertSystem: ${profile.expertSystemID}`);
  console.log(`🏢 Business: "${profile.businessName}"`);
  console.log("=======================================================\n");

  let totalInserted = 0;
  let totalSkipped = 0;

  const prompt = `
    You are AI FAQ Generator.
    Your job is to build the INITIAL FAQ knowledge base for a business profile.

    BUSINESS PROFILE:
    - Business Name: ${profile.businessName}
    - Description: ${profile.businessDescription || "Not provided"}
    - Products: ${profile.products?.join(", ") || "None"}
    - Services: ${profile.services?.join(", ") || "None"}
    - Policies: ${profile.policies?.join(", ") || "None"}
    - Tone: ${profile.tone || "Professional"}
    - Language: ${profile.language || "English"}

    RULES:
    - Generate ONLY FAQs that are directly supported by the Business Profile above.
    - DO NOT invent prices, discounts, delivery times, addresses, or phone numbers unless explicitly mentioned.
    - Questions must be realistic business FAQs.

    OUTPUT FORMAT:
    Return ONLY a valid JSON array. Generate around 5 FAQ objects.
    
    [
      {
        "category": "General Info",
        "question": "What services do you offer?",
        "answer": "We offer...",
        "keywords": ["services", "offers", "help"]
      }
    ]
  `;

  try {
    console.log(`🤖 Prompting Ollama model for initial FAQ generation...`);
    const llmStart = Date.now();

    const response = await axios.post(
      "http://localhost:11434/api/generate", 
      {
        model: "llama3",
        prompt: prompt,
        stream: false,
        format: "json",
        options: {
          num_predict: 1800,
          temperature: 0.15,
          top_p: 0.9
        }
      },
      { timeout: 300000 }
    );

    console.log(`⏱️ LLM responded in ${((Date.now() - llmStart) / 1000).toFixed(1)}s`);

    const rawResponse = response.data?.response;
    if (!rawResponse) {
      console.warn(`⚠️ Empty response from Ollama.`);
      return { success: false, reason: "Empty LLM output" };
    }

    const cleanedResponse = rawResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let generatedItems = [];
    try {
      const parsed = JSON.parse(cleanedResponse);
      if (Array.isArray(parsed)) {
        generatedItems = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        const possibleKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (possibleKey) generatedItems = parsed[possibleKey];
      }
    } catch (pErr) {
      console.error(`❌ JSON Parse Error:`, pErr.message);
      return { success: false, error: pErr.message };
    }

    console.log(`📦 Generated ${generatedItems.length} raw draft items. Validating...`);

    // for (const [itemIndex, item] of generatedItems.entries()) {
    //   if (!item.question || !item.answer) continue;

    //   const normQ = normalize(item.question);
    //   if (!normQ) continue;

    //   // Deduplication checks against BOTH live FAQs AND PendingQueue
    //   const existingFAQ = await FAQ.findOne({ expertSystemID: profile.expertSystemID, normalizedQuestion: normQ });
    //   const existingPending = await PendingAIResponse.findOne({ expertSystemID: profile.expertSystemID, normalizedQuestion: normQ, status: "pending" });

    //   if (existingFAQ || existingPending) {
    //     totalSkipped++;
    //     continue;
    //   }

    //   // Generate Vector Embedding for queue preview
    //   let embedding = [];
    //   try {
    //     embedding = await generateEmbedding(normQ);
    //   } catch (embErr) {
    //     console.warn(`⚠️ Embedding generation skipped for question: "${item.question.substring(0, 30)}..."`);
    //   }

    //   // Save to Staging Queue for Admin Approval
    //   await PendingAIResponse.create({
    //     expertSystemID: profile.expertSystemID,
    //     category: item.category || "General",
    //     source: "business_profile",
    //     question: item.question.trim(),
    //     normalizedQuestion: normQ,
    //     questionEmbedding: embedding,
    //     generatedAnswer: item.answer.trim(),
    //     keywords: Array.isArray(item.keywords) ? item.keywords : [],
    //     confidence: 90, // High confidence since generated straight from profile
    //     status: "pending"
    //   });

    //   totalInserted++;
    //   console.log(`💾 [${itemIndex + 1}/${generatedItems.length}] Saved to Queue: "${item.question.substring(0, 40)}..."`);
    // }

    // Inside generateBusinessKnowledge function:

for (const [itemIndex, item] of generatedItems.entries()) {
  const qText = item.question || item.primaryQuestion;
  const aText = item.answer || item.primaryResponse || item.generatedAnswer;

  if (!qText || !aText) continue;

  const normQ = normalize(qText);
  if (!normQ) continue;

  // 1. Map/Normalize category to match PendingAIResponse enum values
  const rawCat = (item.category || "general").toLowerCase().trim();
  let categoryEnum = "general";
  if (rawCat.includes("product")) categoryEnum = "product";
  else if (rawCat.includes("service")) categoryEnum = "service";
  else if (rawCat.includes("price") || rawCat.includes("pricing")) categoryEnum = "pricing";
  else if (rawCat.includes("policy")) categoryEnum = "policy";
  else if (rawCat.includes("objection")) categoryEnum = "objection";

  // 2. Deduplication checks
  const existingFAQ = await FAQ.findOne({ expertSystemID: profile.expertSystemID, normalizedQuestion: normQ });
  const existingPending = await PendingAIResponse.findOne({ expertSystemID: profile.expertSystemID, normalizedQuestion: normQ, status: "pending" });

  if (existingFAQ || existingPending) {
    totalSkipped++;
    continue;
  }

  // 3. Generate Vector Embedding
  let embedding = [];
  try {
    embedding = await generateEmbedding(normQ);
  } catch (embErr) {
    console.warn(`⚠️ Embedding generation skipped for: "${qText.substring(0, 30)}..."`);
  }

  // 4. Save to PendingAIResponse (with all required schema fields)
  await PendingAIResponse.create({
    expertSystemID: profile.expertSystemID,
    source: "business_profile",
    category: categoryEnum,
    intent: normQ,                        // Required by schema
    primaryQuestion: qText.trim(),       // Required by schema
    question: qText.trim(),              // For backwards compatibility
    normalizedQuestion: normQ,
    questionEmbedding: embedding,
    primaryResponse: aText.trim(),       // Required by schema
    generatedAnswer: aText.trim(),       // For backwards compatibility
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    confidence: 90,
    status: "pending"
  });

  totalInserted++;
  console.log(`💾 [${itemIndex + 1}/${generatedItems.length}] Saved to Queue: "${qText.substring(0, 40)}..."`);
}

  } catch (err) {
    console.error(`❌ Failed knowledge generation:`, err.message);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n=======================================================");
  console.log(`✅ [Knowledge Generator] COMPLETE in ${durationSec}s!`);
  console.log(`📊 Summary: Inserted = ${totalInserted}, Skipped = ${totalSkipped}`);
  console.log("=======================================================\n");

  return { success: true, insertedCount: totalInserted, skippedCount: totalSkipped };
}

module.exports = { generateBusinessKnowledge };