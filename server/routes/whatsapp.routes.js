// const qrcode = require('qrcode-terminal'); 
// const {Client, LocalAuth} = require('whatsapp-web.js'); 

// //creates a client 
// const whatsapp = new Client({
//     authStrategy: new LocalAuth()
// })

// //listen for various events 
// whatsapp.on('qr' , qr => {
//     qrcode.generate(qr, {
//         small:true 
//     })
// })


// // Listen for QR code
// whatsapp.on('qr', qr => {
//     console.log('\n=== SCAN THIS QR CODE WITH WHATSAPP ===');
//     console.log('1. Open WhatsApp on your phone');
//     console.log('2. Go to Menu → Linked Devices → Link a Device');
//     console.log('3. Scan the QR code below:\n');
//     qrcode.generate(qr, { small: true });
//     console.log('\nWaiting for scan...');
// });

// // Listen for authentication
// whatsapp.on('authenticated', () => {
//     console.log('✓ Authentication successful!');
// });

// // Listen for ready
// whatsapp.on('ready', () => {
//     console.log('✓ WhatsApp client is ready!');
//     console.log('You can now receive and send messages.');
    
//     // Optional: Send a test message to yourself
//     // const yourNumber = "919876543210@c.us"; // Replace with your number
//     // whatsapp.sendMessage(yourNumber, "WhatsApp Web.js is connected!");
// });

// whatsapp.on('message' , async message => {
//     if (message.body.toLowerCase().includes('hello')) {
//         await message.reply('Hello! How can I help you?');
//     }
// }); 

// whatsapp.initialize()

// whatsapp.routes.js (Twilio Version)
const express = require("express");
const router = express.Router();
const { handleIncomingMessage } = require("../controllers/whatsapp.controllers");

router.post("/webhook", handleIncomingMessage);

module.exports = router;
