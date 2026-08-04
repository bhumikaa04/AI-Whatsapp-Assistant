// // server/controllers/whatsapp.controller.js
// const User = require("../models/User");
// const Conversation = require("../models/Conversation");
// const Customer = require("../models/Customer");
// const PendingAIResponse = require("../models/PendingAIResponse");
// const aiService = require("../services/ai.services");
// const mongoose = require("mongoose");
// const twilio = require("twilio");

// // Core Architectural Utility & Service Imports
// const { normalize } = require("../utils/normalize");
// const { retrieveAnswerPipeline } = require("../services/retrieval.service");
// const { buildContextPrompt } = require("../services/promptBuilder.service");

// // Initialize Twilio REST Client for asynchronous message delivery
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// /**
//  * Upgraded Substring/Keyword checker that only matches whole words
//  */
// function isLowSignalMessage(text) {
//   const normalizedText = normalize(text);
//   if (!normalizedText) return true;

//   const lowSignalPhrases = ["ok", "okay", "thanks", "thank you", "bye", "hi", "hello", "hey", "peeps"];
  
//   // Split into actual clean words
//   const words = normalizedText.split(/\s+/);

//   // If the entire message is just 1 or 2 low-signal words (e.g., "hey", "hi there", "ok thanks")
//   const isOnlyGreetings = words.every(word => lowSignalPhrases.includes(word));
  
//   return isOnlyGreetings;
// }

// /**
//  * Helper function to send immediate synchronous TwiML responses for fast-path matches
//  */
// async function sendTwiMLReply(res, replyText, conversation) {
//   const botMessageObj = { 
//     sender: "bot", 
//     text: replyText,
//     timestamp: new Date()
//   };
  
//   conversation.messages.push(botMessageObj);
//   await conversation.save();
//   console.log(`💾 [Fast Path] Bot message saved. Total messages: ${conversation.messages.length}`);

//   const escapedReply = replyText
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&apos;');

//   res.set('Content-Type', 'text/xml');
//   return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapedReply}</Message></Response>`);
// }

// /**
//  * Background out-of-band processing worker 
//  */
// async function processSlowResponseInBackground({
//   messageText,
//   activeSystemID,
//   rawFrom,
//   rawTo,
//   conversation,
//   customer
// }) {
//   try {
//     // Debug log to inspect active routing parameters
//     console.log("DB Search Param ->", { 
//       activeSystemID: activeSystemID.toString(), 
//       messageText 
//     });

//     // 1. Execute Pipeline: Exact Text & Semantic Embeddings Tiers (FAQ search)
//     console.log(`🔍 [Async Background] Running Multi-Tier Retrieval Pipeline for System ID: ${activeSystemID}...`);
//     const pipelineResult = await retrieveAnswerPipeline(activeSystemID, messageText);

//     if (pipelineResult && pipelineResult.found) {
//       console.log(`🎯 [Async Background] Match resolved via verified pipeline tier: [${pipelineResult.source}]`);
//       const finalReply = pipelineResult.answer;

//       conversation.messages.push({ 
//         sender: "bot", 
//         text: finalReply,
//         timestamp: new Date()
//       });
//       await conversation.save();

//       // Dispatch messaging directly to client terminal via Twilio Outbound REST SDK
//       await twilioClient.messages.create({
//         from: rawTo,   
//         to: rawFrom,   
//         body: finalReply
//       });
//       console.log(`✉️ [Async Background] Verified pipeline answer delivered via Twilio REST SDK.`);
      
//     } else {
//       // 2. Fallback execution when DB/Ollama is bypassed
//       console.log(`⚠️ [Async Background] Pipeline missed. Ollama is not in use.`);

//       const fallbackReply = "Thank you for reaching out! We received your query, but our automated assistant is currently offline. A representative will get back to you shortly.";

//       // Save bot interaction history
//       conversation.messages.push({ 
//         sender: "bot", 
//         text: fallbackReply,
//         timestamp: new Date()
//       });
//       await conversation.save();

//       // Dispatch fallback response back to Twilio handset
// try {

//     console.log("Attempting outbound message...");
//     console.log({
//         from: rawTo,
//         to: rawFrom,
//         body: fallbackReply
//     });

//     const result = await twilioClient.messages.create({
//         from: "whatsapp:+14155238886",
//         to: rawFrom,
//         body: fallbackReply
//     });

//     await new Promise(resolve => setTimeout(resolve, 5000));

//     const fetched = await twilioClient.messages(result.sid).fetch();

// console.log("Fetched SID:", fetched.sid);
// console.log("Fetched Status:", fetched.status);
// console.log("Fetched Account:", fetched.accountSid);
// console.log("Fetched Error Code:", fetched.errorCode);
// console.log("Fetched Error Message:", fetched.errorMessage);
//     console.log("SUCCESS");
//     console.log(result);

