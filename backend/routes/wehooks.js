// routes/webhooks.js
import express from 'express';
import Lead from '../models/Lead.js';
import Message from '../models/Message.js';
import googleSheets from '../services/googleSheets.js';

const router = express.Router();

router.post('/twilio/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body;
    const phone = From.replace('whatsapp:', '');
    
    // Find or create lead
    let lead = await Lead.findOne({ phone });
    
    if (!lead) {
      lead = new Lead({
        phone,
        firstMessage: Body,
        lastActive: new Date(),
        leadSource: 'WhatsApp',
        status: 'New'
      });
      await lead.save();
      
      // Sync to Google Sheets
      await googleSheets.appendLead(lead);
    } else {
      lead.lastActive = new Date();
      if (lead.status === 'New') lead.status = 'Engaged';
      await lead.save();
    }
    
    // Save message
    const message = new Message({
      leadId: lead._id,
      text: Body,
      sender: 'user',
      createdAt: new Date()
    });
    await message.save();
    
    // Process with your AI/FAQ system here
    // const botResponse = await processMessage(Body);
    
    // Save bot response
    // const botMessage = new Message({
    //   leadId: lead._id,
    //   text: botResponse.text,
    //   sender: 'bot',
    //   messageType: botResponse.type,
    //   faqMatched: botResponse.faqMatched,
    //   confidence: botResponse.confidence,
    //   isUpsell: botResponse.isUpsell,
    //   failedMatch: botResponse.failedMatch
    // });
    // await botMessage.save();
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});