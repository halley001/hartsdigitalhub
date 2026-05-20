import { useState, useRef, useEffect } from 'react';
import './HartsChat.css';

// ─── Suggestion prompts ────────────────────────────────────────────────────
const SUGGESTIONS = [
  'What services does Harts Digital Hub offer?',
  'I need a website or web application',
  'Tell me about mobile app development',
  'I need cybersecurity services',
  'Tell me about your cloud solutions',
  "I'm interested in SaaS development",
  'How do I get a project quote?',
  'How do I contact the team?',
];

// ─── Response knowledge base ───────────────────────────────────────────────
const RESPONSES = [
  {
    id: 'webDev',
    keywords: ['web development', 'website', 'web app', 'web application', 'e-commerce', 'ecommerce', 'cms', 'progressive web', 'pwa', 'landing page'],
    answer: "Our **Web Development** service covers the full spectrum of web solutions:\n\n- Custom websites and web applications\n- E-commerce platforms\n- Content Management Systems (CMS)\n- Progressive Web Apps (PWAs)\n\nWe build to your exact specifications with a focus on performance, security, and scalability. Our team would be happy to review your project requirements.",
    cta: true,
  },
  {
    id: 'mobile',
    keywords: ['mobile app', 'mobile development', 'ios app', 'android app', 'react native', 'flutter', 'cross-platform app', 'mobile solution', 'mobile application'],
    answer: "Our **Mobile App Development** team delivers high-quality applications across all major platforms:\n\n- Native iOS and Android development\n- Cross-platform solutions with React Native and Flutter\n- Enterprise mobile applications\n\nWe manage the full lifecycle from concept through to deployment and ongoing support. Our team is ready to discuss your mobile project.",
    cta: true,
  },
  {
    id: 'uiux',
    keywords: ['ui/ux', 'ui ux', 'ux design', 'ui design', 'user interface', 'user experience', 'wireframe', 'prototype', 'interface design', 'product design'],
    answer: "Our **UI/UX Design** service creates intuitive, user-centred digital experiences:\n\n- User research and analysis\n- Wireframing and interactive prototyping\n- High-fidelity interface design\n- Design systems and component libraries\n\nGood design underpins every successful product. Our team would be glad to discuss your design requirements.",
    cta: true,
  },
  {
    id: 'consulting',
    keywords: ['it consulting', 'technology strategy', 'digital transformation', 'system audit', 'infrastructure planning', 'tech consulting', 'modernise', 'modernize', 'legacy system'],
    answer: "Our **IT Consulting** service helps organisations make informed, strategic technology decisions:\n\n- Technology strategy and roadmapping\n- Digital transformation planning\n- System audits and assessments\n- Infrastructure planning and optimisation\n\nWhether you are modernising legacy systems or building a new digital strategy, our consultants are ready to guide the process.",
    cta: true,
  },
  {
    id: 'cybersecurity',
    keywords: ['cybersecurity', 'cyber security', 'penetration test', 'vulnerability assessment', 'data protection', 'security audit', 'information security', 'it security', 'network security'],
    answer: "Our **Cybersecurity** service protects your organisation against evolving digital threats:\n\n- Vulnerability assessments\n- Penetration testing\n- Security audits and compliance reviews\n- Data protection strategies\n\nCybersecurity is not optional — it is a business imperative. Our team can assess and strengthen your current security posture.",
    cta: true,
  },
  {
    id: 'cloud',
    keywords: ['cloud solution', 'cloud service', 'cloud computing', 'aws', 'azure', 'gcp', 'google cloud', 'devops', 'cloud migration', 'cloud architecture', 'managed cloud'],
    answer: "Our **Cloud Solutions** service covers the full cloud lifecycle:\n\n- Cloud migration and strategy\n- Cloud architecture design\n- DevOps and CI/CD pipeline implementation\n- Managed cloud services across AWS, GCP, and Azure\n\nWe help organisations move to the cloud with confidence and operate efficiently once there.",
    cta: true,
  },
  {
    id: 'saas',
    keywords: ['saas', 'software as a service', 'multi-tenant', 'saas product', 'saas development', 'saas platform', 'subscription platform', 'build a product'],
    answer: "Our **SaaS Development** team builds scalable, production-ready software products:\n\n- Custom SaaS platform development\n- Multi-tenant architecture design\n- Subscription and billing system integration\n- Ongoing product support and iteration\n\nIf you have a SaaS idea or want to productise an existing internal solution, our team can take you from concept to market.",
    cta: true,
  },
  {
    id: 'marketing',
    keywords: ['digital marketing', 'seo', 'search engine optimisation', 'search engine optimization', 'google ads', 'meta ads', 'social media marketing', 'content marketing', 'paid advertising'],
    answer: "Our **Digital Marketing** service drives measurable online growth:\n\n- Search Engine Optimisation (SEO)\n- Google and Meta paid advertising\n- Social media strategy and management\n- Content marketing\n\nWe align every initiative with your business objectives to deliver results you can measure.",
    cta: true,
  },
  {
    id: 'services',
    keywords: ['what services', 'services do you', 'services you offer', 'what do you offer', 'what do you do', 'what can you do', 'services you provide', 'list of services', 'all services', 'your services'],
    answer: "Harts Digital Hub offers eight core services:\n\n**Web Development** — Custom websites, web apps, e-commerce, and PWAs\n**Mobile App Development** — iOS, Android, and cross-platform solutions\n**UI/UX Design** — User research, wireframing, prototyping, and interface design\n**IT Consulting** — Technology strategy, digital transformation, and infrastructure planning\n**Cybersecurity** — Vulnerability assessments, penetration testing, and data protection\n**Cloud Solutions** — Cloud migration, architecture, DevOps, and managed cloud (AWS, GCP, Azure)\n**SaaS Development** — Custom SaaS platforms with multi-tenant architecture\n**Digital Marketing** — SEO, paid advertising, social media, and content marketing\n\nWhich of these is most relevant to your needs?",
    cta: false,
  },
  {
    id: 'helpBusiness',
    keywords: ['help my business', 'help my company', 'how can you help', 'grow my business', 'improve my business', 'transform my business'],
    answer: "Harts Digital Hub can support your organisation across multiple areas depending on your goals:\n\n- **Web & Mobile Development** if you need a digital presence or custom tools\n- **IT Consulting** if you are planning a digital transformation or infrastructure upgrade\n- **Cybersecurity** if protecting your data and systems is a priority\n- **Cloud Solutions** if you need scalable, modern infrastructure\n- **Digital Marketing** if you want to reach more customers online\n\nEvery engagement begins with a consultation. Our team would be happy to recommend the right approach for your specific context.",
    cta: true,
  },
  {
    id: 'project',
    keywords: ['have a project', 'discuss a project', 'start a project', 'work together', 'hire you', 'work with you', 'need help with', 'looking to build', 'want to build', 'i need a', 'we need a'],
    answer: "We would be glad to hear about your project. Every engagement at Harts Digital Hub begins with a brief consultation to understand your requirements, goals, and timeline.\n\nFrom there, our team prepares a detailed proposal covering scope, approach, and investment.",
    cta: true,
  },
  {
    id: 'about',
    keywords: ['who are you', 'about harts', 'about the company', 'about digital hub', 'what is harts', 'who is harts', 'what company', 'tell me about'],
    answer: "Harts Digital Hub is a full-service IT solutions company headquartered in Cameroon, delivering high-quality digital services to businesses and organisations across the globe.\n\nOur mission is to bridge the digital gap through innovative, reliable, and scalable technology solutions. We serve both local and international clients across a wide range of industries.\n\nIs there a specific service you would like to learn more about?",
    cta: false,
  },
  {
    id: 'pricing',
    keywords: ['price', 'cost', 'how much', 'pricing', 'rate', 'budget', 'fee', 'quote', 'proposal', 'estimate', 'charge'],
    answer: "Pricing at Harts Digital Hub is tailored to the scope, complexity, and timeline of each engagement. We do not apply fixed rates, as every project is unique.\n\nTo receive an accurate quote, we recommend a brief consultation with our team. They will review your requirements and prepare a detailed proposal.",
    cta: true,
  },
  {
    id: 'location',
    keywords: ['where are you', 'your address', 'cameroon', 'your location', 'office location', 'based in', 'where is harts', 'headquarters'],
    answer: "Harts Digital Hub is headquartered in Cameroon and serves clients worldwide. We operate fully remotely for international engagements, so geography is never a barrier.\n\nIf you would like to speak with our team directly, they are available through the contact page.",
    cta: true,
  },
  {
    id: 'contact',
    keywords: ['contact', 'reach out', 'get in touch', 'speak to', 'talk to', 'connect with', 'reach the team'],
    answer: "Our team would be happy to assist you directly.\n\nYou may reach us through either of the following channels and we will respond promptly.",
    cta: true,
  },
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    answer: "Welcome. I am H@rts, the official assistant for Harts Digital Hub.\n\nI am here to answer questions about our services, team, and approach. How may I assist you today?",
    cta: false,
  },
  {
    id: 'thanks',
    keywords: ['thank you', 'thanks', 'appreciate', 'grateful'],
    answer: "You are welcome. Is there anything else I can assist you with regarding Harts Digital Hub?",
    cta: false,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Word-boundary-aware match for short keywords to avoid partial collisions. */
function matchesKeyword(text, keyword) {
  if (keyword.length <= 4) {
    return new RegExp(`\\b${keyword}\\b`, 'i').test(text);
  }
  return text.includes(keyword);
}

function resolveResponse(text) {
  const lower = text.toLowerCase();
  for (const entry of RESPONSES) {
    if (entry.keywords.some((kw) => matchesKeyword(lower, kw))) {
      return { content: entry.answer, cta: entry.cta };
    }
  }
  return {
    content:
      "I am here exclusively to assist with questions about Harts Digital Hub — our services, approach, and how to get in touch.\n\nCould you clarify your question, or would you like an overview of what we offer?",
    cta: false,
  };
}

function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Render a single line of text, converting **bold** markers to <strong>. */
function renderLine(line, idx) {
  if (!line.trim()) return <p key={idx} className="hc-line-spacer" />;
  const parts = line.split(/\*\*(.+?)\*\*/g);
  return (
    <p key={idx}>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </p>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

const WELCOME_MESSAGE = {
  id: 0,
  role: 'assistant',
  content:
    "I am H@rts — the official assistant for Harts Digital Hub.\n\nHarts Digital Hub is a full-service IT solutions company headquartered in Cameroon, delivering web development, mobile apps, cybersecurity, cloud solutions, and more to clients worldwide.\n\nHow may I assist you today?",
  timestamp: new Date(),
  cta: false,
};

export default function HartsChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function adjustHeight() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setSuggestionsVisible(false);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      cta: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    // Simulate processing delay for natural feel
    await new Promise((resolve) => setTimeout(resolve, 650));

    const result = resolveResponse(trimmed);
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: result.content,
      timestamp: new Date(),
      cta: result.cta,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="hc-root">
      {/* ── Top bar ── */}
      <header className="hc-topbar">
        <div className="hc-topbar-left">
          <div className="hc-logo-mark" aria-hidden="true">HD</div>
          <div className="hc-brand">
            <span className="hc-brand-name">Harts Digital Hub</span>
            <span className="hc-brand-domain">hartsdigitalhub.com</span>
          </div>
        </div>
        <div className="hc-topbar-right">
          <div className="hc-status" aria-label="H@rts is online">
            <span className="hc-status-dot" aria-hidden="true" />
            <span className="hc-status-label">H@rts online</span>
          </div>
          <a href="/" className="hc-back-link">← Back to website</a>
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="hc-messages" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((msg) => (
          <div key={msg.id} className={`hc-msg hc-msg--${msg.role}`}>
            <div className="hc-msg-avatar" aria-hidden="true">
              {msg.role === 'assistant' ? <span>H@</span> : <span>&gt;_</span>}
            </div>
            <div className="hc-msg-body">
              <div className="hc-msg-meta">
                <span className="hc-msg-role">{msg.role === 'assistant' ? 'H@rts' : 'You'}</span>
                <span className="hc-msg-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="hc-msg-bubble">
                {msg.content.split('\n').map((line, i) => renderLine(line, i))}
              </div>
              {msg.cta && (
                <div className="hc-cta-buttons">
                  <a
                    href="https://hartsdigitalhub.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hc-cta-btn hc-cta-whatsapp"
                  >
                    WhatsApp
                  </a>
                  <a
                    href="https://hartsdigitalhub.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hc-cta-btn hc-cta-email"
                  >
                    Email
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="hc-msg hc-msg--assistant" aria-label="H@rts is typing">
            <div className="hc-msg-avatar" aria-hidden="true"><span>H@</span></div>
            <div className="hc-msg-body">
              <div className="hc-msg-meta">
                <span className="hc-msg-role">H@rts</span>
              </div>
              <div className="hc-msg-bubble hc-msg-bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {suggestionsVisible && (
          <div className="hc-suggestions" role="group" aria-label="Suggested questions">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="hc-suggestion-btn"
                onClick={() => sendMessage(s)}
                tabIndex={0}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ── Input ── */}
      <footer className="hc-input-area">
        <form
          className="hc-input-form"
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        >
          <span className="hc-prompt-symbol" aria-hidden="true">❯</span>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Harts Digital Hub..."
            disabled={isLoading}
            rows={1}
            className="hc-textarea"
            aria-label="Message input"
          />
          <button
            type="submit"
            className="hc-send-btn"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        </form>
        <p className="hc-footer-note">
          H@rts only answers questions about Harts Digital Hub · hartsdigitalhub.com
        </p>
      </footer>
    </div>
  );
}