// }
// catch(err){

//     console.error("TWILIO SEND FAILED");

//     console.error(err);

//     console.error("Code:", err.code);
//     console.error("Status:", err.status);
//     console.error("Message:", err.message);
// }
//     }

//     // 3. Evaluate Lead Intent profiling triggers safely in background thread context
//     const isTerminalState = ["Converted", "Spam"].includes(customer.intent);
//     const isLowSignal = isLowSignalMessage(messageText);
//     const messagesSinceLastCheck = customer.totalMessages - customer.lastAnalysisCount;
//     const meetsThrottleThreshold = messagesSinceLastCheck >= 3;

//     if (!isTerminalState && !isLowSignal && meetsThrottleThreshold) {
//       console.log(`🐢 [Intent Analysis] Requirements met. Triggering evaluation...`);
      
//       const historyStr = conversation.messages.slice(-6)
//         .map(m => `${m.sender === 'user' ? 'Customer' : 'Bot'}: ${m.text}`)
//         .join("\n");

//       aiService.analyzeLeadIntent(historyStr).then(async (analysis) => {
//         if (analysis) {
//           customer.intent = analysis.intent;
//           customer.leadScore = analysis.leadScore;
//           customer.lastAnalysisCount = customer.totalMessages; 
//           await customer.save();
//           console.log(`📊 [Intent Analysis Success] Updated: [${analysis.intent}]`);
//         }
//       }).catch(err => console.error("❌ [Intent Analysis Error]:", err.message));
//     } else {
//       await customer.save();
//     }

//   } catch (backgroundWorkerError) {
//     console.error("❌ Critical breakdown within async background thread system context:", backgroundWorkerError);
//   }
// }

// /**
//  * Main Webhook Input Gateway Controller
//  */
// async function incomingMsgs(req, res) {
//   try {
//     const rawFrom = req.body.From || ""; 
//     const rawTo = req.body.To || "";
//     const messageText = (req.body.Body || "").trim(); 
//     const cleanSenderPhone = rawFrom.replace('whatsapp:', '');
//     let cleanBusinessPhone = rawTo.replace('whatsapp:', '');
//     const whatsappName = req.body.ProfileName;

//     console.log(`\n📥 ================= NEW INCOMING MESSAGE =================`);
//     console.log(`📱 From (Customer): ${cleanSenderPhone} | 💬 Message: "${messageText}"`);

//     let user = null;
//     let activeSystemID = null;

//     if (cleanBusinessPhone === "+14155238886") {
//       const YOUR_REAL_BUSINESS_NUMBER = "+919871265404";
//       user = await User.findOne({ phoneNumber: YOUR_REAL_BUSINESS_NUMBER }) || await User.findOne({});
      
//       if (!user) {
//         user = await new User({
//           phoneNumber: "+14155238886",
//           name: "Sandbox Business",
//           expertSystemID: new mongoose.Types.ObjectId(),
//         }).save();
//       }
//       activeSystemID = user.expertSystemID || user._id;
//     } else {
//       user = await User.findOne({ phoneNumber: cleanBusinessPhone });
//       if (user) activeSystemID = user.expertSystemID || user._id;
//     }

//     if (!user || !activeSystemID) {
//       res.type('text/xml');
//       return res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Business routing account not found.</Message></Response>');
//     }

//     let conversation = await Conversation.findOne({ expertSystemID: activeSystemID, customerPhone: cleanSenderPhone });
//     if (!conversation) {
//       conversation = new Conversation({ expertSystemID: activeSystemID, customerPhone: cleanSenderPhone, messages: [] });
//     }
    
//     conversation.messages.push({ sender: "user", text: messageText, timestamp: new Date() });
//     await conversation.save();

//     let customer = await Customer.findOne({ expertSystemID: activeSystemID, phone: cleanSenderPhone });
//     if (!customer) {
//       const phoneDigits = cleanSenderPhone.replace(/[^0-9]/g, "");
//       const avatarIndex = Number(phoneDigits) % 5;
//       customer = new Customer({ 
//         expertSystemID: activeSystemID, 
//         phone: cleanSenderPhone,
//         name: whatsappName || "Anonymous Lead",
//         avatarSeed: avatarIndex
//       });
//     }
    
//     customer.totalMessages += 1;
//     customer.lastInteraction = new Date();

//     // PATHWAY A: Low-Signal Substring Filter Match
//     if (isLowSignalMessage(messageText)) {
//       console.log(`⚡ [Response Engine] Low-signal substring catch triggered. Fast delivery.`);
//       await customer.save();
//       return sendTwiMLReply(res, "Hey there! How can I help you with our business today?", conversation);
//     }

//     // PATHWAY B & C: Offloaded to background pipeline engine
//     console.log(`⏳ [Response Engine] Relaying to pipeline execution engine thread.`);
//     await customer.save();

