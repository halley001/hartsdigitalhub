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
    const { message, conversationHistory = [], visitorInfo = null } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messageCount = conversationHistory.filter(msg => msg.role === 'user').length;
    const userMessage = message.toLowerCase();

    // Predefined Q&A patterns
    const responses = {
      services: {
        keywords: ['service', 'services', 'offer', 'what do you do', 'what can you do', 'provide'],
        answer: "We offer a comprehensive range of digital services:\n\n🖥️ **Software Development** - Custom applications tailored to your needs\n📱 **Mobile & Web Apps** - User-friendly solutions for any device\n☁️ **Cloud Solutions** - Scalable and secure cloud infrastructure\n🤖 **Business Automation** - Streamline your operations with smart automation\n📊 **Digital Transformation** - Complete business digitalization\n🎓 **Training & Consulting** - Expert guidance for your team\n\nWhich service interests you most?"
      },
      digitalTransformation: {
        keywords: ['digital transformation', 'digitalization', 'digitization', 'modernize', 'transform business'],
        answer: "Digital transformation is about modernizing your business using technology! 🚀\n\nWe help you:\n✅ Automate manual processes\n✅ Move from paper to digital systems\n✅ Improve customer experience\n✅ Enable remote work capabilities\n✅ Use data for better decisions\n✅ Stay competitive in the digital age\n\nThis means faster operations, reduced costs, and happier customers. What aspect of your business would you like to transform?"
      },
      helpBusiness: {
        keywords: ['help my business', 'help me', 'my business', 'my company', 'grow business', 'improve business'],
        answer: "I'd love to help your business succeed! 🎯\n\nWe can assist with:\n💡 **Efficiency** - Automate repetitive tasks\n💰 **Cost Reduction** - Optimize your operations\n📈 **Growth** - Scale your business with technology\n🔒 **Security** - Protect your data and systems\n🌐 **Online Presence** - Reach more customers\n\nEvery business is unique. Could you tell me a bit about your industry or specific challenges?"
      },
      project: {
        keywords: ['project', 'build', 'create', 'develop', 'need', 'want to create', 'custom'],
        answer: "Exciting! We'd love to work on your project! 🎨\n\nOur development process:\n1️⃣ **Consultation** - Understand your vision\n2️⃣ **Planning** - Create detailed specifications\n3️⃣ **Development** - Build with latest technologies\n4️⃣ **Testing** - Ensure quality and reliability\n5️⃣ **Deployment** - Launch your solution\n6️⃣ **Support** - Ongoing maintenance and updates\n\nWhat kind of project do you have in mind?"
      },
      training: {
        keywords: ['training', 'teach', 'learn', 'course', 'education', 'workshop'],
        answer: "Yes! We provide comprehensive training programs! 📚\n\n**Training Areas:**\n💻 Software Development\n🌐 Web Technologies\n📱 Mobile App Development\n☁️ Cloud Computing\n🤖 AI & Automation\n📊 Data Analytics\n\n**Training Formats:**\n👥 Corporate workshops\n🏫 Group sessions\n👤 One-on-one coaching\n🌍 Online & In-person\n\nWhat would you like to learn?"
      },
      pricing: {
        keywords: ['price', 'cost', 'how much', 'pricing', 'rate', 'budget', 'expensive', 'cheap', 'fee'],
        answer: "Great question! Our pricing depends on several factors:\n\n📋 Project scope and complexity\n⏱️ Timeline requirements\n👥 Team size needed\n🛠️ Technologies used\n📞 Support level\n\nWe offer flexible pricing models:\n💼 Fixed-price projects\n⏰ Hourly rates\n📅 Monthly retainers\n\nI'd recommend we discuss your specific needs to provide an accurate quote. Would you like to share your contact information so we can prepare a detailed proposal?"
      },
      location: {
        keywords: ['location', 'where', 'address', 'office', 'find you', 'based', 'cameroon'],
        answer: "📍 We're located in **Mutengene, South West Region, Cameroon**.\n\nWe serve clients:\n🇨🇲 Locally in Cameroon\n🌍 Across Africa\n🌐 Internationally\n\nWe're equipped for remote collaboration, so distance is never a barrier! Where are you based?"
      },
      contact: {
        keywords: ['contact', 'reach', 'call', 'email', 'get in touch', 'phone number'],
        answer: "I'd be happy to connect you with our team! 📞\n\nLet me collect your information so we can reach out to you promptly. What's your name?"
      },
      greeting: {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
        answer: "Hello! 👋 Welcome to Harts Company Limited! I'm here to help you learn about our digital transformation services. What brings you here today?"
      },
      thanks: {
        keywords: ['thank', 'thanks', 'appreciate', 'grateful'],
        answer: "You're very welcome! 😊 Is there anything else you'd like to know about our services?"
      }
    };

    let reply = "";
    let contactInfo = null;
    let shouldAskForContact = false;

    // Check if user is providing contact information
    const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = userMessage.match(/[\d\s\+\-\(\)]{8,}/);
    
    // Track what info we're collecting
    const awaitingName = conversationHistory.length > 0 && 
                         (conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase().includes("what's your name") ||
                         conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase().includes("may i have your name"));
    
    const awaitingEmail = conversationHistory.length > 0 && 
                          conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase().includes("email");

    // Handle contact info collection
    if (awaitingName && !emailMatch) {
      const name = message.trim();
      reply = `Nice to meet you, ${name}! 😊 To send you detailed information and follow up on your inquiry, could I please have your email address?`;
      contactInfo = { name, email: '', phone: '', company: '' };
    } else if (awaitingEmail && emailMatch) {
      const email = emailMatch[0];
      const previousName = visitorInfo?.name || 'there';
      reply = `Perfect! Thank you, ${previousName}. I've got your contact information. Our team will reach out to you shortly. In the meantime, feel free to ask me any questions about our services! 🚀`;
      contactInfo = { 
        name: previousName, 
        email, 
        phone: phoneMatch ? phoneMatch[0] : '', 
        company: '' 
      };
    } else if (emailMatch && userMessage.includes(emailMatch[0])) {
      // User provided email without being asked
      const email = emailMatch[0];
      reply = `Thank you for sharing your email! Could I also get your name so we can personalize our communication?`;
      contactInfo = { name: '', email, phone: phoneMatch ? phoneMatch[0] : '', company: '' };
    } else {
      // Find matching response based on keywords
      let matched = false;
      
      for (const [key, response] of Object.entries(responses)) {
        if (response.keywords.some(keyword => userMessage.includes(keyword))) {
          reply = response.answer;
          matched = true;
          
          // After 2-3 messages, ask for contact info if discussing projects/pricing
          if (messageCount >= 2 && !visitorInfo && (key === 'project' || key === 'pricing' || key === 'contact')) {
            shouldAskForContact = true;
          }
          break;
        }
      }
      
      // Default response if no match
      if (!matched) {
        if (messageCount === 0) {
          reply = "Hello! 👋 I'm your AI assistant from Harts Company Limited. We specialize in digital transformation and software development in Cameroon. What would you like to know about our services?";
        } else {
          reply = "That's a great question! While I'm still learning, here's what I can help you with:\n\n🔹 Our services and solutions\n🔹 Digital transformation benefits\n🔹 Project development process\n🔹 Training programs\n🔹 Pricing information\n🔹 How to get in touch\n\nWhat would you like to explore?";
        }
      }
    }

    // Ask for contact info after providing detailed answers
    if (shouldAskForContact && !visitorInfo) {
      reply += "\n\n💡 I'd love to provide you with more personalized information. What's your name?";
    }

    return res.status(200).json({ 
      reply,
      contactInfo,
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
