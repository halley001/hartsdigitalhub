/* ============================================================
   HARTS DIGITAL HUB — training.js
   AI Training Portal logic
   ============================================================ */

const STORAGE_KEY = 'hdh_ai_course';
const TOTAL_MODULES = 7;

/* ── Lesson content ───────────────────────────────────────── */
const lessons = {
  1: {
    title: 'What is Artificial Intelligence?',
    content: `
      <h3>Welcome to the Course</h3>
      <p>Artificial Intelligence (AI) is the ability of a computer system to perform tasks that normally require human intelligence — things like understanding language, recognising images, making decisions, and learning from experience.</p>
      <div class="highlight">💡 AI is not magic. It is mathematics and data working together at enormous scale.</div>
      <h3>A Brief History</h3>
      <p>The idea of intelligent machines dates back centuries, but modern AI began in the 1950s when mathematician Alan Turing asked: <em>"Can machines think?"</em> He proposed the Turing Test — if a machine can hold a conversation indistinguishable from a human, it demonstrates intelligence.</p>
      <p>Since then, AI has evolved through several stages:</p>
      <ul>
        <li><strong>1950s–70s:</strong> Rule-based systems and early research</li>
        <li><strong>1980s–90s:</strong> Expert systems used in industries</li>
        <li><strong>2000s:</strong> Machine learning becomes practical</li>
        <li><strong>2010s:</strong> Deep learning revolutionises AI</li>
        <li><strong>2020s:</strong> Large language models — ChatGPT, Claude, Gemini</li>
      </ul>
      <h3>Types of AI</h3>
      <p><strong>Narrow AI</strong> — designed for one specific task (e.g., face recognition, translation). This is all AI that exists today.</p>
      <p><strong>General AI</strong> — hypothetical AI that can perform any intellectual task a human can. Does not yet exist.</p>
      <p><strong>Superintelligent AI</strong> — hypothetical AI that surpasses human intelligence in all domains. A concept for the future.</p>
      <h3>AI in Africa & Cameroon</h3>
      <p>Africa is not left behind. From Kenya's M-PESA fraud detection to Nigerian agri-tech startups using AI to predict crop yields, AI is already solving African problems. In Cameroon, businesses are using AI for customer service, social media management, and data analysis.</p>
      <div class="highlight">🌍 The global AI market is worth over $200 billion. Learning AI now positions you for the future economy.</div>
    `,
    quiz: [
      {
        q: 'What did Alan Turing's "Turing Test" measure?',
        options: ['How fast a computer processes data', 'Whether a machine can converse indistinguishably from a human', 'The cost of building a computer', 'How many languages a computer speaks'],
        answer: 1
      },
      {
        q: 'Which type of AI exists today?',
        options: ['Superintelligent AI', 'General AI', 'Narrow AI', 'Universal AI'],
        answer: 2
      }
    ]
  },
  2: {
    title: 'How AI Models Think',
    content: `
      <h3>Inside the AI Brain</h3>
      <p>When you type a message to an AI chatbot and get an intelligent reply, what is actually happening? Understanding this helps you use AI more effectively.</p>
      <h3>Training Data</h3>
      <p>AI models learn from massive amounts of text — books, websites, articles, code, conversations — sometimes trillions of words. This is called <strong>training data</strong>. The model learns patterns, relationships between words, and how language is used.</p>
      <div class="highlight">📚 ChatGPT was trained on more text than a human could read in thousands of lifetimes.</div>
      <h3>What is a Token?</h3>
      <p>AI models do not read words — they read <strong>tokens</strong>, which are chunks of text. "Cameroon" might be one token. "artificial" might be two tokens: "artif" + "icial". Models process sequences of tokens to predict the next most likely token.</p>
      <h3>Large Language Models (LLMs)</h3>
      <p>Tools like ChatGPT, Claude, and Gemini are called <strong>Large Language Models</strong>. They work by:</p>
      <ul>
        <li>Taking your input (called a <em>prompt</em>)</li>
        <li>Processing it through billions of mathematical calculations (called <em>parameters</em>)</li>
        <li>Predicting the best sequence of words to reply with</li>
        <li>Generating that reply token by token</li>
      </ul>
      <h3>Popular Models Compared</h3>
      <ul>
        <li><strong>ChatGPT (OpenAI)</strong> — the most widely known; great for general tasks</li>
        <li><strong>Claude (Anthropic)</strong> — known for safety, reasoning, and long documents</li>
        <li><strong>Gemini (Google)</strong> — integrated with Google services, strong with search</li>
        <li><strong>Llama (Meta)</strong> — open source, can run on your own computer</li>
      </ul>
      <h3>Key Limitation</h3>
      <p>AI models do not "know" things the way humans do. They predict statistically likely responses. This is why they can sometimes produce confident-sounding but incorrect answers — called <strong>hallucinations</strong>. Always verify important information.</p>
    `,
    quiz: [
      {
        q: 'What are "tokens" in the context of AI language models?',
        options: ['Digital coins used to pay for AI', 'Chunks of text that AI models process', 'The number of users of an AI system', 'Security passwords for AI access'],
        answer: 1
      },
      {
        q: 'What is "hallucination" in AI?',
        options: ['When AI creates images', 'When AI generates confident but incorrect information', 'A feature that makes AI more creative', 'When AI cannot understand a question'],
        answer: 1
      }
    ]
  },
  3: {
    title: 'Prompt Engineering',
    content: `
      <h3>The Most Valuable AI Skill</h3>
      <p>A <strong>prompt</strong> is anything you type or say to an AI to get a response. Prompt engineering is the skill of crafting prompts that consistently produce the best results.</p>
      <div class="highlight">🎯 The quality of your output depends almost entirely on the quality of your input.</div>
      <h3>The Golden Rule</h3>
      <p>Be specific. Vague prompts get vague answers. Detailed prompts get detailed, useful answers.</p>
      <p><strong>Weak prompt:</strong> "Write about marketing."</p>
      <p><strong>Strong prompt:</strong> "Write a 200-word Instagram caption for a Cameroonian small business selling handmade jewellery. Tone: warm, feminine, with a call to action to DM us."</p>
      <h3>Prompt Techniques</h3>
      <p><strong>Zero-shot:</strong> Ask directly without examples. Works for simple tasks.</p>
      <p><strong>Few-shot:</strong> Give examples of what you want. The model learns the pattern from your examples.</p>
      <p><strong>Chain-of-thought:</strong> Tell the AI to think step by step. Add "Think step by step" or "Explain your reasoning" to get more accurate answers on complex tasks.</p>
      <p><strong>Role prompting:</strong> Assign the AI a role. "You are an expert accountant in Cameroon. Help me with..."</p>
      <h3>Prompt Templates for Business</h3>
      <ul>
        <li>📝 "Summarise this document in 5 bullet points: [paste text]"</li>
        <li>📧 "Write a professional email to a client explaining a delay. Tone: apologetic but confident."</li>
        <li>📱 "Generate 10 social media post ideas for a [type] business targeting [audience] in [city]."</li>
        <li>🤖 "Act as a customer service rep. Answer this complaint professionally: [complaint]"</li>
        <li>📊 "Analyse these sales figures and suggest 3 actions: [data]"</li>
      </ul>
      <h3>What to Avoid</h3>
      <ul>
        <li>Avoid ambiguous pronouns (it, they, this) without context</li>
        <li>Don't assume the AI knows your specific business</li>
        <li>Don't ask multiple unrelated questions in one prompt</li>
        <li>Avoid very short prompts for complex tasks</li>
      </ul>
    `,
    quiz: [
      {
        q: 'Which prompting technique involves giving the AI examples of the output you want?',
        options: ['Zero-shot prompting', 'Few-shot prompting', 'Chain-of-thought prompting', 'Role prompting'],
        answer: 1
      },
      {
        q: 'What does "chain-of-thought" prompting ask the AI to do?',
        options: ['Generate a chain of responses', 'Think step by step before answering', 'Use only one sentence', 'Search the internet'],
        answer: 1
      }
    ]
  },
  4: {
    title: 'AI Tools for Business',
    content: `
      <h3>The AI Toolkit</h3>
      <p>There are now thousands of AI tools. The key is knowing which tools to use for which job — and not trying to use every tool at once.</p>
      <h3>AI for Writing & Content</h3>
      <ul>
        <li><strong>ChatGPT / Claude</strong> — write articles, emails, proposals, captions, scripts</li>
        <li><strong>Copy.ai / Jasper</strong> — specialised for marketing copy</li>
        <li><strong>Grammarly</strong> — AI-powered writing improvement</li>
        <li><strong>Notion AI</strong> — AI built into your note-taking and project management</li>
      </ul>
      <h3>AI for Images & Design</h3>
      <ul>
        <li><strong>Canva AI</strong> — generate graphics, resize content, create presentations</li>
        <li><strong>DALL-E / Midjourney</strong> — generate custom images from text</li>
        <li><strong>Adobe Firefly</strong> — AI image editing built into Adobe tools</li>
        <li><strong>Remove.bg</strong> — instantly remove image backgrounds</li>
      </ul>
      <h3>AI for Video</h3>
      <ul>
        <li><strong>CapCut AI</strong> — auto-captions, background removal, video templates</li>
        <li><strong>Pictory</strong> — turn blog posts or scripts into videos automatically</li>
        <li><strong>HeyGen</strong> — create AI avatar videos with your script</li>
      </ul>
      <div class="highlight">🎥 You can create a professional marketing video in under 10 minutes with AI tools — no camera needed.</div>
      <h3>AI for Customer Service</h3>
      <ul>
        <li><strong>Tidio / Intercom</strong> — AI chatbots for your website</li>
        <li><strong>WhatsApp Business API + AI</strong> — automated, smart replies on WhatsApp</li>
        <li><strong>ChatGPT custom GPTs</strong> — train a chatbot on your own FAQ and products</li>
      </ul>
      <h3>Choosing the Right Tool</h3>
      <p>Ask yourself: What is the task? What is my budget? How much time will I save? Start with free tiers — most major AI tools offer free plans that are powerful enough for small businesses.</p>
    `,
    quiz: [
      {
        q: 'Which tool would you use to automatically remove an image background?',
        options: ['ChatGPT', 'Remove.bg', 'Grammarly', 'Notion AI'],
        answer: 1
      },
      {
        q: 'What can HeyGen help you create?',
        options: ['Social media schedules', 'AI avatar videos from a script', 'Email marketing campaigns', 'Website analytics'],
        answer: 1
      }
    ]
  },
  5: {
    title: 'AI Automation & Workflows',
    content: `
      <h3>Why Automation Matters</h3>
      <p>Automation means making your computer do repetitive tasks for you — automatically, without you clicking or typing each time. Combined with AI, automation becomes incredibly powerful.</p>
      <div class="highlight">⏱ A business owner who automates 3 hours of work per day saves over 700 hours per year.</div>
      <h3>What Can You Automate?</h3>
      <ul>
        <li>Posting to social media on a schedule</li>
        <li>Sending follow-up emails after someone fills a form</li>
        <li>Saving WhatsApp leads into a spreadsheet</li>
        <li>Generating weekly reports automatically</li>
        <li>Sorting and replying to emails by category</li>
        <li>Posting new products to multiple platforms at once</li>
      </ul>
      <h3>Make.com (formerly Integromat)</h3>
      <p>Make.com is a visual automation platform. You connect apps together using drag-and-drop "scenarios". For example:</p>
      <p><em>When someone fills my Google Form → Add them to my Google Sheet → Send them a welcome email → Add them to my WhatsApp group</em></p>
      <h3>Zapier</h3>
      <p>Zapier is similar to Make.com but simpler for beginners. It connects over 7,000 apps. A basic "Zap" has a trigger (something that starts it) and an action (something that happens as a result).</p>
      <h3>Building Your First Workflow</h3>
      <ul>
        <li><strong>Step 1:</strong> Identify your most repetitive task</li>
        <li><strong>Step 2:</strong> List the steps you do manually</li>
        <li><strong>Step 3:</strong> Find apps that handle each step</li>
        <li><strong>Step 4:</strong> Connect them in Make.com or Zapier</li>
        <li><strong>Step 5:</strong> Test with real data</li>
      </ul>
      <h3>AI + Automation = Superpower</h3>
      <p>Plug ChatGPT or Claude into your workflows to add intelligence. Example: when a customer sends a complaint → AI reads it and generates a personalised reply → automation sends the reply. No human needed.</p>
    `,
    quiz: [
      {
        q: 'In Zapier, what is a "trigger"?',
        options: ['A warning message in the app', 'Something that starts an automated workflow', 'A payment method', 'A type of AI model'],
        answer: 1
      },
      {
        q: 'Which platform uses a visual drag-and-drop "scenario" builder for automation?',
        options: ['ChatGPT', 'Canva', 'Make.com', 'Grammarly'],
        answer: 2
      }
    ]
  },
  6: {
    title: 'Ethics, Safety & AI Responsibility',
    content: `
      <h3>Using AI Wisely</h3>
      <p>AI is a powerful tool — like electricity or the internet. Used well, it transforms lives. Used carelessly, it can cause harm. This module helps you be a responsible AI user and citizen.</p>
      <h3>Bias in AI</h3>
      <p>AI learns from data created by humans. If that data reflects historical inequalities — racism, sexism, economic bias — the AI will reflect those too. Examples:</p>
      <ul>
        <li>Hiring AI that ranked men higher than women for technical jobs</li>
        <li>Face recognition that works poorly for darker skin tones</li>
        <li>Loan approval AI that discriminated against certain postcodes</li>
      </ul>
      <p>As an AI user, always ask: <em>"Could this tool be biased against certain groups?"</em></p>
      <div class="highlight">⚖ Bias is not a bug — it is often a feature of how data was collected. Awareness is the first defence.</div>
      <h3>Deepfakes & Misinformation</h3>
      <p>AI can now generate realistic fake videos, voices, and images of real people. These are called <strong>deepfakes</strong>. They are used to spread misinformation, scam people, and damage reputations.</p>
      <p>How to spot AI-generated content:</p>
      <ul>
        <li>Look for unnatural blinking or lip sync in videos</li>
        <li>Check lighting consistency and background distortions</li>
        <li>Use tools like Google Reverse Image Search</li>
        <li>Always verify news from multiple trusted sources</li>
      </ul>
      <h3>Privacy & Data</h3>
      <p>When you use AI tools, you often share personal data. Read terms of service. Never paste sensitive customer data, passwords, or financial information into public AI chatbots. Use enterprise versions with privacy guarantees for business-critical data.</p>
      <h3>Your Responsibilities as an AI User</h3>
      <ul>
        <li>✓ Be transparent when AI helped create your content</li>
        <li>✓ Verify AI-generated facts before sharing them</li>
        <li>✓ Do not use AI to deceive, impersonate, or harm others</li>
        <li>✓ Respect intellectual property and copyright</li>
        <li>✓ Report harmful AI outputs to the platforms</li>
      </ul>
    `,
    quiz: [
      {
        q: 'Where does AI bias typically come from?',
        options: ['Intentional programming by developers', 'Historical inequalities reflected in training data', 'The speed of the computer processor', 'Poor internet connection'],
        answer: 1
      },
      {
        q: 'What should you NOT do when using public AI chatbots?',
        options: ['Ask for writing help', 'Paste sensitive customer data or passwords', 'Generate social media content', 'Translate documents'],
        answer: 1
      }
    ]
  },
  7: {
    title: 'Final Project & Certification',
    content: `
      <h3>Congratulations — You Made It!</h3>
      <p>You have completed all six learning modules of the Harts Digital Hub AI Course. This final module is your opportunity to consolidate what you have learned, pass a short quiz, and earn your certificate.</p>
      <h3>Course Review</h3>
      <ul>
        <li>✅ <strong>Module 1:</strong> AI is about computers doing human-intelligence tasks, built on data and mathematics.</li>
        <li>✅ <strong>Module 2:</strong> LLMs like ChatGPT learn from massive text datasets and generate responses token by token.</li>
        <li>✅ <strong>Module 3:</strong> Prompt engineering — being specific, using few-shot and chain-of-thought techniques — is the core skill for using AI effectively.</li>
        <li>✅ <strong>Module 4:</strong> AI tools for writing, design, video, and customer service can save hours and grow your business.</li>
        <li>✅ <strong>Module 5:</strong> Automation platforms like Make.com and Zapier, combined with AI, create powerful hands-free workflows.</li>
        <li>✅ <strong>Module 6:</strong> Responsible AI use means understanding bias, avoiding deepfakes, protecting privacy, and being transparent.</li>
      </ul>
      <h3>Your AI Action Plan</h3>
      <p>Before you download your certificate, commit to three actions:</p>
      <ul>
        <li>🎯 Pick ONE AI tool you will use this week for your business or studies</li>
        <li>📝 Write ONE prompt template that solves a real problem you have</li>
        <li>🤝 Share ONE thing you learned with someone in your network</li>
      </ul>
      <div class="highlight">🎓 Complete the quiz below to unlock your personalised certificate. Passing score: 70% (7 out of 10 correct).</div>
    `,
    quiz: [
      {
        q: 'What does "narrow AI" refer to?',
        options: ['AI that only works on narrow screens', 'AI designed for one specific task', 'AI that uses fewer data', 'AI used only in developing countries'],
        answer: 1
      },
      {
        q: 'What is a "hallucination" in AI?',
        options: ['A visual effect in image generation', 'When AI generates confident but incorrect information', 'When an AI model crashes', 'A feature that makes AI more creative'],
        answer: 1
      },
      {
        q: 'Which technique gives the AI examples of your desired output?',
        options: ['Zero-shot prompting', 'Role prompting', 'Few-shot prompting', 'Chain-of-thought'],
        answer: 2
      },
      {
        q: 'Which tool helps remove image backgrounds instantly?',
        options: ['Zapier', 'Remove.bg', 'Tidio', 'Make.com'],
        answer: 1
      },
      {
        q: 'In automation, what is a "trigger"?',
        options: ['A security feature', 'Something that starts an automated workflow', 'A type of AI model', 'A payment method'],
        answer: 1
      },
      {
        q: 'Where does AI bias most commonly originate?',
        options: ['Power outages', 'Historical inequalities in training data', 'Too many users at once', 'Slow internet speeds'],
        answer: 1
      },
      {
        q: 'What is a "deepfake"?',
        options: ['A very large AI model', 'AI-generated realistic fake media of real people', 'A type of encryption', 'A deep learning framework'],
        answer: 1
      },
      {
        q: 'Which is a responsible AI practice?',
        options: ['Sharing AI-generated facts without checking them', 'Pasting customer passwords into AI chatbots', 'Being transparent when AI helped create your content', 'Using AI to impersonate others'],
        answer: 2
      },
      {
        q: 'What does "LLM" stand for?',
        options: ['Local Learning Machine', 'Large Language Model', 'Linear Logic Method', 'Linked List Module'],
        answer: 1
      },
      {
        q: 'Which platform uses visual "scenarios" for automation?',
        options: ['ChatGPT', 'Canva', 'Grammarly', 'Make.com'],
        answer: 3
      }
    ]
  }
};

