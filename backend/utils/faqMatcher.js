function matchFAQ(message, faqs) {
    if (!message || !faqs || faqs.length === 0) return null;
    const lowerMessage = message.toLowerCase();
    let matchedFaqs = [] ; 

    for (const faq of faqs) {
      for (const keyword of faq.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          matchedFaqs.push(faq); 
          break; 
        }
      }
    }

    if(matchedFaqs.length === 0) return null; 
    matchedFaqs.sort((a, b) => b.priority - a.priority);

    return matchedFaqs[0].answer;
}

module.exports = matchFAQ;
