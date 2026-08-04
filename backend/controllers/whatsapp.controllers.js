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

// Your actual business WhatsApp number
const BUSINESS_WHATSAPP_NUMBER = process.env.BUSINESS_WHATSAPP_NUMBER || "+919871265404"; // FIXED: Use your actual business number
const TWILIO_SANDBOX_NUMBER = "+14155238886";

/**
 * Upgraded Substring/Keyword checker that only matches whole words
 */
function isLowSignalMessage(text) {
  const normalizedText = normalize(text);
  if (!normalizedText) return true;

  const lowSignalPhrases = ["ok", "okay", "thanks", "thank you", "bye", "hi", "hello", "hey", "peeps"];
  
  const words = normalizedText.split(/\s+/);
  const isOnlyGreetings = words.every(word => lowSignalPhrases.includes(word));
  
  return isOnlyGreetings;
}

/**
 * Helper function to send immediate synchronous TwiML responses for fast-path matches
 */
async function sendTwiMLReply(res, replyText, conversation) {
  try {
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
  } catch (error) {
    console.error("❌ Error in sendTwiMLReply:", error);
    res.set('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Hello! How can I help you?</Message></Response>`);
  }
}

/**
 * Helper function to send outbound messages via Twilio REST API
 */
async function sendOutboundMessage(toNumber, fromNumber, body) {
  try {
    // CRITICAL: toNumber = customer, fromNumber = business
    const formattedTo = toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${toNumber}`;
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    
    console.log(`📤 Sending outbound message:`);
    console.log(`   From (Business): ${formattedFrom}`);
    console.log(`   To (Customer): ${formattedTo}`);
    console.log(`   Body: ${body.substring(0, 50)}...`);

    const message = await twilioClient.messages.create({
      from: formattedFrom,  // This MUST be your business number or sandbox
      to: formattedTo,      // This is the customer's number
      body: body
    });

    console.log(`✅ Message sent successfully! SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ Failed to send outbound message:`, error);
    throw error;
  }
}

/**
 * Background out-of-band processing worker 
 */
async function processSlowResponseInBackground({
  messageText,
  activeSystemID,
  customerPhone,    // The customer's phone number (recipient)
  businessPhone,    // Your business phone number (sender)
  conversation,
  customer
}) {
  try {
    console.log("DB Search Param ->", { 
      activeSystemID: activeSystemID.toString(), 
      messageText 
    });

    // 1. Execute Pipeline: Exact Text & Semantic Embeddings Tiers
    console.log(`🔍 [Async Background] Running Multi-Tier Retrieval Pipeline for System ID: ${activeSystemID}...`);
    const pipelineResult = await retrieveAnswerPipeline(activeSystemID, messageText);

    let finalReply = null;

    if (pipelineResult && pipelineResult.found) {
      console.log(`🎯 [Async Background] Match resolved via verified pipeline tier: [${pipelineResult.source}]`);
      finalReply = pipelineResult.answer;
      
      conversation.messages.push({ 
        sender: "bot", 
        text: finalReply,
        timestamp: new Date()
      });
      await conversation.save();

      // CRITICAL FIX: Send FROM business TO customer
      const fromNumber = TWILIO_SANDBOX_NUMBER;
      const toNumber = customerPhone;
      
      await sendOutboundMessage(toNumber, fromNumber, finalReply);
      console.log(`✉️ [Async Background] Answer delivered via Twilio REST SDK.`);
      
    } else {
      console.log(`⚠️ [Async Background] Pipeline missed. Using fallback.`);

      const fallbackReply = "Thank you for reaching out! I'll connect you with our team shortly. Could you please tell me more about what you're looking for?";

      conversation.messages.push({ 
        sender: "bot", 
        text: fallbackReply,
        timestamp: new Date()
      });
      await conversation.save();

      // CRITICAL FIX: Send FROM business TO customer
      try {
        const fromNumber = TWILIO_SANDBOX_NUMBER;
        const toNumber = customerPhone;
        
        console.log(`📤 Attempting outbound fallback message...`);
        console.log(`   From (Business): ${fromNumber}`);
        console.log(`   To (Customer): ${toNumber}`);
        
        await sendOutboundMessage(toNumber, fromNumber, fallbackReply);
        console.log("✅ Fallback message sent successfully!");
      } catch (twilioError) {
        console.error("❌ Failed to send fallback:", twilioError);
      }
    }

    // 3. Evaluate Lead Intent profiling
    const isTerminalState = ["Converted", "Spam"].includes(customer.intent);
    const isLowSignal = isLowSignalMessage(messageText);
    const messagesSinceLastCheck = customer.totalMessages - customer.lastAnalysisCount;
    const meetsThrottleThreshold = messagesSinceLastCheck >= 3;

    if (!isTerminalState && !isLowSignal && meetsThrottleThreshold) {
      console.log(`🐢 [Intent Analysis] Triggering evaluation...`);
      
      const historyStr = conversation.messages.slice(-6)
        .map(m => `${m.sender === 'user' ? 'Customer' : 'Bot'}: ${m.text}`)
        .join("\n");

      aiService.analyzeLeadIntent(historyStr).then(async (analysis) => {
        if (analysis) {
          customer.intent = analysis.intent;
          customer.leadScore = analysis.leadScore;
          customer.lastAnalysisCount = customer.totalMessages; 
          await customer.save();
          console.log(`📊 [Intent Analysis] Updated: [${analysis.intent}]`);
        }
      }).catch(err => console.error("❌ [Intent Analysis Error]:", err.message));
    } else {
      await customer.save();
    }

  } catch (backgroundWorkerError) {
    console.error("❌ Critical breakdown in background thread:", backgroundWorkerError);
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
    console.log(`📱 To (Business Raw): ${rawTo}`);
    console.log(`💬 Message: "${messageText}"`);

    // CRITICAL FIX: Determine the business number to use
    let businessSenderNumber = cleanBusinessPhone;
    
    // If the To is the sandbox number, use your actual business number
    if (cleanBusinessPhone === TWILIO_SANDBOX_NUMBER || 
        cleanBusinessPhone === "14155238886" || 
        cleanBusinessPhone === "+14155238886") {
      console.log(`🔄 Using sandbox, mapping to business number: ${BUSINESS_WHATSAPP_NUMBER}`);
      businessSenderNumber = BUSINESS_WHATSAPP_NUMBER;
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber: businessSenderNumber });
    
    if (!user) {
      console.log(`🆕 Creating new user for business number: ${businessSenderNumber}`);
      user = await new User({
        phoneNumber: businessSenderNumber,
        name: "Business Account",
        expertSystemID: new mongoose.Types.ObjectId(),
      }).save();
    }

    const activeSystemID = user.expertSystemID || user._id;
    console.log(`✅ Found user: ${user.name || 'Business'} (ID: ${activeSystemID})`);

    // Find or create conversation
    let conversation = await Conversation.findOne({ 
      expertSystemID: activeSystemID, 
      customerPhone: cleanSenderPhone 
    });
    
    if (!conversation) {
      conversation = new Conversation({ 
        expertSystemID: activeSystemID, 
        customerPhone: cleanSenderPhone, 
        messages: [] 
      });
      console.log(`🆕 New conversation created`);
    }
    
    conversation.messages.push({ 
      sender: "user", 
      text: messageText, 
      timestamp: new Date() 
    });
    await conversation.save();
    console.log(`💾 User message saved. Total messages: ${conversation.messages.length}`);

    // Find or create customer
    let customer = await Customer.findOne({ 
      expertSystemID: activeSystemID, 
      phone: cleanSenderPhone 
    });
    
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
      console.log(`⚡ [Response Engine] Low-signal detected. Fast delivery.`);
      return await sendTwiMLReply(res, "Hey there! How can I help you with our business today?", conversation);
    }

    // PATHWAY B & C: Offloaded to background pipeline engine
    console.log(`⏳ [Response Engine] Processing in background...`);

    // Send immediate empty response
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);

    // CRITICAL FIX: Pass separate customer and business numbers
    processSlowResponseInBackground({
      messageText,
      activeSystemID,
      customerPhone: cleanSenderPhone,    // The customer (TO)
      businessPhone: businessSenderNumber, // Your business (FROM)
      conversation,
      customer
    }).catch(err => {
      console.error("❌ Background process failed:", err);
    });

  } catch (error) {
    console.error("💥 Webhook error:", error);
    console.error(`   Message: ${error.message}`);
    res.set('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Hello! How can I help you?</Message></Response>`);
  }
}

module.exports = { incomingMsgs };