/* ── State helpers ────────────────────────────────────────── */
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let currentModule = null;
let quizAnswers = {};

/* ── Init on page load ────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  if (state.name) {
    showEnrolledUI();
  }
  renderModuleStates();
  setupEnrollForm();
});

function showEnrolledUI() {
  const section = document.getElementById('tr-progress-section');
  section.style.display = 'flex';
  document.getElementById('tr-welcome-name').textContent = `Welcome back, ${state.name}`;
  updateProgress();

  // Hide form, show success if already enrolled
  document.getElementById('tr-enroll-form').style.display = 'none';
  document.getElementById('tr-enroll-success').style.display = 'block';
}

function updateProgress() {
  const completed = (state.completed || []).length;
  const pct = Math.round((completed / TOTAL_MODULES) * 100);
  document.getElementById('tr-progress-bar').style.width = pct + '%';
  document.getElementById('tr-progress-label').textContent = `${completed} / ${TOTAL_MODULES} modules complete`;

  if (completed === TOTAL_MODULES) {
    document.getElementById('tr-cert-btn').style.display = 'inline-block';
  }
}

function renderModuleStates() {
  const completed = state.completed || [];
  completed.forEach(num => {
    const card = document.querySelector(`[data-module="${num}"]`);
    if (card) {
      card.classList.add('completed');
      const btn = card.querySelector('.tr-module-btn');
      if (btn) btn.textContent = 'Review';
    }
  });
}

/* ── Enroll form ──────────────────────────────────────────── */
function setupEnrollForm() {
  const form = document.getElementById('tr-enroll-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateEnrollForm()) return;

    const name = document.getElementById('enroll-name').value.trim();
    const email = document.getElementById('enroll-email').value.trim();
    const phone = document.getElementById('enroll-phone').value.trim();
    const country = document.getElementById('enroll-country').value;

    state = { ...state, name, email, phone, country, completed: state.completed || [], enrolledAt: Date.now() };
    saveState(state);

    showEnrolledUI();
    renderModuleStates();
    downloadStarterGuide();

    document.getElementById('tr-enroll-form').style.display = 'none';
    document.getElementById('tr-enroll-success').style.display = 'block';
  });
}

