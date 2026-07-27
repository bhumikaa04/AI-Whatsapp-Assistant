// seedFAQs.js
const mongoose = require("mongoose");
const FAQ = require("../models/FAQ"); // Adjust path to your FAQ model
const faqs = require("./faq"); // The array above
const { normalize } = require("../utils/normalize"); // Adjust path to your normalize utility
const { generateEmbedding } = require("../services/embedding.service"); // Adjust path to embedding service

const EXPERT_SYSTEM_ID = "696cdf9056d9c2c9f701ba32"; // Replace with your actual system ID

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI ||  "mongodb+srv://itsbhumika04:itsbhumika04@cluster0.hvqwybe.mongodb.net/");
  console.log("Connected to DB...");

  for (const item of faqs) {
    const normQ = normalize(item.question);
    const vector = await generateEmbedding(normQ);

    await FAQ.create({
      expertSystemID: EXPERT_SYSTEM_ID,
      category: item.category,
      
      // Dual-schema key compatibility
      question: item.question,
      answer: item.answer,
      primaryQuestion: item.question,
      primaryResponse: item.answer,
      normalizedQuestion: normQ,
      
      questionEmbedding: vector,
      embedding: vector,
      keywords: item.keywords,
      isActive: true,
      isApproved: true
    });
    console.log(`✅ Seeded FAQ: "${item.question}"`);
  }

  console.log("All FAQs successfully seeded!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});