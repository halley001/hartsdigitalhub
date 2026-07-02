/* ============================================================
   HARTS — training.js
   AI Training Portal · 10 modules · Gold certificate
   ============================================================ */

const STORAGE_KEY = 'hdh_ai_course';
const TOTAL_MODULES = 10;

/* ── Lesson content ───────────────────────────────────────── */
const lessons = {

  1: {
    title: 'What is Artificial Intelligence?',
    content: `
      <h3>Let's start simple</h3>
      <p>Artificial Intelligence — AI — is the ability of a computer to do things that normally only a human brain can do. Things like understanding what you say, recognising your face in a photo, translating a language, or recommending a song you might like.</p>
      <div class="highlight">💡 AI is not a robot. It is not magic. It is a computer program that has been taught to think in a certain way — using millions of examples.</div>
      <h3>A short history</h3>
      <p>The idea of "thinking machines" has been around for centuries. But modern AI really started in the 1950s when a British mathematician named Alan Turing asked a simple question: <em>"Can machines think?"</em></p>
      <p>Since then, AI has grown in stages:</p>
      <ul>
        <li><strong>1950s–1970s:</strong> Scientists tried to teach computers rules manually. Very slow progress.</li>
        <li><strong>1980s–1990s:</strong> "Expert systems" helped doctors and engineers make decisions.</li>
        <li><strong>2000s:</strong> Computers got fast enough to learn from data on their own — called machine learning.</li>
        <li><strong>2010s:</strong> Deep learning arrived. Computers could now recognise images, translate speech, and play chess better than any human.</li>
        <li><strong>2020s:</strong> ChatGPT, Claude, Gemini — AI that can hold full conversations, write essays, and help run businesses.</li>
      </ul>
      <h3>Types of AI that exist today</h3>
      <p><strong>Narrow AI</strong> is AI built for one specific job — like the face ID on your phone, the spam filter in your email, or the recommendation algorithm on YouTube. This is the only type of AI that exists today.</p>
      <p><strong>General AI</strong> would be AI that can do any thinking task a human can. This does not exist yet, but researchers are working on it.</p>
      <p><strong>Superintelligence</strong> is a concept of AI smarter than all humans combined. This is still science fiction.</p>
      <div class="highlight">🌍 AI in your daily life: MTN's fraud detection, M-Pesa's transaction security, Google Translate helping you read a French document, and WhatsApp's spam filter are all AI.</div>
      <h3>AI in Africa and Cameroon</h3>
      <p>Africa is not behind on AI — it is building its own path. In Nigeria, AI is helping farmers predict crop yields. In Kenya, AI diagnoses eye diseases in rural clinics. In Cameroon, businesses are using AI chatbots for customer service and AI tools to manage social media.</p>
      <p>The global AI economy is worth over $200 billion and growing fast. Understanding AI now gives you an advantage — whether you run a business, work a job, or are still in school.</p>
    `,
    quiz: [
      { q: 'What type of AI exists in the world today?', options: ['General AI', 'Narrow AI', 'Superintelligence', 'Universal AI'], answer: 1 },
      { q: 'Which of these is an example of AI you might use daily?', options: ['A calculator', 'A printed book', 'A spam filter in your email', 'A light switch'], answer: 2 }
    ]
  },

  2: {
    title: 'How AI Models Think',
    content: `
      <h3>What happens when you talk to an AI?</h3>
      <p>You type a message. The AI replies. But what actually happens in between? Understanding this makes you a much smarter AI user.</p>
      <h3>Training data — the AI's education</h3>
      <p>AI does not think the way you do. It learns by reading enormous amounts of text — books, websites, conversations, news articles. This is called <strong>training data</strong>. The AI finds patterns in this text and uses those patterns to answer questions.</p>
      <div class="highlight">📚 ChatGPT was trained on more text than a person could read in 50,000 years. It does not "know" things — it recognises patterns extremely well.</div>
      <h3>What is a token?</h3>
      <p>AI does not read word by word. It reads in small chunks called <strong>tokens</strong>. A token is roughly a word or part of a word. "Cameroon" might be one token. "artificial" might be split into "artif" and "icial" — two tokens. The AI processes sequences of tokens and predicts the next most likely token to come next.</p>
      <h3>Large Language Models (LLMs)</h3>
      <p>Tools like ChatGPT, Claude, and Gemini are called <strong>Large Language Models</strong>. The word "large" refers to the number of parameters — the millions or billions of settings the model has learned during training. More parameters generally means a smarter, more capable model.</p>
      <p>When you ask an AI a question, it does not look up an answer in a database. It calculates — based on all the patterns it learned — what the most likely helpful response looks like, word by word.</p>
      <h3>Popular AI models — what is the difference?</h3>
      <ul>
        <li><strong>ChatGPT (OpenAI):</strong> The most well-known. Great for writing, answering questions, coding, and brainstorming.</li>
        <li><strong>Claude (Anthropic):</strong> Known for being careful, detailed, and good at reading long documents.</li>
        <li><strong>Gemini (Google):</strong> Deeply integrated with Google Search and Google Workspace apps.</li>
        <li><strong>Llama (Meta):</strong> Open-source — meaning anyone can download and use it freely, even on their own computer.</li>
      </ul>
      <h3>Why AI sometimes gets things wrong — "hallucination"</h3>
      <p>Because AI predicts the most likely next word rather than looking up real facts, it can sometimes produce text that sounds completely confident but is wrong. This is called <strong>hallucination</strong>.</p>
      <p>Example: Ask an AI for the phone number of a restaurant. It might confidently give you a number — that is completely made up.</p>
      <div class="highlight">⚠️ Rule: Never use AI for facts that really matter (medical advice, legal information, specific numbers) without double-checking from a trusted source.</div>
    `,
    quiz: [
      { q: 'What is "training data" in AI?', options: ['A special computer chip', 'The enormous amount of text an AI learns from', 'A password to access AI tools', 'A type of AI robot'], answer: 1 },
      { q: 'What is AI "hallucination"?', options: ['When AI creates images', 'When AI confidently produces wrong information', 'When AI is too slow to respond', 'When AI refuses to answer'], answer: 1 }
    ]
  },

  3: {
    title: 'Prompt Engineering',
    content: `
      <h3>What is a prompt?</h3>
      <p>A <strong>prompt</strong> is anything you type or say to an AI to get a response. Every time you send a message to ChatGPT or Claude, you are writing a prompt. Prompt engineering is the skill of writing prompts that consistently get you great results.</p>
      <div class="highlight">🎯 The single most important rule: the quality of your output depends on the quality of your input. Vague prompt = vague answer. Clear prompt = useful answer.</div>
      <h3>The golden rule — be specific</h3>
      <p><strong>Weak prompt:</strong> "Write something about my business."</p>
      <p><strong>Strong prompt:</strong> "Write a 150-word Instagram caption for a Cameroonian fashion boutique targeting women aged 18–35. Tone: modern, confident, and fun. End with a call to action to visit our store in Douala."</p>
      <p>The second prompt gives the AI everything it needs: what to write, how long, who it is for, the tone, and the goal.</p>
      <h3>Zero-shot prompting</h3>
      <p>You ask directly without giving examples. Works well for simple, common tasks.</p>
      <p><em>"Translate this sentence to French: Good morning, how can I help you?"</em></p>
      <h3>Few-shot prompting</h3>
      <p>You give the AI one or two examples of what you want before asking it to do the real thing. The AI learns your pattern from those examples.</p>
      <p><em>"Here is how I write my WhatsApp replies to customers: 'Hello [Name], thank you for reaching out! [Answer]. Feel free to ask anything else. 😊' Now write a reply to this customer message: [paste message]"</em></p>
      <h3>Chain-of-thought prompting</h3>
      <p>For complex problems, tell the AI to think step by step before giving an answer. This makes it more accurate.</p>
      <p><em>"A customer wants to know which of our packages is best for a small salon. Think step by step about their needs before recommending."</em></p>
      <h3>Role prompting</h3>
      <p>Assign the AI a role. It will respond from that perspective, which often gives much better results.</p>
      <p><em>"You are an experienced business coach working with small businesses in Cameroon. My business is a mobile phone repair shop. What are 5 ways I can attract more customers this month?"</em></p>
      <h3>Ready-to-use prompt templates</h3>
      <ul>
        <li>📝 <em>"Summarise this in 5 bullet points a 15-year-old could understand: [paste text]"</em></li>
        <li>📧 <em>"Write a professional but warm email apologising for a late delivery. Keep it under 100 words."</em></li>
        <li>📱 <em>"Give me 10 social media post ideas for a [type of business] targeting [audience] in [city]."</em></li>
        <li>💬 <em>"Act as a friendly customer service agent. A customer says: [complaint]. Write a reply."</em></li>
        <li>📊 <em>"I run a small bakery. My sales this month were [numbers]. What should I focus on next month?"</em></li>
      </ul>
    `,
    quiz: [
      { q: 'Which prompting technique gives the AI examples before making the real request?', options: ['Zero-shot', 'Chain-of-thought', 'Few-shot', 'Role prompting'], answer: 2 },
      { q: 'What does "chain-of-thought" prompting ask the AI to do?', options: ['Generate a chain of images', 'Think step by step before answering', 'Reply in bullet points only', 'Search the internet'], answer: 1 }
    ]
  },

  4: {
    title: 'AI Tools for Business & Life',
    content: `
      <h3>There are thousands of AI tools — where do you start?</h3>
      <p>The key is not to use every tool. The key is to know which tool solves which problem. Start with one or two tools that match your biggest daily task.</p>
      <h3>AI for writing and communication</h3>
      <ul>
        <li><strong>ChatGPT / Claude:</strong> Write emails, proposals, captions, reports, scripts, and more. Free tiers available.</li>
        <li><strong>Grammarly:</strong> AI that checks your English grammar and suggests improvements as you type.</li>
        <li><strong>DeepL:</strong> The most accurate AI translation tool — better than Google Translate for many languages.</li>
        <li><strong>Notion AI:</strong> AI built into your notes and project management — summarise, rewrite, generate ideas.</li>
      </ul>
      <h3>AI for images and design</h3>
      <ul>
        <li><strong>Canva AI:</strong> Generate graphics, resize content for different platforms, remove backgrounds, and create presentations. Free plan is powerful.</li>
        <li><strong>DALL-E / Adobe Firefly:</strong> Generate custom images from a text description.</li>
        <li><strong>Remove.bg:</strong> Remove any image background in one click — free.</li>
      </ul>
      <h3>AI for video</h3>
      <ul>
        <li><strong>CapCut AI:</strong> Auto-captions, background removal, templates, and video enhancement. Very popular in Africa. Free.</li>
        <li><strong>Pictory:</strong> Paste a blog post or script — AI turns it into a video automatically.</li>
        <li><strong>HeyGen:</strong> Create professional videos with an AI avatar reading your script. No camera needed.</li>
      </ul>
      <div class="highlight">🎥 You can create a professional marketing video in under 10 minutes using CapCut AI or Pictory — no camera, no studio, no editor needed.</div>
      <h3>AI for customer service</h3>
      <ul>
        <li><strong>Tidio:</strong> AI chatbot for your website — answers customer questions 24/7.</li>
        <li><strong>WhatsApp Business + AI:</strong> Combine WhatsApp Business with tools like Tidio or ChatGPT to auto-reply to messages intelligently.</li>
        <li><strong>Custom GPTs (ChatGPT):</strong> Train a mini AI assistant on your own FAQ, product list, and prices — then share it with customers.</li>
      </ul>
      <h3>How to choose</h3>
      <p>Ask yourself three questions before picking a tool:</p>
      <ul>
        <li>What is my most time-consuming task right now?</li>
        <li>Is there a free AI tool that handles exactly that?</li>
        <li>How much time would I save per week if this was automated?</li>
      </ul>
      <p>Start with free versions. Most are good enough for small businesses. Only pay when you clearly need more.</p>
    `,
    quiz: [
      { q: 'Which free tool removes image backgrounds in one click?', options: ['ChatGPT', 'Grammarly', 'Remove.bg', 'Notion AI'], answer: 2 },
      { q: 'What can HeyGen help you create without a camera?', options: ['A website', 'A professional video with an AI avatar', 'An email campaign', 'A spreadsheet'], answer: 1 }
    ]
  },

  5: {
    title: 'AI Automation & Workflows',
    content: `
      <h3>What is automation?</h3>
      <p>Automation means setting up a system that does a task for you — automatically — without you having to click or type each time. It is like hiring a helper who never sleeps and never forgets.</p>
      <div class="highlight">⏱ A business owner who automates just 3 hours of work per day saves over 700 hours per year — that is 90 full working days.</div>
      <h3>What kinds of tasks can be automated?</h3>
      <ul>
        <li>Posting to social media on a schedule</li>
        <li>Sending a welcome message when someone fills a form</li>
        <li>Saving new leads from WhatsApp into a spreadsheet</li>
        <li>Sending a payment reminder to clients automatically</li>
        <li>Generating a weekly sales report</li>
        <li>Replying to common customer questions without you typing anything</li>
      </ul>
      <h3>Make.com — automation for everyone</h3>
      <p>Make.com (formerly Integromat) is a visual automation platform. You connect apps together using drag-and-drop blocks called "scenarios". No coding needed.</p>
      <p>Example scenario: <em>When someone fills my Google Form → Add their details to my Google Sheet → Send them a welcome WhatsApp message automatically</em></p>
      <h3>Zapier — the beginner's choice</h3>
      <p>Zapier connects over 7,000 apps. A basic "Zap" has two parts:</p>
      <ul>
        <li><strong>Trigger:</strong> Something that starts the automation (e.g. "someone sends me an email")</li>
        <li><strong>Action:</strong> What happens as a result (e.g. "save their email address to my contact list")</li>
      </ul>
      <h3>Your first automation — step by step</h3>
      <ul>
        <li><strong>Step 1:</strong> Identify your single most repetitive task this week</li>
        <li><strong>Step 2:</strong> Write down every step you do manually for that task</li>
        <li><strong>Step 3:</strong> Check if each step can be handled by an app (Gmail, WhatsApp, Google Sheets, etc.)</li>
        <li><strong>Step 4:</strong> Connect those apps in Zapier or Make.com</li>
        <li><strong>Step 5:</strong> Test it once with real data — then let it run</li>
      </ul>
      <h3>AI + Automation = your most powerful combination</h3>
      <p>When you plug AI into your automations, they become intelligent — not just fast. Example: A customer sends a complaint message → AI reads it and writes a personalised reply → Automation sends the reply → You are notified. All while you sleep.</p>
      <div class="highlight">🤖 This is not science fiction. Businesses of all sizes — including small shops in Cameroon — are doing this today using free or low-cost tools.</div>
    `,
    quiz: [
      { q: 'In Zapier, what is a "trigger"?', options: ['A warning message', 'Something that starts an automated workflow', 'A type of payment', 'A design template'], answer: 1 },
      { q: 'Which platform uses drag-and-drop "scenarios" to build automations?', options: ['Grammarly', 'ChatGPT', 'Make.com', 'CapCut'], answer: 2 }
    ]
  },

  6: {
    title: 'AI Governance',
    content: `
      <h3>A question to start</h3>
      <p>Imagine a bank uses AI to decide whether you get a loan. You apply. The AI says no. Nobody can explain exactly why. Is that fair? Who do you complain to? Who is responsible?</p>
      <p>This is what <strong>AI governance</strong> is about — the rules, laws, and structures that decide who has power over AI and how to hold them accountable.</p>
      <div class="highlight">⚖️ AI governance is not just for governments and tech experts. It affects every person who uses a phone, applies for a job, or interacts with any digital service.</div>
      <h3>Who owns and controls AI?</h3>
      <p>Right now, most of the world's most powerful AI systems are built and owned by a small number of very large technology companies — mostly based in the United States and China. These include:</p>
      <ul>
        <li><strong>OpenAI</strong> (USA) — maker of ChatGPT</li>
        <li><strong>Google / Alphabet</strong> (USA) — maker of Gemini</li>
        <li><strong>Meta</strong> (USA) — maker of Llama</li>
        <li><strong>Anthropic</strong> (USA) — maker of Claude</li>
        <li><strong>Baidu, Alibaba, Huawei</strong> (China) — major AI players in Asia</li>
      </ul>
      <p>This concentration of power means that a few private companies make decisions that affect billions of people worldwide — including in Cameroon — often without those people having any say.</p>
      <h3>AI laws around the world</h3>
      <p><strong>The EU AI Act (2024):</strong> The world's first major AI law. It classifies AI systems by risk level — from "unacceptable" (banned, like social scoring by governments) to "high-risk" (like AI used in hiring or loan decisions) to "low-risk" (like spam filters). High-risk AI must be transparent, tested, and accountable.</p>
      <p><strong>United States:</strong> No single national AI law yet, but President Biden signed an AI Executive Order in 2023 requiring safety testing for powerful AI models before release.</p>
      <p><strong>China:</strong> Has strict rules requiring AI-generated content to be labelled and AI companies to register with the government.</p>
      <p><strong>Africa:</strong> Most African countries are still developing their AI policies. In 2023, the African Union adopted a Continental AI Strategy, encouraging African nations to build AI rules that reflect African values and needs.</p>
      <p><strong>Cameroon:</strong> Does not yet have a specific AI law, but the government is beginning conversations on digital regulation.</p>
      <h3>Who is responsible when AI causes harm?</h3>
      <p>This is one of the hardest questions in AI governance. Consider these real situations:</p>
      <ul>
        <li>An AI system wrongly flags someone as a criminal — who is responsible? The company that built the AI? The police department that used it?</li>
        <li>An AI doctor makes a wrong diagnosis — is the hospital responsible? The AI company?</li>
        <li>An AI generates fake news that causes violence — who is accountable?</li>
      </ul>
      <p>In most countries, the law has not caught up with AI yet. This is why AI governance matters — without clear rules, ordinary people have no recourse when AI harms them.</p>
      <h3>Your rights as an AI user</h3>
      <p>In places with strong AI laws (like the EU), you have specific rights:</p>
      <ul>
        <li><strong>Right to explanation:</strong> If AI made a significant decision about you (loan, job, insurance), you can ask for an explanation of why.</li>
        <li><strong>Right to human review:</strong> You can request that a human — not just an AI — reviews the decision.</li>
        <li><strong>Right to object:</strong> You can refuse to be subject to fully automated decisions on matters that seriously affect you.</li>
      </ul>
      <p>Even if your country does not have these rights written in law yet, knowing about them helps you advocate for yourself and understand what good AI policy looks like.</p>
      <h3>Data sovereignty — your data, your rights</h3>
      <p>Every time you use an AI tool, you share data. Your name, your questions, your voice, your face. Who owns that data? Can the company sell it? Can a government access it?</p>
      <p>Data sovereignty is the idea that people and nations should have control over their own data — especially data generated in Africa, which should benefit Africa.</p>
      <div class="highlight">🔑 Practical tip: Before using any AI tool, check its privacy policy. Look for: does it use my data to train its models? Can I delete my data? Is my data stored in my country or abroad?</div>
    `,
    quiz: [
      { q: 'What does the EU AI Act classify AI systems by?', options: ['Their cost', 'Their country of origin', 'Their risk level', 'Their language'], answer: 2 },
      { q: 'What is "data sovereignty"?', options: ['Paying for data storage', 'The idea that people and nations should control their own data', 'A type of AI tool', 'Encrypting your files'], answer: 1 }
    ]
  },

  7: {
    title: 'AI & Society',
    content: `
      <h3>The big question everyone is asking</h3>
      <p><em>"Will AI take my job?"</em></p>
      <p>It is the question on everyone's mind. The honest answer is: AI will change almost every job, but it will not simply replace all workers. What it will do is change what workers need to know and do.</p>
      <div class="highlight">📊 According to the World Economic Forum, AI will eliminate 85 million jobs by 2025 — but create 97 million new ones. The question is: will you be ready for the new ones?</div>
      <h3>Jobs most affected by AI</h3>
      <p><strong>High risk of automation:</strong></p>
      <ul>
        <li>Data entry and basic administration</li>
        <li>Simple customer service and call centres</li>
        <li>Basic content writing and copy</li>
        <li>Routine accounting and bookkeeping</li>
        <li>Some driving and delivery (longer timeline)</li>
      </ul>
      <p><strong>Lower risk — skills AI cannot replace:</strong></p>
      <ul>
        <li>Critical thinking and complex problem solving</li>
        <li>Human empathy and relationship management</li>
        <li>Creative work that requires real-world experience</li>
        <li>Leadership and ethical judgement</li>
        <li>Work that requires physical presence and trust</li>
      </ul>
      <h3>AI and inequality</h3>
      <p>AI is not neutral. It tends to benefit those who already have access to technology, education, and capital. If not managed carefully, AI could widen the gap between:</p>
      <ul>
        <li>Rich countries and poor countries</li>
        <li>Urban and rural communities</li>
        <li>People with digital skills and those without</li>
        <li>Men and women (AI tools are often designed by and for men)</li>
      </ul>
      <p>This is exactly why courses like this one matter. Access to AI education reduces inequality.</p>
      <h3>AI in African economies</h3>
      <p>Africa has a unique opportunity with AI — not just to adopt it, but to shape it. Africa's challenges are different from Europe's or America's. AI solutions built for Africa, by Africans, will be more effective.</p>
      <p>Promising areas in Africa right now:</p>
      <ul>
        <li><strong>Agriculture:</strong> AI predicting weather, pests, and yields for smallholder farmers</li>
        <li><strong>Healthcare:</strong> AI diagnosing malaria, TB, and eye disease in areas without doctors</li>
        <li><strong>Finance:</strong> AI credit scoring for people without formal credit history</li>
        <li><strong>Education:</strong> AI tutoring in local languages</li>
        <li><strong>Language:</strong> Building AI tools that work in Cameroonian French, Pidgin, Ewondo, and other local languages</li>
      </ul>
      <h3>AI, misinformation and elections</h3>
      <p>AI can now generate fake photos, fake videos, and fake audio of real people. These are called deepfakes. In the context of elections, this is dangerous:</p>
      <ul>
        <li>A fake video of a politician saying something they never said</li>
        <li>AI-generated fake news articles that spread on WhatsApp</li>
        <li>Automated social media accounts (bots) pushing a political message</li>
      </ul>
      <p>Cameroon, like many African countries, has experienced politically motivated misinformation online. AI makes this problem much easier to scale and much harder to detect.</p>
      <div class="highlight">🔍 Before sharing any political content: check the source, reverse-image search photos, and ask — "does this seem too dramatic to be true?"</div>
    `,
    quiz: [
      { q: 'According to the World Economic Forum, what will AI do to jobs overall?', options: ['Eliminate all jobs within 10 years', 'Eliminate more jobs than it creates', 'Create more new jobs than it eliminates', 'Have no effect on employment'], answer: 2 },
      { q: 'What is a "deepfake"?', options: ['A very detailed AI drawing', 'AI-generated fake video or audio of a real person', 'A type of phishing email', 'A deep learning research paper'], answer: 1 }
    ]
  },

  8: {
    title: 'AI Ethics',
    content: `
      <h3>Ethics — the difference between "can" and "should"</h3>
      <p>Just because AI <em>can</em> do something does not mean it <em>should</em>. AI ethics is the study of what is right and wrong when it comes to building and using AI. It is not just for scientists — it is for everyone.</p>
      <h3>Bias in AI</h3>
      <p>AI learns from human-generated data. And humans have biases — historical, cultural, economic. If the training data reflects those biases, the AI will too.</p>
      <p>Real examples of AI bias:</p>
      <ul>
        <li>Amazon's AI hiring tool ranked men higher than women for technical jobs — because it learned from historical hiring data where men dominated.</li>
        <li>Face recognition AI works poorly on dark-skinned faces — because most training photos were of light-skinned people.</li>
        <li>Loan approval AI denied more applications from Black applicants than white ones — even when income was the same.</li>
      </ul>
      <div class="highlight">⚖️ Bias is not always intentional. It is often invisible — built into data that everyone assumed was neutral. Awareness is the first step to fixing it.</div>
      <h3>Deepfakes and misinformation (ethics angle)</h3>
      <p>From a governance perspective, deepfakes are a legal issue. From an ethics perspective, they are a moral issue.</p>
      <p>Using AI to create a fake video of someone — even a public figure — without their consent is a form of deception and can cause serious harm: damaged reputations, lost jobs, relationship breakdown, or even violence. It is wrong, even if it is not yet illegal everywhere.</p>
      <h3>Privacy and your personal data</h3>
      <p>When you use AI tools, you often hand over personal data. Consider:</p>
      <ul>
        <li>When you upload a photo to an AI tool, who stores that photo and for how long?</li>
        <li>When you paste a business document into ChatGPT, could that content be used to train future models?</li>
        <li>When you speak to an AI assistant, is your voice being recorded and kept?</li>
      </ul>
      <p>Protecting your privacy means being thoughtful about what you share. Never paste passwords, medical records, client data, or financial information into a public AI chatbot.</p>
      <h3>Intellectual property and AI-generated content</h3>
      <p>AI tools trained on text and images learned from work created by humans — writers, artists, coders. The ethical questions here are still being debated:</p>
      <ul>
        <li>Does using AI-generated art mean you're using someone's style without paying them?</li>
        <li>If an AI writes something, who owns the copyright?</li>
        <li>Should AI companies pay the writers and artists whose work trained the models?</li>
      </ul>
      <p>These questions do not have final answers yet. But as a user, being aware of them helps you make thoughtful choices.</p>
      <h3>Your responsibilities as an AI user</h3>
      <ul>
        <li>✓ Be transparent when AI helped you create something (especially in school or professional work)</li>
        <li>✓ Verify AI-generated facts before sharing or acting on them</li>
        <li>✓ Never use AI to deceive, harass, impersonate, or harm someone</li>
        <li>✓ Do not use AI to cheat in ways that undermine genuine learning or trust</li>
        <li>✓ Speak up if you see AI being used in unfair or harmful ways</li>
      </ul>
      <div class="highlight">🤝 The best AI user is not the one who uses AI the most — it is the one who uses AI responsibly, honestly, and with consideration for others.</div>
    `,
    quiz: [
      { q: 'Where does AI bias typically come from?', options: ['Bugs in the code', 'Biases and inequalities in human-generated training data', 'Slow internet connections', 'Too many users at once'], answer: 1 },
      { q: 'What should you NOT paste into a public AI chatbot?', options: ['A poem you want to edit', 'A social media caption draft', 'Client personal data or passwords', 'A recipe you want to improve'], answer: 2 }
    ]
  },

  9: {
    title: 'Your AI Action Plan',
    content: `
      <h3>You have come a long way</h3>
      <p>Look at how much you have covered:</p>
      <ul>
        <li>✅ What AI is and where it came from</li>
        <li>✅ How AI models actually think</li>
        <li>✅ How to write prompts that get great results</li>
        <li>✅ The best AI tools for business and daily life</li>
        <li>✅ How to automate repetitive tasks with AI</li>
        <li>✅ Who controls AI and what rules govern it</li>
        <li>✅ How AI is reshaping African economies and jobs</li>
        <li>✅ The ethics of AI and your responsibilities</li>
      </ul>
      <p>Now it is time to turn this knowledge into action.</p>
      <div class="highlight">💡 Knowledge without action changes nothing. One small step this week is worth more than a perfect plan you never start.</div>
      <h3>Step 1 — Pick one AI tool to start with this week</h3>
      <p>Do not try to use everything at once. Pick the tool that matches your biggest daily need right now:</p>
      <ul>
        <li>If you write a lot → <strong>ChatGPT or Claude</strong></li>
        <li>If you create social media content → <strong>Canva AI + CapCut AI</strong></li>
        <li>If you handle customer messages → <strong>WhatsApp Business + Tidio</strong></li>
        <li>If you do a lot of repetitive tasks → <strong>Make.com or Zapier</strong></li>
        <li>If you want to learn more deeply → <strong>Keep coming back to this portal</strong></li>
      </ul>
      <h3>Step 2 — Write your first prompt template</h3>
      <p>Think of a task you do regularly — writing a report, replying to customer complaints, creating social media posts. Write a prompt template for it that you can use every week:</p>
      <p><em>"I run a [type of business] in [city]. Write a [type of content] for [audience]. Tone: [describe tone]. Include: [key points]. Length: [number] words."</em></p>
      <p>Save this in your phone notes. Use it every week.</p>
      <h3>Step 3 — Build your 30-day AI habit</h3>
      <ul>
        <li><strong>Week 1:</strong> Use your chosen AI tool every day for your main task. Do not overthink it — just start.</li>
        <li><strong>Week 2:</strong> Refine your prompts based on the results. What worked? What did not?</li>
        <li><strong>Week 3:</strong> Try one automation. Identify a repetitive task and connect two apps in Zapier.</li>
        <li><strong>Week 4:</strong> Share what you have learned with one other person — a colleague, a family member, a friend. Teaching deepens your own understanding.</li>
      </ul>
      <h3>Step 4 — Stay curious, stay critical</h3>
      <p>AI is changing fast. What is true today may change in 6 months. Good habits to build:</p>
      <ul>
        <li>Follow one AI newsletter or account that covers AI in Africa</li>
        <li>When you hear an AI claim, ask: "Is this verified? Who benefits from this claim?"</li>
        <li>Keep asking the governance question: "Who controls this AI, and in whose interest?"</li>
      </ul>
      <h3>Step 5 — Join the Harts community</h3>
      <p>You are not learning alone. Join our WhatsApp community to get weekly AI tips, ask questions, and connect with other learners across Cameroon and Africa.</p>
      <p>Complete Module 10 (the final exam) to earn your certificate and receive your community invitation.</p>
    `,
    quiz: [
      { q: 'According to this module, what is the most important thing to do after learning about AI?', options: ['Read more books about AI', 'Take action — start using AI this week', 'Wait for better AI tools to arrive', 'Tell people AI is dangerous'], answer: 1 },
      { q: 'What is a "prompt template"?', options: ['A paid AI tool', 'A reusable prompt you save and use for a regular task', 'A type of AI model', 'A government AI regulation'], answer: 1 }
    ]
  },

  10: {
    title: 'Final Exam & Certificate',
    content: `
      <h3>You made it — this is your final module</h3>
      <p>You have completed all 9 learning modules of the Harts AI Fundamentals course. This is no small thing. You now understand AI at a level that most people — including many professionals — do not.</p>
      <h3>Full course review</h3>
      <ul>
        <li>✅ <strong>Module 1:</strong> AI is a computer doing human-intelligence tasks, built on enormous amounts of data.</li>
        <li>✅ <strong>Module 2:</strong> AI models learn from training data, process tokens, and predict responses — they can hallucinate.</li>
        <li>✅ <strong>Module 3:</strong> Great prompts are specific. Few-shot and chain-of-thought techniques get better results.</li>
        <li>✅ <strong>Module 4:</strong> Free AI tools exist for writing, images, video, and customer service.</li>
        <li>✅ <strong>Module 5:</strong> Automation saves hundreds of hours. Zapier and Make.com connect your apps.</li>
        <li>✅ <strong>Module 6:</strong> AI governance covers who controls AI, AI laws, accountability, and your rights.</li>
        <li>✅ <strong>Module 7:</strong> AI is reshaping jobs and African economies. Deepfakes threaten democracy.</li>
        <li>✅ <strong>Module 8:</strong> AI has real biases. Privacy matters. Responsible use is everyone's responsibility.</li>
        <li>✅ <strong>Module 9:</strong> One tool, one prompt template, one automation — start this week.</li>
      </ul>
      <div class="highlight">🎓 Complete the 10-question exam below. Passing score is 70% (7 out of 10 correct). Your gold certificate will download automatically when you pass.</div>
    `,
    quiz: [
      { q: 'What type of AI exists in the world today?', options: ['Superintelligent AI', 'General AI', 'Narrow AI', 'Universal AI'], answer: 2 },
      { q: 'What is AI "hallucination"?', options: ['When AI creates visual art', 'When AI generates confident but incorrect information', 'A feature that makes AI more creative', 'When AI cannot understand a question'], answer: 1 },
      { q: 'Which prompting technique gives the AI examples before making the real request?', options: ['Zero-shot', 'Role prompting', 'Few-shot', 'Chain-of-thought'], answer: 2 },
      { q: 'Which tool removes image backgrounds in one click for free?', options: ['Zapier', 'Remove.bg', 'Grammarly', 'Pictory'], answer: 1 },
      { q: 'In Zapier, what is a "trigger"?', options: ['A security warning', 'Something that starts an automated workflow', 'A type of AI model', 'A payment system'], answer: 1 },
      { q: 'What does the EU AI Act classify AI systems by?', options: ['Their cost', 'Their country of origin', 'Their risk level', 'Their language'], answer: 2 },
      { q: 'What is a deepfake?', options: ['A very large AI model', 'AI-generated fake video or audio of a real person', 'A type of encryption', 'A deep learning textbook'], answer: 1 },
      { q: 'Where does AI bias most commonly come from?', options: ['Too many users at once', 'Power cuts during training', 'Biases in human-generated training data', 'Slow internet connections'], answer: 2 },
      { q: 'What is "data sovereignty"?', options: ['Paying to store data in the cloud', 'The idea that people and nations should control their own data', 'A type of AI regulation from China', 'Encrypting AI outputs'], answer: 1 },
      { q: 'According to the World Economic Forum, what will AI do to jobs overall?', options: ['Replace all jobs within 5 years', 'Eliminate more jobs than it creates', 'Create more new jobs than it eliminates', 'Have no measurable effect on employment'], answer: 2 }
    ]
  }
};

