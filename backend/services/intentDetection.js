//basic impleementation of the function - have to customise it further according to the needs. 

export function detectIntent(message) {

  const msg = message.toLowerCase();

  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
    return { intent: "greeting", confidence: 0.9 };
  }

  if (msg.includes("price") || msg.includes("cost") || msg.includes("charge")) {
    return { intent: "pricing_query", confidence: 0.85 };
  }

  if (msg.includes("demo") || msg.includes("trial")) {
    return { intent: "demo_request", confidence: 0.9 };
  }

  if (msg.includes("problem") || msg.includes("issue") || msg.includes("not working")) {
    return { intent: "technical_support", confidence: 0.8 };
  }

  if (msg.includes("bye") || msg.includes("goodbye")) {
    return { intent: "goodbye", confidence: 0.9 };
  }

  return { intent: "unknown", confidence: 0.3 };
}