//     // Release connection socket immediately back to Twilio to guarantee no 11200 timeouts
//     res.set('Content-Type', 'text/xml');
//     res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);

//     processSlowResponseInBackground({
//       messageText,
//       activeSystemID,
//       rawFrom,
//       rawTo,
//       conversation,
//       customer
//     });

//   } catch (error) {
//     console.error("💥 Critical Webhook processing system failure crash:", error);
//     res.set('Content-Type', 'text/xml');
//     return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>System exception encountered.</Message></Response>`);
//   }
// }

// module.exports = { incomingMsgs };

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

// Your actual business WhatsApp number (must be registered with Twilio)
// You need to register this number with Twilio for WhatsApp Business API
const BUSINESS_WHATSAPP_NUMBER = process.env.BUSINESS_WHATSAPP_NUMBER || "+918750685404";
const TWILIO_SANDBOX_NUMBER = "+14155238886";

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
 * Helper function to send outbound messages via Twilio REST API
 * This is critical for sending messages asynchronously
 */
async function sendOutboundMessage(to, from, body) {
  try {
    // Ensure proper WhatsApp number formatting
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
    
    console.log(`📤 Sending outbound message:`);
    console.log(`   From: ${formattedFrom}`);
    console.log(`   To: ${formattedTo}`);
    console.log(`   Body: ${body.substring(0, 50)}...`);

    // IMPORTANT: For WhatsApp Business API, the FROM number MUST be:
    // 1. A Twilio phone number that is WhatsApp-enabled
    // 2. Either the sandbox number (+14155238886) OR a number you've registered with Twilio
    
    const message = await twilioClient.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: body
    });

    console.log(`✅ Message sent successfully! SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    return message;
  } catch (error) {
    console.error(`❌ Failed to send outbound message:`, error);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Status: ${error.status}`);
    console.error(`   Error Message: ${error.message}`);
    
    // Special handling for spam filter errors
    if (error.code === 63015) {
      console.error(`   ⚠️ Message blocked by spam filter. This might happen if:`);
      console.error(`      - The content contains spam-like keywords`);
      console.error(`      - Too many messages sent in a short time`);
      console.error(`      - The number isn't properly registered for WhatsApp`);
    }
    throw error;
  }
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
    // Debug log to inspect active routing parameters
    console.log("DB Search Param ->", { 
      activeSystemID: activeSystemID.toString(), 
      messageText 
    });

    // 1. Execute Pipeline: Exact Text & Semantic Embeddings Tiers (FAQ search)
    console.log(`🔍 [Async Background] Running Multi-Tier Retrieval Pipeline for System ID: ${activeSystemID}...`);
    const pipelineResult = await retrieveAnswerPipeline(activeSystemID, messageText);

    let finalReply = null;

    if (pipelineResult && pipelineResult.found) {
      console.log(`🎯 [Async Background] Match resolved via verified pipeline tier: [${pipelineResult.source}]`);
      finalReply = pipelineResult.answer;
      
      // Save bot interaction history
      conversation.messages.push({ 
        sender: "bot", 
        text: finalReply,
        timestamp: new Date()
      });
      await conversation.save();

      // Dispatch messaging directly to client terminal via Twilio Outbound REST SDK
      // IMPORTANT: The FROM number must be your registered WhatsApp Business number
      // For sandbox testing, use the sandbox number: whatsapp:+14155238886
      // For production, use your registered number
      const fromNumber = rawTo || `whatsapp:${BUSINESS_WHATSAPP_NUMBER}`;
      
      await sendOutboundMessage(rawFrom, fromNumber, finalReply);
      console.log(`✉️ [Async Background] Verified pipeline answer delivered via Twilio REST SDK.`);
      
    } else {
      // 2. Fallback execution when DB/Ollama is bypassed
      console.log(`⚠️ [Async Background] Pipeline missed. Using fallback response.`);

      // Use a more business-appropriate fallback message
      const fallbackReply = "Thank you for reaching out! I'll connect you with our team shortly. In the meantime, could you please tell me more about what you're looking for?";

      // Save bot interaction history
      conversation.messages.push({ 
        sender: "bot", 
        text: fallbackReply,
        timestamp: new Date()
      });
      await conversation.save();

      // CRITICAL FIX: Use the dynamic business number, not hardcoded sandbox
      let businessNumber = rawTo;
      
      // If rawTo is empty or just the sandbox number, use the business number from user
      if (!businessNumber || businessNumber === `whatsapp:${TWILIO_SANDBOX_NUMBER}` || businessNumber === `+${TWILIO_SANDBOX_NUMBER}`) {
        // Get the user's actual business number from database
        const user = await User.findOne({ expertSystemID: activeSystemID });
        if (user && user.phoneNumber) {
          businessNumber = user.phoneNumber.startsWith('whatsapp:') 
            ? user.phoneNumber 
            : `whatsapp:${user.phoneNumber}`;
        } else {
          // Ultimate fallback - use environment variable
          businessNumber = `whatsapp:${BUSINESS_WHATSAPP_NUMBER}`;
        }
      }

      // Ensure the from number is properly formatted
      if (!businessNumber.startsWith('whatsapp:')) {
        businessNumber = `whatsapp:${businessNumber}`;
      }

      // Dispatch fallback response
      try {
        console.log("📤 Attempting outbound fallback message...");
        console.log(`   From: ${businessNumber}`);
        console.log(`   To: ${rawFrom}`);
        console.log(`   Body: ${fallbackReply.substring(0, 50)}...`);

        const result = await sendOutboundMessage(rawFrom, businessNumber, fallbackReply);
        
        console.log("✅ Fallback message sent successfully!");
        console.log(`   SID: ${result.sid}`);
        console.log(`   Status: ${result.status}`);

      } catch (twilioError) {
        console.error("❌ TWILIO SEND FAILED in fallback:", twilioError);
        console.error(`   Code: ${twilioError.code}`);
        console.error(`   Status: ${twilioError.status}`);
        console.error(`   Message: ${twilioError.message}`);
      }
    }

    // 3. Evaluate Lead Intent profiling triggers safely in background thread context
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
    console.error(`   Error: ${backgroundWorkerError.message}`);
    console.error(`   Stack: ${backgroundWorkerError.stack}`);
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
    console.log(`📱 From (Customer): ${cleanSenderPhone}`);
    console.log(`📱 To (Business): ${cleanBusinessPhone}`);
    console.log(`💬 Message: "${messageText}"`);

    let user = null;
    let activeSystemID = null;

    // FIXED: Use the correct business number
    if (cleanBusinessPhone === TWILIO_SANDBOX_NUMBER || cleanBusinessPhone === "14155238886") {
      // This is the sandbox number - find the user by their actual business number
      // In production, you should have a proper mapping
      const YOUR_REAL_BUSINESS_NUMBER = process.env.BUSINESS_WHATSAPP_NUMBER || "+918750685404";
      user = await User.findOne({ phoneNumber: YOUR_REAL_BUSINESS_NUMBER });
      
      if (!user) {
        // Create a default user if none exists
        user = await new User({
          phoneNumber: YOUR_REAL_BUSINESS_NUMBER,
          name: "Business Account",
          expertSystemID: new mongoose.Types.ObjectId(),
        }).save();
        console.log(`🆕 Created default user for business number: ${YOUR_REAL_BUSINESS_NUMBER}`);
      }
      activeSystemID = user.expertSystemID || user._id;
    } else {
      user = await User.findOne({ phoneNumber: cleanBusinessPhone });
      if (user) activeSystemID = user.expertSystemID || user._id;
    }

    if (!user || !activeSystemID) {
      console.error(`❌ Business routing account not found for phone: ${cleanBusinessPhone}`);
      res.type('text/xml');
      return res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Business routing account not found.</Message></Response>');
    }

    console.log(`✅ Found user: ${user.name} (ID: ${activeSystemID})`);

    let conversation = await Conversation.findOne({ expertSystemID: activeSystemID, customerPhone: cleanSenderPhone });
    if (!conversation) {
      conversation = new Conversation({ expertSystemID: activeSystemID, customerPhone: cleanSenderPhone, messages: [] });
      console.log(`🆕 New conversation created for customer: ${cleanSenderPhone}`);
    }
    
    conversation.messages.push({ sender: "user", text: messageText, timestamp: new Date() });
    await conversation.save();
    console.log(`💾 User message saved. Total messages: ${conversation.messages.length}`);

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
      console.log(`🆕 New customer created: ${customer.name}`);
    }
    
    customer.totalMessages += 1;
    customer.lastInteraction = new Date();
    await customer.save();

    // PATHWAY A: Low-Signal Substring Filter Match
    if (isLowSignalMessage(messageText)) {
      console.log(`⚡ [Response Engine] Low-signal substring catch triggered. Fast delivery.`);
      return sendTwiMLReply(res, "Hey there! How can I help you with our business today?", conversation);
    }

    // PATHWAY B & C: Offloaded to background pipeline engine
    console.log(`⏳ [Response Engine] Relaying to pipeline execution engine thread.`);

    // Release connection socket immediately back to Twilio to guarantee no 11200 timeouts
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);

    // Start background processing
    processSlowResponseInBackground({
      messageText,
      activeSystemID,
      rawFrom,
      rawTo,
      conversation,
      customer
    }).catch(err => {
      console.error("❌ Background process failed:", err);
    });

  } catch (error) {
    console.error("💥 Critical Webhook processing system failure crash:", error);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    res.set('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>System exception encountered.</Message></Response>`);
  }
}

module.exports = { incomingMsgs };