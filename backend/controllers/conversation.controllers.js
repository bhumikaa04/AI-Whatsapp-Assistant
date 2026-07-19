// controllers/conversations.controllers.js
const Conversation = require("../models/Conversation");
const Customer = require("../models/Customer");
const mongoose = require("mongoose"); // Add this for ObjectId conversion if needed

/**
 * 1. Fetches all conversations merged with customer metrics for the dashboard list view
 * Handles irregular phone formatting by cleaning + symbols on the fly
 */
async function getAllConversations(req, res) {
  try {
    console.log("🔍 [Dashboard API] Starting conversation fetch...");
    
    // Step 1: Check if there are any conversations at all
    const totalConversations = await Conversation.countDocuments();
    console.log(`📊 [Dashboard API] Total conversations in DB: ${totalConversations}`);
    
    if (totalConversations === 0) {
      console.warn("⚠️ [Dashboard API] No conversations found in database!");
      return res.status(200).json([]);
    }

    // Step 2: Get raw conversations first to see what we're working with
    const rawConversations = await Conversation.find().limit(5).lean();
    console.log(`📝 [Dashboard API] Sample of raw conversations (first 5):`);
    rawConversations.forEach((conv, index) => {
      console.log(`  ${index + 1}. ID: ${conv._id}, Phone: ${conv.customerPhone}, Messages: ${conv.messages?.length || 0}`);
    });

    // Step 3: Check customers in DB
    const totalCustomers = await Customer.countDocuments();
    console.log(`📊 [Dashboard API] Total customers in DB: ${totalCustomers}`);
    
    if (totalCustomers > 0) {
      const sampleCustomers = await Customer.find().limit(3).lean();
      console.log(`📝 [Dashboard API] Sample of customers (first 3):`);
      sampleCustomers.forEach((cust, index) => {
        console.log(`  ${index + 1}. Phone: ${cust.phone}, Name: ${cust.name}, Intent: ${cust.intent}`);
      });
    }

    // Step 4: Run the aggregation pipeline
    console.log("🔄 [Dashboard API] Executing aggregation pipeline...");
    
    const pipeline = await Conversation.aggregate([
      // Stage 1: Clean up the phone number format from the conversation collection on the fly
      {
        $addFields: {
          cleanedConvPhone: {
            $replaceAll: { input: "$customerPhone", find: "+", replacement: "" }
          }
        }
      },
      // Stage 2: Join with the customer collection while aligning formats
      {
        $lookup: {
          from: "customers",
          let: { convPhone: "$cleanedConvPhone" },
          pipeline: [
            {
              $addFields: {
                cleanedCustPhone: {
                  $replaceAll: { input: "$phone", find: "+", replacement: "" }
                }
              }
            },
            {
              $match: {
                $expr: { $eq: ["$cleanedCustPhone", "$$convPhone"] }
              }
            }
          ],
          as: "customerProfile"
        }
      },
      {
        $unwind: {
          path: "$customerProfile",
          preserveNullAndEmptyArrays: true // Keep conversation entry visible even if profile matching behaves strictly
        }
      },
      // Stage 3: Map output cleanly for your Frontend component
      {
        $project: {
          _id: 1,
          customerPhone: 1,
          expertSystemID: 1,
          messages: 1,
          intent: { $ifNull: ["$customerProfile.intent", "New Lead"] },
          totalMessages: { 
            $ifNull: [
              "$customerProfile.totalMessages", 
              { $size: { $ifNull: ["$messages", []] } }
            ] 
          },
          lastInteraction: { $ifNull: ["$customerProfile.lastInteraction", "$updatedAt"] },
          name: { $ifNull: ["$customerProfile.name", "Anonymous Lead"] }
        }
      },
      { $sort: { lastInteraction: -1 } }
    ]);

    console.log(`✅ [Dashboard API] Aggregation complete. Found ${pipeline.length} results.`);
    
    // Step 5: Log sample of results
    if (pipeline.length > 0) {
      console.log(`📋 [Dashboard API] Sample of pipeline results (first 3):`);
      pipeline.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item._id}, Name: ${item.name}, Phone: ${item.customerPhone}, Intent: ${item.intent}, Messages: ${item.totalMessages}`);
        console.log(`     Last Interaction: ${item.lastInteraction}`);
        console.log(`     Has customerProfile? ${!!item.customerProfile}`);
      });
    } else {
      console.warn("⚠️ [Dashboard API] Pipeline returned empty array!");
    }

    console.log(`📋 [Dashboard API] Managed to process ${pipeline.length} pipelines with strict phone format safety.`);
    return res.status(200).json(pipeline);
  } catch (error) {
    console.error("💥 Error aggregating dashboard conversations:", error);
    console.error("💥 Error details:", error.stack);
    return res.status(500).json({ error: "Failed to load pipeline records." });
  }
}

/**
 * 2. Fetches a specific conversation and its detailed customer information
 */
async function getConversationById(req, res) {
  try {
    const { id } = req.params;
    console.log(`🔍 [Conversation Detail] Fetching conversation ID: ${id}`);

    if (!id) {
      console.warn("⚠️ [Conversation Detail] No ID provided");
      return res.status(400).json({ error: "Conversation ID is required." });
    }

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      console.warn(`⚠️ [Conversation Detail] No conversation found with ID: ${id}`);
      return res.status(404).json({ error: "Conversation not found." });
    }

    console.log(`✅ [Conversation Detail] Found conversation for phone: ${conversation.customerPhone}`);
    console.log(`📝 [Conversation Detail] Messages count: ${conversation.messages?.length || 0}`);

    // Fetch associated customer profile if exists
    console.log(`🔍 [Conversation Detail] Looking for customer with phone: ${conversation.customerPhone}`);
    const customer = await Customer.findOne({ 
      phone: conversation.customerPhone 
    });

    if (customer) {
      console.log(`✅ [Conversation Detail] Found customer: ${customer.name}, Intent: ${customer.intent}`);
    } else {
      console.log(`⚠️ [Conversation Detail] No customer found for phone: ${conversation.customerPhone}`);
      
      // Try with cleaned phone number (without +)
      const cleanedPhone = conversation.customerPhone.replace(/^\+/, '');
      console.log(`🔍 [Conversation Detail] Trying cleaned phone: ${cleanedPhone}`);
      const customerByCleaned = await Customer.findOne({ 
        phone: cleanedPhone 
      });
      if (customerByCleaned) {
        console.log(`✅ [Conversation Detail] Found customer with cleaned phone: ${customerByCleaned.name}`);
      } else {
        console.log(`⚠️ [Conversation Detail] No customer found with cleaned phone either`);
      }
    }

    // Combine conversation and customer data for detailed view
    const detailedConversation = {
      ...conversation.toObject(),
      customerProfile: customer || null,
      metrics: {
        totalMessages: customer?.totalMessages || conversation.messages.length,
        lastInteraction: customer?.lastInteraction || conversation.updatedAt,
        intent: customer?.intent || "New Lead",
        name: customer?.name || "Anonymous Lead"
      }
    };

    console.log(`📋 [Conversation Detail] Returning detailed conversation for: ${conversation.customerPhone}`);
    return res.status(200).json(detailedConversation);
  } catch (error) {
    console.error("💥 Error fetching conversation details:", error);
    console.error("💥 Error details:", error.stack);
    return res.status(500).json({ error: "Failed to load conversation details." });
  }
}

/**
 * 3. Handles manual response overrides submitted straight from your web CRM console
 */
async function sendManualReply(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    console.log(`📤 [Manual Reply] Sending reply to conversation: ${id}`);
    console.log(`📝 [Manual Reply] Message text: ${text}`);

    if (!text || !text.trim()) {
      console.warn("⚠️ [Manual Reply] Empty message text");
      return res.status(400).json({ error: "Reply body content cannot be empty." });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      console.warn(`⚠️ [Manual Reply] No conversation found with ID: ${id}`);
      return res.status(404).json({ error: "Target conversation channel missing." });
    }

    console.log(`✅ [Manual Reply] Found conversation for phone: ${conversation.customerPhone}`);

    const adminMessageObj = {
      sender: "bot", 
      text: text.trim(),
      timestamp: new Date() // Schema specifies 'timestamp' for messages array
    };

    conversation.messages.push(adminMessageObj);
    await conversation.save();
    console.log(`✅ [Manual Reply] Message saved. Total messages now: ${conversation.messages.length}`);

    // Update or create customer metrics
    const updatedCustomer = await Customer.findOneAndUpdate(
      { 
        expertSystemID: conversation.expertSystemID, 
        phone: conversation.customerPhone 
      },
      { 
        $inc: { totalMessages: 1 }, 
        $set: { lastInteraction: new Date() } 
      },
      { upsert: true, new: true }
    );

    console.log(`✅ [Manual Reply] Customer updated: ${updatedCustomer._id}, Total messages: ${updatedCustomer.totalMessages}`);
    console.log(`✅ Outbound console override recorded for: ${conversation.customerPhone}`);
    return res.status(201).json(adminMessageObj);
  } catch (error) {
    console.error("💥 Manual response registration failed:", error);
    console.error("💥 Error details:", error.stack);
    return res.status(500).json({ error: "Failed to process outbound message payload." });
  }
}

module.exports = {
  getAllConversations,
  getConversationById,
  sendManualReply
};