import OpenAI from 'openai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // System prompt defining the chatbot's role
    const systemPrompt = `You are an AI assistant for Harts Company Limited, a digital transformation company based in Cameroon. 

Company Overview:
- Specializes in software development, web/mobile apps, cloud solutions
- Provides business digitalization and automation services
- Offers consulting, training, and IT solutions
- Located in Mutengene, South West Region, Cameroon

Your role:
- Help visitors understand our services
- Answer questions about digital transformation
- Provide information about software development
- Guide potential clients on how we can help their business
- Be professional, friendly, and solution-oriented
- If asked about pricing or specific projects, encourage them to contact us directly

Keep responses concise, helpful, and focused on how technology can solve business problems.`;

    // Prepare messages for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;

    return res.status(200).json({ 
      reply,
      success: true 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return friendly error message
    return res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again.',
      details: error.message 
    });
  }
}