function validateEnrollForm() {
  let valid = true;
  const name = document.getElementById('enroll-name').value.trim();
  const email = document.getElementById('enroll-email').value.trim();
  const phone = document.getElementById('enroll-phone').value.trim();

  document.getElementById('err-name').textContent = '';
  document.getElementById('err-email').textContent = '';
  document.getElementById('err-phone').textContent = '';

  if (name.length < 2) { document.getElementById('err-name').textContent = 'Please enter your full name.'; valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('err-email').textContent = 'Please enter a valid email.'; valid = false; }
  if (phone.replace(/\D/g, '').length < 7) { document.getElementById('err-phone').textContent = 'Please enter a valid phone number.'; valid = false; }

  return valid;
}

/* ── Starter Guide PDF (generated client-side) ────────────── */
function downloadStarterGuide() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1697; // A4 ratio
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1200, 1697);

  // Border
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 1140, 1637);

  // Header band
  ctx.fillStyle = '#fff';
  ctx.fillRect(30, 30, 1140, 8);

  // Logo area
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('HARTS DIGITAL HUB', 80, 100);
  ctx.fillStyle = '#666';
  ctx.font = '18px monospace';
  ctx.fillText('hartsdigitalhub.com', 80, 130);

  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('AI Starter', 80, 280);
  ctx.fillText('Guide', 80, 370);

  ctx.fillStyle = '#444';
  ctx.font = '22px monospace';
  ctx.fillText('Everything you need to know to begin your AI journey', 80, 430);

  // Divider
  ctx.fillStyle = '#222';
  ctx.fillRect(80, 460, 1040, 1);

  // Content sections
  const sections = [
    { title: '01 — What is AI?', body: 'AI is the ability of computer systems to perform tasks that normally require human intelligence — language, vision, decision-making, learning.' },
    { title: '02 — Why AI Matters Now', body: 'The AI market is worth $200B+. Every industry is being transformed. Learning AI now gives you a competitive edge in any career or business.' },
    { title: '03 — 5 AI Tools to Start With', body: 'ChatGPT (writing), Canva AI (design), CapCut AI (video), Remove.bg (images), Make.com (automation). All have free plans.' },
    { title: '04 — Your First Prompt', body: 'Try: "You are a business advisor in Cameroon. I run a [business type]. Give me 5 low-cost marketing ideas for this week."' },
    { title: '05 — AI Safety Rules', body: 'Never paste passwords or sensitive data. Verify AI facts. Be transparent when AI helped you. Protect your privacy.' },
    { title: '06 — Next Steps', body: 'Complete all 7 modules at hartsdigitalhub.com/training to earn your AI certificate. Join our WhatsApp community for daily tips.' },
  ];

  let y = 510;
  sections.forEach(s => {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(s.title, 80, y);
    y += 36;
    ctx.fillStyle = '#aaa';
    ctx.font = '20px monospace';
    // Wrap text
    const words = s.body.split(' ');
    let line = '';
    const maxWidth = 1040;
    words.forEach(word => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 80, y);
        y += 28;
        line = word + ' ';
      } else {
        line = test;
      }
    });
    ctx.fillText(line, 80, y);
    y += 50;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(80, y - 10, 1040, 1);
    y += 20;
  });

  // Footer
  ctx.fillStyle = '#333';
  ctx.font = '18px monospace';
  ctx.fillText('© 2026 Harts Digital Hub Cameroon — hartsdigitalhub.com/training', 80, 1640);

  // Download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HDH-AI-Starter-Guide.png';
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ── Lesson modal ─────────────────────────────────────────── */
function openLesson(num) {
  if (!state.name) {
    document.getElementById('enroll').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  currentModule = num;
  quizAnswers = {};
  const lesson = lessons[num];

  document.getElementById('lesson-num-label').textContent = `Module ${num} of ${TOTAL_MODULES}`;
  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-content').innerHTML = lesson.content;

  renderQuiz(num);

  const backdrop = document.getElementById('tr-lesson-backdrop');
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLesson() {
  const backdrop = document.getElementById('tr-lesson-backdrop');
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentModule = null;
}

function renderQuiz(num) {
  const lesson = lessons[num];
  const quizEl = document.getElementById('lesson-quiz');

  if (!lesson.quiz || lesson.quiz.length === 0) {
    quizEl.style.display = 'none';
    return;
  }

  quizEl.style.display = 'block';
  quizEl.innerHTML = `<p class="tr-quiz-title">Knowledge Check</p>`;

  lesson.quiz.forEach((q, qi) => {
    const qEl = document.createElement('div');
    qEl.className = 'tr-quiz-q';
    qEl.innerHTML = `<p>${qi + 1}. ${q.q}</p><div class="tr-quiz-options"></div><div class="tr-quiz-result" id="qres-${num}-${qi}"></div>`;

    const opts = qEl.querySelector('.tr-quiz-options');
    q.options.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'tr-quiz-option';
      btn.textContent = opt;
      btn.onclick = () => answerQuiz(num, qi, oi, q.answer, btn, opts, qEl);
      opts.appendChild(btn);
    });

    quizEl.appendChild(qEl);
  });
}

