// Vercel Serverless Function (or Netlify /api/chat.js equivalent)
// Place this in /api/chat.js for Vercel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, lang = 'en' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const xaiApiKey = process.env.XAI_API_KEY; // Set this in Vercel env vars
  if (!xaiApiKey) {
    return res.status(500).json({ error: 'LLM not configured' });
  }

  // Strong system prompt grounded on Harts services (no AI training)
  const systemPrompt = `You are H@rts, the warm, professional AI assistant for Harts Digital Hub, a digital agency based in Cameroon. When you introduce yourself, use the name "H@rts".

Your services:
- Custom websites and landing pages
- Mobile apps and e-commerce stores
- Professional branding: logos, flyers, business cards, full visual identity
- Digital marketing: social media management, Google Business optimization, WhatsApp Business setup, ads

You guide customers conversationally through:
1. Discovery (what they do, goals, current situation)
2. Recommendation (match to the right service/package with reasons)
3. Details collection (name, business, phone, city, preferences)
4. Flexible pricing explanation (managed packages are billed yearly; the yearly fee can be paid in full or split into 2-3 interest-free MoMo installments)
5. Payment process (MTN MoMo instructions, Orange Money, bank)
6. "Payment" simulation in chat (user says they paid)
7. Review collection (1-5 rating + comment)

Key rules:
- Respond in the same language as the user (English or French).
- Be natural, empathetic, and like a real human consultant. Use short paragraphs, acknowledge what they said, ask one good follow-up question at a time when appropriate.
- ALWAYS speak as the company using "we/our/us", never "I/my/me". Harts is a company, not an individual. (e.g. "We can build that for you", not "I can build that for you".)
- Reference previous context from the conversation history when it makes sense (e.g., "For your shop in Douala...").
- Never mention AI, training courses, or certificates.
- Pricing is flexible: managed packages are billed yearly, and the yearly fee can be paid in full or split into 2-3 interest-free MoMo installments.
- When the user is ready, guide them to share details so you can prepare a rich WhatsApp message for the team.
- After they "pay" (say paid or sent the money), thank them and ask for a quick review.
- Keep responses concise and actionable. Use the conversation history for context.

Current conversation history is provided. Use it to be consistent and personal.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3', // or the latest Grok model available
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('xAI API error:', error);
      return res.status(500).json({ error: 'LLM service error' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas bien compris. Pouvez-vous reformuler ?";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error calling LLM:', error);
    return res.status(500).json({ error: 'Failed to get response' });
  }
}