/* ── State helpers ────────────────────────────────────────── */
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let state = loadState();
let currentModule = null;
let quizAnswers = {};
let quizScore = 0;

/* ── Init ─────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  if (state.name) showEnrolledUI();
  renderModuleStates();
  setupEnrollForm();
});

function showEnrolledUI() {
  const section = document.getElementById('tr-progress-section');
  section.style.display = 'flex';
  document.getElementById('tr-welcome-name').textContent = `Welcome back, ${state.name}`;
  updateProgress();
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
  (state.completed || []).forEach(num => {
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
  document.getElementById('tr-enroll-form').addEventListener('submit', e => {
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
    notifyViaWhatsApp(name, email, phone, country);
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

/* ── WhatsApp notification ────────────────────────────────── */
function notifyViaWhatsApp(name, email, phone, country) {
  const message =
    `🎓 *New AI Course Enrollment — Harts*\n\n` +
    `👤 *Name:* ${name}\n` +
    `📧 *Email:* ${email}\n` +
    `📱 *WhatsApp:* ${phone}\n` +
    `🌍 *Country:* ${country}\n` +
    `🕐 *Time:* ${new Date().toLocaleString('en-GB')}\n\n` +
    `_Sent from hartsdigitalhub.com/training_`;
  window.open(`https://wa.me/237622341343?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

/* ── Starter Guide ────────────────────────────────────────── */
function downloadStarterGuide() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 1697;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 1200, 1697);
  ctx.strokeStyle = '#c8a96e'; ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 1160, 1657);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.strokeRect(35, 35, 1130, 1627);
  ctx.fillStyle = '#c8a96e'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('HARTS  ·  HARTS DIGITAL HUB', 600, 80);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('AI Starter', 80, 240);
  ctx.fillText('Guide', 80, 340);
  ctx.fillStyle = '#c8a96e'; ctx.font = '22px monospace';
  ctx.fillText('Everything you need to begin your AI journey', 80, 400);
  ctx.fillStyle = '#333'; ctx.fillRect(80, 425, 1040, 1);
  const sections = [
    { t: '01 — What is AI?', b: 'AI is a computer doing tasks that normally require human intelligence — language, images, decisions. It learns from data, not from rules.' },
    { t: '02 — Why AI matters now', b: 'The AI economy is worth $200B+. Every industry is changing. Learning AI today puts you ahead of 95% of people around you.' },
    { t: '03 — 5 free tools to start with', b: 'ChatGPT (writing), Canva AI (design), CapCut AI (video), Remove.bg (images), Make.com (automation). All free to start.' },
    { t: '04 — Your first prompt', b: '"You are a business advisor in Cameroon. I run a [type of business]. Give me 5 low-cost marketing ideas for this week." Try it now.' },
    { t: '05 — AI Governance basics', b: 'Most AI is controlled by a few large companies. Know your rights: the right to an explanation, the right to human review, the right to object.' },
    { t: '06 — Next steps', b: 'Complete all 10 modules at hartsdigitalhub.com/training to earn your gold Harts AI Certificate. Free, online, for everyone.' },
  ];
  let y = 470;
  sections.forEach(s => {
    ctx.fillStyle = '#c8a96e'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(s.t, 80, y); y += 42;
    ctx.fillStyle = '#aaa'; ctx.font = '20px monospace';
    const words = s.b.split(' '); let line = '';
    words.forEach(w => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > 1040 && line) { ctx.fillText(line, 80, y); y += 30; line = w + ' '; }
      else line = test;
    });
    ctx.fillText(line, 80, y); y += 55;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(80, y - 10, 1040, 1); y += 20;
  });
  ctx.fillStyle = '#555'; ctx.font = '16px monospace'; ctx.textAlign = 'center';
  ctx.fillText('© 2026 Harts · Harts Digital Hub · hartsdigitalhub.com', 600, 1660);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Harts-AI-Starter-Guide.png'; a.click();
    URL.revokeObjectURL(url);
  });
}

/* ── Lesson modal ─────────────────────────────────────────── */
function openLesson(num) {
  if (!state.name) { document.getElementById('enroll').scrollIntoView({ behavior: 'smooth' }); return; }
  currentModule = num; quizAnswers = {}; quizScore = 0;
  const lesson = lessons[num];
  document.getElementById('lesson-num-label').textContent = `Module ${num} of ${TOTAL_MODULES}`;
  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-content').innerHTML = lesson.content;
  renderQuiz(num);
  const bd = document.getElementById('tr-lesson-backdrop');
  bd.classList.add('open'); bd.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLesson() {
  const bd = document.getElementById('tr-lesson-backdrop');
  bd.classList.remove('open'); bd.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentModule = null;
}

function renderQuiz(num) {
  const lesson = lessons[num];
  const quizEl = document.getElementById('lesson-quiz');
  if (!lesson.quiz || !lesson.quiz.length) { quizEl.style.display = 'none'; return; }
  quizEl.style.display = 'block';
  quizEl.innerHTML = `<p class="tr-quiz-title">Knowledge Check${num === 10 ? ' — Final Exam' : ''}</p>`;
  lesson.quiz.forEach((q, qi) => {
    const qEl = document.createElement('div'); qEl.className = 'tr-quiz-q';
    qEl.innerHTML = `<p>${qi + 1}. ${q.q}</p><div class="tr-quiz-options"></div><div class="tr-quiz-result" id="qres-${num}-${qi}"></div>`;
    const opts = qEl.querySelector('.tr-quiz-options');
    q.options.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'tr-quiz-option'; btn.textContent = opt;
      btn.onclick = () => answerQuiz(num, qi, oi, q.answer, btn, opts);
      opts.appendChild(btn);
    });
    quizEl.appendChild(qEl);
  });
}

function answerQuiz(moduleNum, qi, chosen, correct, btn, opts) {
  if (quizAnswers[`${moduleNum}-${qi}`] !== undefined) return;
  quizAnswers[`${moduleNum}-${qi}`] = chosen;
  Array.from(opts.children).forEach(b => b.disabled = true);
  const isCorrect = chosen === correct;
  if (isCorrect) { btn.classList.add('correct'); quizScore++; }
  else { btn.classList.add('wrong'); opts.children[correct].classList.add('correct'); }
  const el = document.getElementById(`qres-${moduleNum}-${qi}`);
  el.style.display = 'block';
  el.textContent = isCorrect ? '✓ Correct!' : '✗ Not quite — review the lesson above.';
  el.style.color = isCorrect ? '#4ade80' : '#f87171';

  if (moduleNum === 10) {
    const total = lessons[10].quiz.length;
    const answered = Object.keys(quizAnswers).filter(k => k.startsWith('10-')).length;
    if (answered === total) showFinalExamResult(quizScore, total);
  }
}

function showFinalExamResult(score, total) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;
  const el = document.getElementById('lesson-quiz');
  const result = document.createElement('div');
  result.style.cssText = 'margin-top:2rem;padding:1.5rem;border:1px solid;border-radius:0.75rem;text-align:center;';
  result.style.borderColor = passed ? '#c8a96e' : '#f87171';
  result.innerHTML = passed
    ? `<p style="font-family:Syne,sans-serif;font-size:1.3rem;color:#c8a96e;margin-bottom:0.5rem;">You passed! ${score}/${total} correct (${pct}%)</p>
       <p style="color:#aaa;font-size:0.88rem;margin-bottom:1.25rem;">Congratulations. Click "Mark as Complete" to download your gold certificate.</p>`
    : `<p style="font-family:Syne,sans-serif;font-size:1.1rem;color:#f87171;margin-bottom:0.5rem;">${score}/${total} correct (${pct}%) — not quite there yet</p>
       <p style="color:#aaa;font-size:0.88rem;">You need 70% to pass. Review the modules above and try again. You can do this!</p>`;
  el.appendChild(result);
  if (!passed) document.getElementById('lesson-complete-btn').style.display = 'none';
}

function completeLesson() {
  if (!currentModule) return;
  if (currentModule === 10 && quizScore < 7) return;
  const completed = state.completed || [];
  if (!completed.includes(currentModule)) { completed.push(currentModule); state.completed = completed; saveState(state); }
  const card = document.querySelector(`[data-module="${currentModule}"]`);
  if (card) { card.classList.add('completed'); const btn = card.querySelector('.tr-module-btn'); if (btn) btn.textContent = 'Review'; }
  updateProgress();
  if ((state.completed || []).length === TOTAL_MODULES) {
    closeLesson();
    setTimeout(() => {
      generateCertificate();
      document.getElementById('tr-progress-section').scrollIntoView({ behavior: 'smooth' });
    }, 400);
    return;
  }
  closeLesson();
}

/* ── Certificate — gold/black design ─────────────────────── */
function generateCertificate() {
  const canvas = document.getElementById('cert-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1200, H = 840;
  const name = state.name || 'Learner';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const certId = 'HDH-AI-' + (state.enrolledAt || Date.now()).toString(36).toUpperCase().slice(-6);

  const gold = '#c8a96e';
  const black = '#0a0a0a';
  const white = '#ffffff';
  const muted = '#888888';

  /* Background */
  ctx.fillStyle = white; ctx.fillRect(0, 0, W, H);

  /* Outer black border */
  ctx.fillStyle = black; ctx.fillRect(0, 0, W, H);
  /* White field */
  ctx.fillStyle = white; ctx.fillRect(10, 10, W - 20, H - 20);

  /* Outer gold frame */
  ctx.strokeStyle = gold; ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  /* Inner thin frame */
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 0.8;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  /* Top black header band */
  ctx.fillStyle = black; ctx.fillRect(10, 10, W - 20, 64);

  /* Header text */
  ctx.fillStyle = white; ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HARTS  ·  HARTS DIGITAL HUB  ·  hartsdigitalhub.com', W / 2, 48);

  /* Gold accent under header */
  ctx.fillStyle = gold; ctx.fillRect(10, 74, W - 20, 4);

  /* Corner ornaments */
  const ornament = (x, y, size) => {
    ctx.fillStyle = gold; ctx.font = `${size}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.fillText('✦', x, y);
  };
  ornament(62, 120, 22); ornament(W - 62, 120, 22);
  ornament(62, H - 60, 22); ornament(W - 62, H - 60, 22);

  /* CERTIFICATE OF COMPLETION label */
  ctx.fillStyle = muted; ctx.font = '13px Georgia, serif';
  ctx.letterSpacing = '0.3em';
  ctx.textAlign = 'center';
  ctx.fillText('C E R T I F I C A T E   O F   C O M P L E T I O N', W / 2, 130);

  /* Gold rule under label */
  ctx.strokeStyle = gold; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(300, 142); ctx.lineTo(900, 142); ctx.stroke();

  /* "This is to certify that" */
  ctx.fillStyle = muted; ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('This is to certify that', W / 2, 188);

  /* Recipient name */
  ctx.fillStyle = black; ctx.font = `bold 54px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(name, W / 2, 265);

  /* Name underline */
  ctx.strokeStyle = black; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(180, 278); ctx.lineTo(1020, 278); ctx.stroke();

  /* "has successfully completed" */
  ctx.fillStyle = muted; ctx.font = 'italic 15px Georgia, serif';
  ctx.fillText('has successfully completed all 10 modules of', W / 2, 318);

  /* Course name */
  ctx.fillStyle = black; ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('AI Fundamentals for Everyone', W / 2, 366);

  /* Subtitle */
  ctx.fillStyle = muted; ctx.font = '13px Georgia, serif';
  ctx.fillText('AI GOVERNANCE  ·  ETHICS  ·  TOOLS  ·  AUTOMATION  ·  SOCIETY', W / 2, 396);

  /* Horizontal divider */
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 430); ctx.lineTo(1140, 430); ctx.stroke();

  /* ── Bottom section ── */

  /* Date block — left */
  ctx.fillStyle = muted; ctx.font = '11px Georgia, serif';
  ctx.letterSpacing = '0.15em'; ctx.textAlign = 'center';
  ctx.fillText('D A T E   I S S U E D', 190, 470);
  ctx.fillStyle = black; ctx.font = '18px Georgia, serif';
  ctx.fillText(date, 190, 500);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(60, 512); ctx.lineTo(320, 512); ctx.stroke();

  /* Harts seal — centre */
  const cx = W / 2, cy = 508;
  /* Outer gold ring */
  ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.fillStyle = black; ctx.fill();
  ctx.strokeStyle = gold; ctx.lineWidth = 2;
  ctx.stroke();
  /* Inner ring */
  ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.strokeStyle = gold; ctx.lineWidth = 0.8; ctx.stroke();
  /* Seal text */
  ctx.fillStyle = gold; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('HARTS', cx, cy - 8);
  ctx.font = '10px Georgia, serif';
  ctx.fillText('CERTIFIED', cx, cy + 8);
  ctx.font = '9px Georgia, serif';
  ctx.fillText('DIGITAL HUB', cx, cy + 22);

  /* Signature block — right */
  ctx.fillStyle = muted; ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('A U T H O R I S E D   B Y', 1010, 470);
  ctx.fillStyle = black; ctx.font = 'italic bold 22px Georgia, serif';
  ctx.fillText('Harts', 1010, 500);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(880, 512); ctx.lineTo(1140, 512); ctx.stroke();
  ctx.fillStyle = muted; ctx.font = '12px Georgia, serif';
  ctx.fillText('Harts Digital Hub', 1010, 526);

  /* Gold bottom ribbon */
  ctx.fillStyle = gold; ctx.fillRect(10, H - 50, W - 20, 6);
  ctx.fillStyle = black; ctx.fillRect(10, H - 44, W - 20, 34);

  /* Certificate ID in ribbon */
  ctx.fillStyle = gold; ctx.font = '12px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(`Certificate ID: ${certId}  ·  hartsdigitalhub.com/verify`, W / 2, H - 20);

  /* Download */
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Harts-AI-Certificate-${name.replace(/\s+/g, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ── Backdrop click + Esc ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tr-lesson-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLesson();
  });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLesson(); });
