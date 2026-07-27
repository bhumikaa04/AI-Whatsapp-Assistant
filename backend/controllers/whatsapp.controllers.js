// server/controllers/whatsapp.controller.js
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Customer = require("../models/Customer");
const PendingAIResponse = require("../models/PendingAIResponse");
const aiService = require("../services/ai.services");
const mongoose = require("mongoose");
const twilio = require("twilio");

// Core Architectural Utility & Service Imports
const { normalize } = require("../utils/normalize");
const { retrieveAnswerPipeline } = require("../services/retrieval.service");
const { buildContextPrompt } = require("../services/promptBuilder.service");

// Initialize Twilio REST Client for asynchronous message delivery
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Upgraded Substring/Keyword checker that only matches whole words
 */
function isLowSignalMessage(text) {
  const normalizedText = normalize(text);
  if (!normalizedText) return true;

  const lowSignalPhrases = ["ok", "okay", "thanks", "thank you", "bye", "hi", "hello", "hey", "peeps"];
  
  // Split into actual clean words
  const words = normalizedText.split(/\s+/);

  // If the entire message is just 1 or 2 low-signal words (e.g., "hey", "hi there", "ok thanks")
  const isOnlyGreetings = words.every(word => lowSignalPhrases.includes(word));
  
  return isOnlyGreetings;
}

/**
 * Helper function to send immediate synchronous TwiML responses for fast-path matches
 */
async function sendTwiMLReply(res, replyText, conversation) {
  const botMessageObj = { 
    sender: "bot", 
    text: replyText,
    timestamp: new Date()
  };
  
  conversation.messages.push(botMessageObj);
  await conversation.save();
  console.log(`💾 [Fast Path] Bot message saved. Total messages: ${conversation.messages.length}`);

  const escapedReply = replyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  res.set('Content-Type', 'text/xml');
  return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapedReply}</Message></Response>`);
}

/**
 * Background out-of-band processing worker 
 */
async function processSlowResponseInBackground({
  messageText,
  activeSystemID,
  rawFrom,
  rawTo,
  conversation,
  customer
}) {
  try {
    // 1. Execute Pipeline: Exact Text & Semantic Embeddings Tiers (FAQ search)
    console.log(`🔍 [Async Background] Running Multi-Tier Retrieval Pipeline...`);
    const pipelineResult = await retrieveAnswerPipeline(activeSystemID, messageText);

    if (pipelineResult.found) {
      console.log(`🎯 [Async Background] Match resolved via verified pipeline tier: [${pipelineResult.source}]`);
      const finalReply = pipelineResult.answer;

      conversation.messages.push({ 
        sender: "bot", 
        text: finalReply,
        timestamp: new Date()
      });
      await conversation.save();

      // Dispatch messaging directly to client terminal via Twilio Outbound REST SDK
      await twilioClient.messages.create({
        from: rawTo,   
        to: rawFrom,   
        body: finalReply
      });
      console.log(`✉️ [Async Background] Verified pipeline answer delivered via Twilio REST SDK.`);
      
    } else {
      // 2. Hard LLM Fallback (Local Ollama Engine Execution with Business Context)
      console.log(`🦙 [Async Background] Pipeline missed. Generating Context-Aware prompt context via Ollama...`);
      
      const normalizedQuery = normalize(messageText);
      const queryVector = pipelineResult.queryVector || await aiService.getEmbedding(normalizedQuery);
      
      const infusedContextPrompt = await buildContextPrompt(activeSystemID, normalizedQuery, queryVector);
      const rawLlamaReply = await aiService.generateChatFallback(messageText, infusedContextPrompt);

      let finalizedResponse = rawLlamaReply
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/[<>]/g, "")
        .replace(/```/g, "")
        .replace(/&/g, "and")  
        .replace(/"/g, "'");

      // Save bot interaction to local message track history
      conversation.messages.push({ 
        sender: "bot", 
        text: finalizedResponse,
        timestamp: new Date()
      });
      await conversation.save();

      // **FIX**: Dispatch Ollama response IMMEDIATELY to the user handset
      await twilioClient.messages.create({
        from: rawTo,   
        to: rawFrom,   
        body: finalizedResponse
      });
      console.log(`✉️ [Async Background] Ollama fallback answer sent directly to user.`);

      // 3. Log to PendingAIResponses queue for later Admin Dashboard management
      console.log(`📥 [Human Review Loop] Storing copy to PendingAIResponses queue for Admin management...`);
      await PendingAIResponse.create({
        expertSystemID: activeSystemID,
        question: messageText,
        normalizedQuestion: normalizedQuery,
        questionEmbedding: queryVector,
        generatedAnswer: finalizedResponse,
        confidence: 0.70, 
        status: "pending" // Admin reads from here in AIcontrol.jsx
      });

      console.log(`✅ [Human Review Loop] Record logged to dashboard queue successfully.`);
    }

    // 4. Evaluate Lead Intent profiling triggers safely in background thread context
    const isTerminalState = ["Converted", "Spam"].includes(customer.intent);
    const isLowSignal = isLowSignalMessage(messageText);
    const messagesSinceLastCheck = customer.totalMessages - customer.lastAnalysisCount;
    const meetsThrottleThreshold = messagesSinceLastCheck >= 3;

    if (!isTerminalState && !isLowSignal && meetsThrottleThreshold) {
      console.log(`🐢 [Intent Analysis] Requirements met. Triggering evaluation...`);
      
      const historyStr = conversation.messages.slice(-6)
        .map(m => `${m.sender === 'user' ? 'Customer' : 'Bot'}: ${m.text}`)
        .join("\n");

      aiService.analyzeLeadIntent(historyStr).then(async (analysis) => {
        if (analysis) {
          customer.intent = analysis.intent;
          customer.leadScore = analysis.leadScore;
          customer.lastAnalysisCount = customer.totalMessages; 
          await customer.save();
          console.log(`📊 [Intent Analysis Success] Updated: [${analysis.intent}]`);
        }
      }).catch(err => console.error("❌ [Intent Analysis Error]:", err.message));
    } else {
      await customer.save();
    }

  } catch (backgroundWorkerError) {
    console.error("❌ Critical breakdown within async background thread system context:", backgroundWorkerError);
  }
}

