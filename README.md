# 🤖 Replyly — AI WhatsApp Business Assistant & FAQ Engine

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![Express](https://img.shields.io/badge/Express-4.x-000000)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-47A248)
![License](https://img.shields.io/badge/License-MIT-blue)

**Replyly** is a hybrid RAG (Retrieval-Augmented Generation) WhatsApp support engine designed to handle customer queries with sub-second response times. It combines instant low-signal phrase matching, vector embedding similarity search, and an asynchronous Ollama LLM fallback worker.

---

## 🎯 Features & Core Capabilities

- ⚡ **Low-Signal Fast Response:** Instant TwiML response for high-frequency greetings (`hi`, `hello`, `thanks`) to eliminate redundant LLM calls.
- 🎯 **Tier 1 — Exact & Substring FAQ Match:** Immediate database lookup for direct rule matching on configured FAQs.
- 📐 **Tier 2 — Vector Search & Keyword Overlap Bonus:** Cosine-similarity evaluation using local embeddings generated via Ollama with fallback word-intersection scoring.
- 🦙 **Tier 3 — Async Ollama Fallback Worker:** Unattended complex questions are passed asynchronously to local LLM engines (Ollama / Llama / Mistral) and saved for manual approval via the AI Control Dashboard.
- 📱 **Twilio WhatsApp Webhook Integration:** Asynchronous architecture returning instant HTTP `200 OK` / TwiML responses to Twilio while background workers handle heavy AI processing out-of-band.
- 🏢 **Multi-System Profile Config:** Configurable business profile context for products, services, return & shipping policies, and brand tone settings.

---

## 🏗️ Architecture Flow


```

┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  WhatsApp User  │ ────► │ Twilio Webhook  │ ────► │ Express WhatsApp Ctrl  │
└─────────────────┘       └─────────────────┘       └────────────────────────┘
│
┌─────────────────┴─────────────────┐
▼                                   ▼
[Low-Signal Greeting?]                [Complex Query?]
│                                   │
(Instant TwiML)                 (Async Process Worker)
│                                   │
▼                                   ▼
Fast Reply Sent                Multi-Tier RAG Pipeline
│
┌───────────────────────────┼───────────────────────────┐
▼                           ▼                           ▼
Tier 1: Exact Match      Tier 2: Vector Search      Tier 3: Ollama LLM
(FAQ DB Lookup)         (Cosine Similarity)        (Saved for Approval)

```

---

## 📁 Project Structure


```

whatsappAIassistant/
│
├── backend/
│   ├── config/              # Database connection & env setups
│   ├── controllers/
│   │   └── whatsapp.controller.js  # Main incoming message webhook logic
│   ├── models/
│   │   ├── FAQ.js           # FAQ database schema with vector embeddings
│   │   ├── AIKnowledge.js   # Approved AI response storage
│   │   └── ExpertSystem.js  # Business profile configuration
│   ├── services/
│   │   ├── retrieval.service.js  # 3-Tier RAG Pipeline execution engine
│   │   ├── embedding.service.js  # Ollama embedding generator
│   │   └── ai.services.js        # Ollama LLM completion handler
│   ├── utils/
│   │   ├── normalize.js          # String normalization utility
│   │   └── cosineSimilarity.js   # Vector math scoring
│   ├── seedData.js               # Business profile seed dataset
│   └── server.js                 # Express server entry point
│
└── frontend/                # Replyly React Dashboard
├── src/
│   ├── pages/           # AI Control, FAQs, Expert System
│   └── components/      # UI elements & tables

```

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose) with Vector Embeddings
- **AI & RAG Engine:** Ollama (Local Embeddings & LLM Context Generation)
- **Messaging Service:** Twilio REST SDK & Webhooks
- **Frontend:** React.js, TailwindCSS / UI Components

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB instance
- Local [Ollama](https://ollama.com/) instance running (`ollama run nomic-embed-text` and `ollama run llama3`)
- Twilio Account with WhatsApp Sandbox configured

### 2. Installation & Setup

```bash
# Clone the repository
git clone [https://github.com/yourusername/whatsappAIassistant.git](https://github.com/yourusername/whatsappAIassistant.git)
cd whatsappAIassistant/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

```

### 3. Environment Variables (`backend/.env`)

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
OLLAMA_BASE_URL=http://localhost:11434

```

### 4. Seed Business Profile FAQs & Embeddings

```bash
node seedScript.js

```

### 5. Running Locally

```bash
# Start backend server
npm run dev

```

---

## 🔧 Core API Routes

### WhatsApp Webhook

```http
POST /api/whatsapp/webhook

```

Receives incoming Twilio WhatsApp payloads, processes low-signal greetings immediately, and hands heavy queries off to the background retrieval worker thread.

---

## 🛡️ License

This project is licensed under the MIT License.