function answerQuiz(moduleNum, qi, chosen, correct, btn, opts, qEl) {
  if (quizAnswers[`${moduleNum}-${qi}`] !== undefined) return;
  quizAnswers[`${moduleNum}-${qi}`] = chosen;

  Array.from(opts.children).forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add('correct');
    showQuizResult(moduleNum, qi, true);
  } else {
    btn.classList.add('wrong');
    opts.children[correct].classList.add('correct');
    showQuizResult(moduleNum, qi, false);
  }
}

function showQuizResult(moduleNum, qi, correct) {
  const el = document.getElementById(`qres-${moduleNum}-${qi}`);
  el.style.display = 'block';
  el.textContent = correct ? '✓ Correct!' : '✗ Not quite — review the lesson content above.';
  el.style.color = correct ? '#4ade80' : '#f87171';
}

function completeLesson() {
  if (!currentModule) return;

  const completed = state.completed || [];
  if (!completed.includes(currentModule)) {
    completed.push(currentModule);
    state.completed = completed;
    saveState(state);
  }

  const card = document.querySelector(`[data-module="${currentModule}"]`);
  if (card) {
    card.classList.add('completed');
    const btn = card.querySelector('.tr-module-btn');
    if (btn) btn.textContent = 'Review';
  }

  updateProgress();

  if (completed.length === TOTAL_MODULES) {
    closeLesson();
    setTimeout(() => {
      document.getElementById('tr-progress-section').scrollIntoView({ behavior: 'smooth' });
    }, 300);
    return;
  }

  closeLesson();
}

