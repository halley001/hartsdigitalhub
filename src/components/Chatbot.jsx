import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! 👋 I\'m your AI assistant from Harts Company. How can I help you with digital transformation today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome notification when page loads
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome) {
      // Show welcome after 2 seconds
      const timer = setTimeout(() => {
        setShowWelcome(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
        
        // Auto-hide welcome after 10 seconds
        setTimeout(() => {
          setShowWelcome(false);
        }, 10000);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Use local response logic (works without API)
      const messageCount = messages.filter(msg => msg.role === 'user').length;
      const userMessageLower = userMessage.toLowerCase();
      
      // Predefined responses
      const responses = {
        services: {
          keywords: ['service', 'services', 'offer', 'what do you do', 'what can you do', 'provide'],
          answer: "We offer a comprehensive range of digital services:\n\n Software Development - Custom applications tailored to your needs\n📱 Mobile & Web Apps - User-friendly solutions for any device\n Cloud Solutions - Scalable and secure cloud infrastructure\n Business Automation - Streamline your operations with smart automation\n Digital Transformation - Complete business digitalization\n🎓 Training & Consulting - Expert guidance for your team\n\nWhich service interests you most?"
        },
        digitalTransformation: {
          keywords: ['digital transformation', 'digitalization', 'digitization', 'modernize', 'transform'],
          answer: "Digital transformation is about modernizing your business using technology! 🚀\n\nWe help you:\n✅ Automate manual processes\n✅ Move from paper to digital systems\n✅ Improve customer experience\n✅ Enable remote work capabilities\n✅ Use data for better decisions\n✅ Stay competitive in the digital age\n\nThis means faster operations, reduced costs, and happier customers. What aspect of your business would you like to transform?"
        },
        helpBusiness: {
          keywords: ['help my business', 'help me', 'my business', 'my company', 'grow', 'improve'],
          answer: "I'd love to help your business succeed! 🎯\n\nWe can assist with:\n💡 Efficiency - Automate repetitive tasks\n💰 Cost Reduction - Optimize your operations\n📈 Growth - Scale your business with technology\n🔒 Security - Protect your data and systems\n🌐 Online Presence - Reach more customers\n\nEvery business is unique. Could you tell me a bit about your industry or specific challenges?"
        },
        project: {
          keywords: ['project', 'build', 'create', 'develop', 'need', 'want to', 'custom', 'app', 'website'],
          answer: "Exciting! We'd love to work on your project! 🎨\n\nOur development process:\n1️⃣ Consultation - Understand your vision\n2️⃣ Planning - Create detailed specifications\n3️⃣ Development - Build with latest technologies\n4️⃣ Testing - Ensure quality and reliability\n5️⃣ Deployment - Launch your solution\n6️⃣ Support - Ongoing maintenance and updates\n\nWhat kind of project do you have in mind?"
        },
        training: {
          keywords: ['training', 'teach', 'learn', 'course', 'education', 'workshop'],
          answer: "Yes! We provide comprehensive training programs! 📚\n\nTraining Areas:\n💻 Software Development\n🌐 Web Technologies\n📱 Mobile App Development\n☁️ Cloud Computing\n🤖 AI & Automation\n📊 Data Analytics\n\nTraining Formats:\n👥 Corporate workshops\n🏫 Group sessions\n👤 One-on-one coaching\n🌍 Online & In-person\n\nWhat would you like to learn?"
        },
        pricing: {
          keywords: ['price', 'cost', 'how much', 'pricing', 'rate', 'budget', 'expensive', 'cheap', 'fee', 'charge'],
          answer: "Great question! Our pricing depends on several factors:\n\n📋 Project scope and complexity\n⏱️ Timeline requirements\n👥 Team size needed\n🛠️ Technologies used\n📞 Support level\n\nWe offer flexible pricing models:\n💼 Fixed-price projects\n⏰ Hourly rates\n📅 Monthly retainers\n\nI'd recommend we discuss your specific needs to provide an accurate quote. Would you like to share your contact information so we can prepare a detailed proposal?"
        },
        location: {
          keywords: ['location', 'where', 'address', 'office', 'find you', 'based', 'cameroon'],
          answer: "📍 We're located in Mutengene, South West Region, Cameroon.\n\nWe serve clients:\n🇨🇲 Locally in Cameroon\n🌍 Across Africa\n🌐 Internationally\n\nWe're equipped for remote collaboration, so distance is never a barrier! Where are you based?"
        },
        contact: {
          keywords: ['contact', 'reach', 'call', 'email', 'get in touch', 'phone number', 'speak to'],
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
      let newContactInfo = null;
      
      // Check if user is providing contact information
      const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1]?.content?.toLowerCase() : '';
      
      // Handle contact info collection
      if (lastMessage.includes("what's your name") || lastMessage.includes("your name?")) {
        const name = userMessage.trim();
        reply = `Nice to meet you, ${name}! 😊 To send you detailed information and follow up on your inquiry, could I please have your email address?`;
        newContactInfo = { name, email: '', phone: '', company: '' };
        setVisitorInfo({ name, email: '', phone: '', company: '' });
      } else if (lastMessage.includes("email") && emailMatch) {
        const email = emailMatch[0];
        const name = visitorInfo?.name || 'there';
        reply = `Perfect! Thank you, ${name}. I've got your contact information. Our team will reach out to you shortly. In the meantime, feel free to ask me any questions about our services! 🚀`;
        newContactInfo = { 
          name: name, 
          email, 
          phone: '', 
          company: '' 
        };
        setVisitorInfo({ name, email, phone: '', company: '' });
        
        // Send to email endpoint
        try {
          await fetch('/api/send-visitor-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              phone: '',
              company: '',
              timestamp: new Date().toISOString(),
              chatHistory: newMessages
            }),
          });
        } catch (err) {
          console.log('Email endpoint not available in dev mode');
        }
      } else if (emailMatch && !visitorInfo?.name) {
        const email = emailMatch[0];
        reply = `Thank you for sharing your email! Could I also get your name so we can personalize our communication?`;
        setVisitorInfo({ name: '', email, phone: '', company: '' });
      } else {
        // Find matching response
        let matched = false;
        let shouldAskForContact = false;
        
        for (const [key, response] of Object.entries(responses)) {
          if (response.keywords.some(keyword => userMessageLower.includes(keyword))) {
            reply = response.answer;
            matched = true;
            
            if (messageCount >= 2 && !visitorInfo && (key === 'project' || key === 'pricing' || key === 'contact')) {
              shouldAskForContact = true;
            }
            break;
          }
        }
        
        if (!matched) {
          if (messageCount === 0) {
            reply = "Hello! 👋 I'm your AI assistant from Harts Company Limited. We specialize in digital transformation and software development in Cameroon. What would you like to know about our services?";
          } else {
            reply = "That's a great question! While I'm still learning, here's what I can help you with:\n\n🔹 Our services and solutions\n🔹 Digital transformation benefits\n🔹 Project development process\n🔹 Training programs\n🔹 Pricing information\n🔹 How to get in touch\n\nWhat would you like to explore?";
          }
        }
        
        if (shouldAskForContact && !visitorInfo) {
          reply += "\n\n💡 I'd love to provide you with more personalized information. What's your name?";
        }
      }
      
      // Simulate a slight delay for more natural feel
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again!' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    'What services do you offer?',
    'Tell me about digital transformation',
    'How can you help my business?',
    'I\'d like to discuss a project'
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!contactFormData.name || !contactFormData.email) {
      alert('Please fill in at least your name and email');
      return;
    }

    setIsLoading(true);
    
    try {
      // Send visitor info to email endpoint
      const response = await fetch('/api/send-visitor-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactFormData,
          timestamp: new Date().toISOString(),
          chatHistory: messages
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVisitorInfo(contactFormData);
        setShowContactForm(false);
        setMessages([...messages, {
          role: 'assistant',
          content: `Thank you, ${contactFormData.name}! Your information has been received. How can I assist you today?`
        }]);
      } else {
        alert('Failed to submit information. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Connection error. Your chat will continue, but we may not have your contact info.');
      setShowContactForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactFormChange = (e) => {
    setContactFormData({
      ...contactFormData,
      [e.target.name]: e.target.value
    });
  };

  const promptForContactInfo = () => {
    setShowContactForm(true);
  };

  return (
    <>
      {/* Welcome Notification */}
      {showWelcome && !isOpen && (
        <div className="welcome-notification">
          <div className="welcome-content">
            <div className="welcome-icon">👋</div>
            <div className="welcome-text">
              <strong>Welcome to Harts Company!</strong>
              <p>Need help? I'm here to assist you with digital transformation.</p>
            </div>
            <button 
              className="welcome-close"
              onClick={() => setShowWelcome(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <button 
            className="welcome-cta"
            onClick={() => {
              setShowWelcome(false);
              setIsOpen(true);
            }}
          >
            Start Chat 💬
          </button>
        </div>
      )}

      {/* Chatbot Toggle Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>Harts AI Assistant</h3>
              <span className="status-indicator">● Online</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
          </div>

          {/* Contact Form Modal */}
          {showContactForm && (
            <div className="contact-form-overlay">
              <div className="contact-form-modal">
                <h3>👋 Let's Get Connected!</h3>
                <p>Share your details so we can better assist you</p>
                <form onSubmit={handleContactFormSubmit}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={contactFormData.name}
                      onChange={handleContactFormChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactFormChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactFormData.phone}
                      onChange={handleContactFormChange}
                      placeholder="+237 XXX XXX XXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      name="company"
                      value={contactFormData.company}
                      onChange={handleContactFormChange}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowContactForm(false)} className="btn-secondary">
                      Skip
                    </button>
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                      {isLoading ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <button 
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="quick-action-btn"
                >
                  {action}
                </button>
              ))}
              {!visitorInfo && (
                <button 
                  onClick={promptForContactInfo}
                  className="quick-action-btn contact-btn"
                >
                  📧 Share Contact Info
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              {isLoading ? '...' : '➤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