/**
 * Main Webhook Input Gateway Controller
 */
async function incomingMsgs(req, res) {
  try {
    const rawFrom = req.body.From || ""; 
    const rawTo = req.body.To || "";
    const messageText = (req.body.Body || "").trim(); 
    const cleanSenderPhone = rawFrom.replace('whatsapp:', '');
    let cleanBusinessPhone = rawTo.replace('whatsapp:', '');
    const whatsappName = req.body.ProfileName;

    console.log(`\n📥 ================= NEW INCOMING MESSAGE =================`);
    console.log(`📱 From (Customer): ${cleanSenderPhone} | 💬 Message: "${messageText}"`);

    let user = null;
    let activeSystemID = null;

    if (cleanBusinessPhone === "+14155238886") {
      const YOUR_REAL_BUSINESS_NUMBER = "+918750685404";
      user = await User.findOne({ phoneNumber: YOUR_REAL_BUSINESS_NUMBER }) || await User.findOne({});
      
      if (!user) {
        user = await new User({
          phoneNumber: "+14155238886",
          name: "Sandbox Business",
          expertSystemID: new mongoose.Types.ObjectId(),
        }).save();
      }
      activeSystemID = user.expertSystemID || user._id;
    } else {
      user = await User.findOne({ phoneNumber: cleanBusinessPhone });
      if (user) activeSystemID = user.expertSystemID || user._id;
    }

    if (!user || !activeSystemID) {
      res.type('text/xml');
      return res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Business routing account not found.</Message></Response>');
    }

    let conversation = await Conversation.findOne({ expertSystemID: activeSystemID, customerPhone: cleanSenderPhone });
    if (!conversation) {
      conversation = new Conversation({ expertSystemID: activeSystemID, customerPhone: cleanSenderPhone, messages: [] });
    }
    
    conversation.messages.push({ sender: "user", text: messageText, timestamp: new Date() });
    await conversation.save();

    let customer = await Customer.findOne({ expertSystemID: activeSystemID, phone: cleanSenderPhone });
    if (!customer) {
      const phoneDigits = cleanSenderPhone.replace(/[^0-9]/g, "");
      const avatarIndex = Number(phoneDigits) % 5;
      customer = new Customer({ 
        expertSystemID: activeSystemID, 
        phone: cleanSenderPhone,
        name: whatsappName || "Anonymous Lead",
        avatarSeed: avatarIndex
      });
    }
    
    customer.totalMessages += 1;
    customer.lastInteraction = new Date();

    // PATHWAY A: Low-Signal Substring Filter Match
    if (isLowSignalMessage(messageText)) {
      console.log(`⚡ [Response Engine] Low-signal substring catch triggered. Fast delivery.`);
      await customer.save();
      return sendTwiMLReply(res, "Hey there! How can I help you with our business today?", conversation);
    }

    // PATHWAY B & C: Offloaded to background pipeline engine
    console.log(`⏳ [Response Engine] Relaying to pipeline execution engine thread.`);
    await customer.save();

    // Release connection socket immediately back to Twilio to guarantee no 11200 timeouts
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);

    processSlowResponseInBackground({
      messageText,
      activeSystemID,
      rawFrom,
      rawTo,
      conversation,
      customer
    });

  } catch (error) {
    console.error("💥 Critical Webhook processing system failure crash:", error);
    res.set('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>System exception encountered.</Message></Response>`);
  }
}

module.exports = { incomingMsgs };