/* ── Certificate generator ────────────────────────────────── */
function generateCertificate() {
  const canvas = document.getElementById('cert-canvas');
  const ctx = canvas.getContext('2d');
  const name = state.name || 'Learner';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1200, 850);

  // Black border
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1200, 850);
  ctx.fillStyle = '#fff';
  ctx.fillRect(12, 12, 1176, 826);

  // Inner border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 790);

  // Top accent bar
  ctx.fillStyle = '#000';
  ctx.fillRect(30, 30, 1140, 60);

  // Issuer in top bar
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HARTS DIGITAL HUB  ·  hartsdigitalhub.com', 600, 68);

  // Certificate of Completion
  ctx.fillStyle = '#000';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', 600, 160);

  // Decorative line
  ctx.fillStyle = '#000';
  ctx.fillRect(350, 175, 500, 2);

  // "This certifies that"
  ctx.fillStyle = '#555';
  ctx.font = '18px monospace';
  ctx.fillText('This certifies that', 600, 230);

  // Recipient name
  ctx.fillStyle = '#000';
  ctx.font = 'bold 58px serif';
  ctx.fillText(name, 600, 310);

  // Name underline
  ctx.fillStyle = '#000';
  ctx.fillRect(200, 325, 800, 2);

  // "has successfully completed"
  ctx.fillStyle = '#555';
  ctx.font = '18px monospace';
  ctx.fillText('has successfully completed all 7 modules of', 600, 375);

  // Course name
  ctx.fillStyle = '#000';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('AI Fundamentals for Business', 600, 430);

  // Course description
  ctx.fillStyle = '#777';
  ctx.font = '16px monospace';
  ctx.fillText('Prompt Engineering · AI Tools · Automation · AI Ethics', 600, 468);

  // Divider
  ctx.fillStyle = '#ddd';
  ctx.fillRect(80, 510, 1040, 1);

  // Bottom: date + signature areas
  ctx.fillStyle = '#000';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Date of Completion', 150, 570);
  ctx.font = '20px serif';
  ctx.fillText(date, 150, 600);

  ctx.textAlign = 'right';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Authorised by', 1050, 570);
  ctx.font = 'bold 22px serif';
  ctx.fillStyle = '#000';
  ctx.fillText('Harts Digital Hub', 1050, 600);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#999';
  ctx.fillText('Director, Training & Education', 1050, 622);

  // Signature lines
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, 608); ctx.lineTo(380, 608); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(820, 608); ctx.lineTo(1100, 608); ctx.stroke();

  // Bottom seal area
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(600, 680, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HDH', 600, 672);
  ctx.font = '10px monospace';
  ctx.fillText('CERTIFIED', 600, 690);

  // Certificate ID
  const certId = 'HDH-AI-' + (state.enrolledAt || Date.now()).toString(36).toUpperCase();
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText(`Certificate ID: ${certId}`, 600, 780);

  // Download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HDH-AI-Certificate-${name.replace(/\s+/g, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ── Close modal on backdrop click ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tr-lesson-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLesson();
  });
});

/* ── Keyboard: Esc closes lesson ──────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLesson();
});
