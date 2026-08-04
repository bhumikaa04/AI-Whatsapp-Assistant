// server/scripts/reindexEmbeddings.js
require("dotenv").config();
const mongoose = require("mongoose");
const { pipeline } = require("@xenova/transformers");
const FAQ = require("../models/FAQ");
const AIKnowledge = require("../models/AIKnowledge");

let extractor = null;

// Initialize the local Transformer pipeline
async function getExtractor() {
  if (!extractor) {
    console.log("⚙️  Loading local model: Xenova/all-MiniLM-L6-v2 (384 dims)...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Local model ready.");
  }
  return extractor;
}

// Helper to generate a 384-dimension normalized array
async function generateLocalEmbedding(text) {
  if (!text || typeof text !== "string") return [];
  const generate = await getExtractor();
  const output = await generate(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function reindex() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("Missing MONGODB_URI/MONGO_URI in .env file");
    }
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected.");

    // -------------------------------------------------------------
    // 1. RE-INDEX FAQ COLLECTION
    // -------------------------------------------------------------
    const faqs = await FAQ.find({});
    console.log(`\n🔄 Found ${faqs.length} FAQ documents to re-index...`);

    let faqUpdated = 0;
    for (const faq of faqs) {
      const questionText = faq.primaryQuestion || faq.question || "";
      if (!questionText) continue;

      const newVector = await generateLocalEmbedding(questionText);

      // Support either field name depending on your schema
      if (faq.questionEmbedding !== undefined) {
        faq.questionEmbedding = newVector;
      } else {
        faq.embedding = newVector;
      }

      await faq.save();
      faqUpdated++;
      console.log(`  [${faqUpdated}/${faqs.length}] Updated FAQ: "${questionText.substring(0, 40)}..." (Vector length: ${newVector.length})`);
    }

    // -------------------------------------------------------------
    // 2. RE-INDEX AIKNOWLEDGE COLLECTION
    // -------------------------------------------------------------
    const knowledgeDocs = await AIKnowledge.find({});
    console.log(`\n🔄 Found ${knowledgeDocs.length} AIKnowledge documents to re-index...`);

    let knowledgeUpdated = 0;
    for (const doc of knowledgeDocs) {
      const questionText = doc.primaryQuestion || doc.question || "";
      if (!questionText) continue;

      const newVector = await generateLocalEmbedding(questionText);

      if (doc.questionEmbedding !== undefined) {
        doc.questionEmbedding = newVector;
      } else {
        doc.embedding = newVector;
      }

      await doc.save();
      knowledgeUpdated++;
      console.log(`  [${knowledgeUpdated}/${knowledgeDocs.length}] Updated AIKnowledge: "${questionText.substring(0, 40)}..." (Vector length: ${newVector.length})`);
    }

    console.log("\n🎉 Re-indexing complete!");
    console.log(`Summary: Updated ${faqUpdated} FAQs and ${knowledgeUpdated} AIKnowledge entries to 384-dim vectors.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Re-indexing failed:", error);
    process.exit(1);
  }
}

reindex();