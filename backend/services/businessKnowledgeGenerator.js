const axios = require("axios");
const PendingAIResponse = require("../models/PendingAIResponse");
const { normalize } = require("../utils/normalize");
const { generateEmbedding } = require("./embedding.service");

/**
 * Trigger LLM knowledge extraction from Business Profile
 * @param {Object} profile - BusinessProfile Mongoose document
 * @param {Array<String>} [targetCategories] - Optional subset of categories for selective generation
 */
async function generateBusinessKnowledge(profile, targetCategories = null) {
  if (!profile || !profile.expertSystemID) {
    throw new Error("Invalid BusinessProfile provided to knowledge generator.");
  }

  const startTime = Date.now();
  console.log("\n=======================================================");
  console.log(`🚀 [Knowledge Generator] STARTING PROCESS for ExpertSystem: ${profile.expertSystemID}`);
  console.log(`🏢 Business: "${profile.businessName}"`);
  console.log("=======================================================\n");

  const defaultCategories = [
    "general",
    "product",
    "service",
    "pricing",
    "policy",
    "objection",
    "lead_qualification",
    "upsell",
    "greeting",
    "closing"
  ];

  const categoriesToGenerate = targetCategories || defaultCategories;
  
  // Split categories into smaller batches (2 per batch) to avoid giant LLM context delays
  const BATCH_SIZE = 2;
  const categoryBatches = [];
  for (let i = 0; i < categoriesToGenerate.length; i += BATCH_SIZE) {
    categoryBatches.push(categoriesToGenerate.slice(i, i + BATCH_SIZE));
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (let batchIndex = 0; batchIndex < categoryBatches.length; batchIndex++) {
    const currentBatch = categoryBatches[batchIndex];
    const progressPct = Math.round(((batchIndex) / categoryBatches.length) * 100);

    console.log(`\n⏳ [Progress ${progressPct}%] Processing Batch ${batchIndex + 1}/${categoryBatches.length}: [${currentBatch.join(", ")}]`);

    const prompt = `
You are an expert AI Customer Support Strategy System.
Analyze the following business profile and generate 1 realistic, high-value customer interactions strictly for the specified categories.

BUSINESS PROFILE:
- Business Name: ${profile.businessName}
- Description: ${profile.businessDescription || "N/A"}
- Products: ${profile.products?.join(", ") || "N/A"}
- Services: ${profile.services?.join(", ") || "N/A"}
- Policies: ${profile.policies?.join(", ") || "N/A"}
- Brand Tone: ${profile.tone}
- Primary Language: ${profile.language}
- Additional Guidance: ${profile.additionalInstructions || "None"}

CATEGORIES TO COVER IN THIS BATCH:
${currentBatch.join(", ")}

REQUIREMENTS:
1. Return strictly a JSON array of objects enclosed in square brackets [ ... ]. Even if you generate only 1 item, wrap it inside square brackets: [{ ... }].
2. Each object in the array MUST strictly follow this JSON schema:
{
  "category": "one of [${currentBatch.join(", ")}]",
  "question": "The representative customer question or trigger phrase",
  "answer": "The ideal, high-converting or helpful response matching the tone",
  "confidence": An integer between 0 and 100 representing certainty,
  "reasoning": "Short 1-sentence explanation why this Q&A item is valuable"
}
`;

    try {
      console.log(`   🤖 Prompting Ollama for categories: ${currentBatch.join(", ")}...`);
      const llmStart = Date.now();

      const response = await axios.post(
        "http://localhost:11434/api/generate", 
        {
          model: "llama3",
          prompt: prompt,
          stream: false,
          format: "json",
          options: {
            num_predict: 400,
            temperature: 0.3
          }
        },
        { timeout: 300000 }
      );

      console.log(`   ⏱️ LLM responded in ${((Date.now() - llmStart) / 1000).toFixed(1)}s`);

      const rawResponse = response.data?.response;
      if (!rawResponse) {
        console.warn(`   ⚠️ Empty response from Ollama for batch: ${currentBatch.join(", ")}`);
        continue;
      }

      // 🔍 DEBUG LOG: Print the exact raw text received from Ollama
      console.log(`\n--- 🐛 RAW OLLAMA RESPONSE [Batch: ${currentBatch.join(", ")}] ---`);
      console.log(rawResponse);
      console.log(`-----------------------------------------------------------------\n`);

      // 1. Clean markdown formatting backticks if present
      const cleanedResponse = rawResponse
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      let generatedItems = [];

      try {
        const parsed = JSON.parse(cleanedResponse);

        // Option A: Direct Array -> [ { ... }, { ... } ]
        if (Array.isArray(parsed)) {
          generatedItems = parsed;
        } 
        // Option B: Object wrapper -> { "categories": [...] } or { "items": [...] }
        else if (typeof parsed === "object" && parsed !== null) {
          const possibleArrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
          if (possibleArrayKey) {
            generatedItems = parsed[possibleArrayKey];
            console.log(`   💡 Extracted array from key: "${possibleArrayKey}"`);
          } 
          // Option C: Single Q&A Object -> { "question": "...", "answer": "..." }
          else if (parsed.question && parsed.answer) {
            generatedItems = [parsed];
            console.log(`   💡 Wrapped single Q&A object into an array.`);
          } else {
            console.warn(`   ⚠️ Object returned without valid Q&A fields. Object keys:`, Object.keys(parsed));
          }
        }
      } catch (pErr) {
        console.error(`   ❌ JSON Parse Error for batch [${currentBatch.join(", ")}]:`, pErr.message);
        continue;
      }

      if (!Array.isArray(generatedItems) || generatedItems.length === 0) {
        console.warn(`   ⚠️ Could not extract a valid array for batch: ${currentBatch.join(", ")}`);
        continue;
      }

      console.log(`   📦 Batch generated ${generatedItems.length} items. Saving to DB...`);

      for (const [itemIndex, item] of generatedItems.entries()) {
        if (!item.question || !item.answer) continue;

        const normQ = normalize(item.question);
        if (!normQ) continue;

        // Deduplication check
        const existingPending = await PendingAIResponse.findOne({
          expertSystemID: profile.expertSystemID,
          normalizedQuestion: normQ
        });

        if (existingPending) {
          totalSkipped++;
          console.log(`   ⏭️ [Item ${itemIndex + 1}/${generatedItems.length}] Skipped duplicate: "${item.question.substring(0, 30)}..."`);
          continue;
        }

        // Generate vector embedding
        let embedding = [];
        try {
          embedding = await generateEmbedding(normQ);
        } catch (embErr) {
          console.warn(`   ⚠️ Embedding failed for "${item.question.substring(0, 30)}...":`, embErr.message);
        }

        // Instant DB Save
        await PendingAIResponse.create({
          expertSystemID: profile.expertSystemID,
          source: "business_profile",
          category: categoriesToGenerate.includes(item.category) ? item.category : "general",
          question: item.question.trim(),
          normalizedQuestion: normQ,
          questionEmbedding: embedding,
          generatedAnswer: item.answer.trim(),
          confidence: typeof item.confidence === "number" ? item.confidence : 85,
          reasoning: item.reasoning || "Generated from business profile context.",
          profileVersion: profile.profileVersion || 1,
          status: "pending"
        });

        totalInserted++;
        console.log(`   💾 [Item ${itemIndex + 1}/${generatedItems.length}] Saved: "${item.question.substring(0, 40)}..."`);
      }

    } catch (batchErr) {
      console.error(`   ❌ Failed processing batch [${currentBatch.join(", ")}]:`, batchErr.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n=======================================================");
  console.log(`✅ [Knowledge Generator] COMPLETE in ${durationSec}s!`);
  console.log(`📊 Summary: Inserted = ${totalInserted}, Skipped Duplicates = ${totalSkipped}`);
  console.log("=======================================================\n");

  return { success: true, insertedCount: totalInserted, skippedCount: totalSkipped };
}

module.exports = { generateBusinessKnowledge };