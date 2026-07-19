// seedFaqs.js - CORRECTED VERSION
require("dotenv").config();
const mongoose = require("mongoose");

const ExpertSystem = require("../models/ExpertSystem");
const FAQ = require("../models/FAQ");

async function seedFaqs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://itsbhumika04:itsbhumika04@cluster0.hvqwybe.mongodb.net/");
    console.log("✅ MongoDB connected");

    // Use the phone number from your logs - WITH + prefix
    const ownerPhone = "+919871265404";

    console.log(`Looking for expert system with ownerPhone: ${ownerPhone}`);
    
    // Find expert system by phone
    let expertSystem = await ExpertSystem.findOne({ ownerPhone });
    
    if (!expertSystem) {
      console.log("⚠️ Expert system not found by phone, trying by ID...");
      
      // Try to find by the ID from your logs
      const systemId = "69590152283a3e83cfd5bc6f";
      expertSystem = await ExpertSystem.findById(systemId);
      
      if (!expertSystem) {
        console.log("⚠️ Expert system not found by ID either, creating new...");
        expertSystem = await ExpertSystem.create({ 
          ownerPhone,
          name: `System for ${ownerPhone}`
        });
      }
    }
    
    console.log(`✅ Using expert system: ${expertSystem._id}`);
    
    // Delete existing FAQs for this system
    console.log("Clearing existing FAQs for this system...");
    await FAQ.deleteMany({ systemId: expertSystem._id });
    console.log("✅ Cleared existing FAQs");

    // Create FAQs array
    const faqs = [
      {
        systemId: expertSystem._id,  // Use the actual ObjectId, not a string
        question: "What services do you offer?",
        answer: "We offer customized services based on your needs. Please tell us what you're looking for.",
        keywords: ["services", "offer", "provide", "what do you do", "what services"],
        priority: 5,
      },
      {
        systemId: expertSystem._id,
        question: "What are your working hours?",
        answer: "Our working hours are Monday to Friday, 10 AM to 6 PM.",
        keywords: ["working hours", "timing", "open", "hours", "when", "available"],
        priority: 3,
      },
      {
        systemId: expertSystem._id,
        question: "How can I contact support?",
        answer: "You can contact our support team directly through WhatsApp.",
        keywords: ["contact", "support", "help", "email", "call", "phone"],
        priority: 6,
      },
      {
        systemId: expertSystem._id,
        question: "Do you provide refunds?",
        answer: "Refunds are handled on a case-by-case basis. Please share your concern.",
        keywords: ["refund", "money back", "return", "cancel", "payment"],
        priority: 7,
      },
      {
        systemId: expertSystem._id,
        question: "Is my data secure?",
        answer: "Yes, we take data security seriously and ensure your information is protected.",
        keywords: ["data", "privacy", "secure", "safe", "protection"],
        priority: 8,
      }
    ];

    // Insert FAQs
    const result = await FAQ.insertMany(faqs);
    console.log(`✅ ${result.length} FAQs seeded successfully`);
    
    // Verify
    const count = await FAQ.countDocuments({ systemId: expertSystem._id });
    console.log(`📊 Total FAQs in database for this system: ${count}`);
    
    // Show all seeded FAQs
    const seededFAQs = await FAQ.find({ systemId: expertSystem._id });
    console.log("\n📝 Seeded FAQs:");
    seededFAQs.forEach((faq, index) => {
      console.log(`${index + 1}. Q: ${faq.question}`);
      console.log(`   Keywords: ${faq.keywords.join(", ")}`);
    });

    mongoose.disconnect();
    process.exit(0);
    
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
}

seedFaqs();