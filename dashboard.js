/* ============================================================
   HARTS — dashboard.js
   Training Hub · Git & GitHub with SSH keys · 7 modules · certificate
   State lives server-side (api/trainee/*), so progress follows the
   trainee across devices.
   ============================================================ */

/* ── The course ─────────────────────────────────────────────
   Git & GitHub with SSH keys: the one course the Training Hub runs.

   Module ids start at 11, not 1. The hub used to run a 10-module AI course
   with ids 1 to 10, and those ids are still in some trainees' saved progress;
   starting here means none of that old progress can count toward this course.
   api/trainee/progress.js holds the same list and must stay in step. */
const MODULE_IDS = [11, 12, 13, 14, 15, 16, 17];
const FINAL_ID = 17;
const TOTAL_MODULES = MODULE_IDS.length;
const PASS_PCT = 70;

const lessons = {

  11: {
    title: 'Git and GitHub, explained',
    desc: 'What version control is, how Git and GitHub differ, and why we connect them with SSH keys.',
    topics: ['Git vs GitHub', 'Repositories, commits, push and pull', 'Why SSH instead of passwords'],
    time: '~10 min',
    content: `
      <h3>Version control in one sentence</h3>
      <p>Version control keeps the full history of your project, so you can see what changed, when, and why, and go back to any earlier state. Git is the version control tool almost every developer uses.</p>
      <h3>Git is not GitHub</h3>
      <ul>
        <li><strong>Git</strong> is a program that runs on your computer. It tracks your files in a <em>repository</em> (a project folder with a hidden <code>.git</code> history inside).</li>
        <li><strong>GitHub</strong> is a website that stores copies of repositories online, so you can back them up, share them and work on them with other people.</li>
      </ul>
      <h3>The words you will see all the time</h3>
      <ul>
        <li><strong>Commit:</strong> a saved snapshot of your changes, with a message saying what you did.</li>
        <li><strong>Push:</strong> send your commits from your computer up to GitHub.</li>
        <li><strong>Pull:</strong> bring new commits from GitHub down to your computer.</li>
        <li><strong>Clone:</strong> download a full copy of a repository from GitHub to start working on it.</li>
      </ul>
      <h3>Why SSH keys</h3>
      <p>Every push and pull has to prove to GitHub that it is really you. GitHub no longer accepts your account password for this. The two options are a personal access token over HTTPS, or an <strong>SSH key</strong>.</p>
      <p>An SSH key is a matching pair of files: a <strong>private key</strong> that never leaves your computer, and a <strong>public key</strong> you give to GitHub. Once they are set up, every push just works, with no password to type.</p>
      <div class="highlight">By the end of this course you will have Git installed and configured, an SSH key on GitHub, and your first repository pushed over SSH.</div>
    `,
    quiz: [
      { q: 'Which statement is true?', options: ['Git and GitHub are the same thing', 'Git runs on your computer; GitHub hosts repositories online', 'GitHub runs on your computer; Git is a website', 'You need GitHub before you can install Git'], answer: 1 },
      { q: 'What does "push" do?', options: ['Downloads a repository', 'Deletes old commits', 'Sends your commits from your computer to GitHub', 'Creates a new branch'], answer: 2 },
      { q: 'Which part of an SSH key pair do you give to GitHub?', options: ['The private key', 'The public key', 'Both keys', 'Neither, you give your password'], answer: 1 }
    ]
  },

  12: {
    title: 'Install Git',
    desc: 'Install Git on Windows, macOS or Linux, and check it works.',
    topics: ['Windows: Git for Windows', 'macOS: Command Line Tools or Homebrew', 'Linux: your package manager'],
    time: '~15 min',
    content: `
      <h3>Windows</h3>
      <ol>
        <li>Download <strong>Git for Windows</strong> from <code>git-scm.com</code>.</li>
        <li>Run the installer. The defaults are fine. Two screens worth a look:
          <ul>
            <li><em>Adjusting the name of the initial branch</em>: choose <strong>Override</strong> and type <code>main</code>.</li>
            <li><em>Adjusting your PATH</em>: keep <strong>Git from the command line and also from 3rd-party software</strong>.</li>
          </ul>
        </li>
        <li>When it finishes, open <strong>Git Bash</strong> from the Start menu. You will use it for the rest of this course.</li>
      </ol>
      <h3>macOS</h3>
      <p>Open <strong>Terminal</strong> and type:</p>
      <pre><code>git --version</code></pre>
      <p>If Git is missing, macOS offers to install the <strong>Command Line Tools</strong>. Accept, and run the command again when it is done. If you use Homebrew, <code>brew install git</code> works too.</p>
      <h3>Linux</h3>
      <p>Use your distribution's package manager:</p>
      <pre><code># Debian, Ubuntu
sudo apt update
sudo apt install git

# Fedora
sudo dnf install git</code></pre>
      <h3>Check it worked</h3>
      <pre><code>git --version</code></pre>
      <p>You should see something like <code>git version 2.x.x</code>. Any recent version is fine.</p>
      <div class="highlight">From here on, "the terminal" means Git Bash on Windows, or Terminal on macOS and Linux.</div>
    `,
    quiz: [
      { q: 'On Windows, which program should you use for the commands in this course?', options: ['Notepad', 'Git Bash', 'Microsoft Word', 'The Run dialog'], answer: 1 },
      { q: 'Which command checks that Git is installed?', options: ['git check', 'git --version', 'install git', 'git hello'], answer: 1 },
      { q: 'On Ubuntu, how do you install Git?', options: ['sudo apt install git', 'brew install git', 'Download it from the Microsoft Store', 'pip install git'], answer: 0 }
    ]
  },

  13: {
    title: 'Configure Git',
    desc: 'Tell Git who you are and set sensible defaults, once, for every project.',
    topics: ['Your name and email', 'Default branch name', 'Line endings across systems'],
    time: '~10 min',
    content: `
      <h3>Who you are</h3>
      <p>Every commit records an author. Set yours once and Git uses it everywhere:</p>
      <pre><code>git config --global user.name "Your Name"
git config --global user.email "you@example.com"</code></pre>
      <p>Use the <strong>same email as your GitHub account</strong>, or the private <code>noreply</code> address GitHub gives you under <em>Settings → Emails</em>. That is how GitHub links your commits to your profile.</p>
      <h3>Default branch</h3>
      <pre><code>git config --global init.defaultBranch main</code></pre>
      <p>New repositories you create will start on a branch called <code>main</code>, the same name GitHub uses.</p>
      <h3>Line endings</h3>
      <p>Windows and macOS/Linux end lines of text differently. This keeps files consistent when people on different systems work together:</p>
      <pre><code># on Windows
git config --global core.autocrlf true

# on macOS or Linux
git config --global core.autocrlf input</code></pre>
      <h3>Check your settings</h3>
      <pre><code>git config --global --list</code></pre>
      <div class="highlight"><code>--global</code> means "for every repository on this computer". You only do this once per machine.</div>
    `,
    quiz: [
      { q: 'Why should your Git email match your GitHub account email?', options: ['It makes pushes faster', 'So GitHub links your commits to your profile', 'Git refuses to work otherwise', 'It encrypts your commits'], answer: 1 },
      { q: 'What does --global mean in git config?', options: ['The setting applies to every repository on this computer', 'The setting is shared with the whole world', 'The setting is saved on GitHub', 'The setting lasts one day'], answer: 0 },
      { q: 'Which command sets the default branch name for new repositories to main?', options: ['git branch main', 'git config --global init.defaultBranch main', 'git checkout main', 'git main --default'], answer: 1 }
    ]
  },

  14: {
    title: 'Create your SSH key',
    desc: 'Generate an SSH key pair, protect it with a passphrase, and load it into the SSH agent.',
    topics: ['ssh-keygen with ed25519', 'Private vs public key', 'The SSH agent on each system'],
    time: '~15 min',
    content: `
      <h3>Check for an existing key</h3>
      <pre><code>ls ~/.ssh</code></pre>
      <p>If you already see <code>id_ed25519</code> and <code>id_ed25519.pub</code>, you have a key and can skip to "Load it into the agent". If the folder is missing or empty, create one.</p>
      <h3>Generate a new key</h3>
      <pre><code>ssh-keygen -t ed25519 -C "you@example.com"</code></pre>
      <ul>
        <li>Press <strong>Enter</strong> to accept the default location (<code>~/.ssh/id_ed25519</code>).</li>
        <li>Type a <strong>passphrase</strong> when asked. It protects the key if your computer is ever lost or stolen. Nothing appears on screen while you type; that is normal.</li>
      </ul>
      <p>If your system is very old and does not support ed25519, use <code>ssh-keygen -t rsa -b 4096 -C "you@example.com"</code> instead.</p>
      <h3>Two files, two rules</h3>
      <ul>
        <li><code>id_ed25519</code> is your <strong>private key</strong>. It never leaves your computer. Never paste it anywhere, never send it to anyone, never commit it to a repository.</li>
        <li><code>id_ed25519.pub</code> is your <strong>public key</strong>. This is the one you give to GitHub. It is safe to share.</li>
      </ul>
      <h3>Load it into the agent</h3>
      <p>The SSH agent remembers your unlocked key, so you type the passphrase once rather than on every push.</p>
      <p><strong>Git Bash on Windows, and Linux:</strong></p>
      <pre><code>eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519</code></pre>
      <p><strong>macOS:</strong> create or edit <code>~/.ssh/config</code> so the key is stored in your Keychain:</p>
      <pre><code>Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519</code></pre>
      <p>then run:</p>
      <pre><code>ssh-add --apple-use-keychain ~/.ssh/id_ed25519</code></pre>
      <div class="highlight">Check what the agent holds at any time with <code>ssh-add -l</code>. "The agent has no identities" means your key is not loaded yet.</div>
    `,
    quiz: [
      { q: 'Which command creates a modern SSH key?', options: ['ssh-keygen -t ed25519 -C "you@example.com"', 'git key --new', 'ssh-copy-key github', 'git config --ssh'], answer: 0 },
      { q: 'Which file must you NEVER share or commit?', options: ['id_ed25519.pub', 'id_ed25519', 'README.md', '.gitignore'], answer: 1 },
      { q: 'What does the SSH agent do?', options: ['Uploads your key to GitHub', 'Remembers your unlocked key so you do not retype the passphrase', 'Creates repositories', 'Deletes old keys'], answer: 1 }
    ]
  },

  15: {
    title: 'Add the key to GitHub and test it',
    desc: 'Give GitHub your public key, confirm the connection, and fix the most common error.',
    topics: ['Copy the public key', 'GitHub → Settings → SSH and GPG keys', 'ssh -T git@github.com'],
    time: '~10 min',
    content: `
      <h3>Copy your public key</h3>
      <pre><code># Git Bash on Windows
clip &lt; ~/.ssh/id_ed25519.pub

# macOS
pbcopy &lt; ~/.ssh/id_ed25519.pub

# Linux (then copy it from the screen)
cat ~/.ssh/id_ed25519.pub</code></pre>
      <p>It is one line that starts with <code>ssh-ed25519</code> and ends with your email. Make sure you copy the <code>.pub</code> file.</p>
      <h3>Add it to GitHub</h3>
      <ol>
        <li>On GitHub, click your profile photo, then <strong>Settings</strong>.</li>
        <li>Open <strong>SSH and GPG keys</strong> and click <strong>New SSH key</strong>.</li>
        <li>Give it a title you will recognise later, such as "Work laptop". Leave the type as <strong>Authentication Key</strong>.</li>
        <li>Paste the key and click <strong>Add SSH key</strong>.</li>
      </ol>
      <h3>Test the connection</h3>
      <pre><code>ssh -T git@github.com</code></pre>
      <p>The first time, SSH asks whether you trust the host. Check the fingerprint matches the one GitHub publishes in its documentation (search "GitHub's SSH key fingerprints"), then type <code>yes</code>. You should see:</p>
      <pre><code>Hi YOUR-USERNAME! You've successfully authenticated, but GitHub does not provide shell access.</code></pre>
      <p>That message means it worked. GitHub never gives shell access; it only confirms who you are.</p>
      <h3>"Permission denied (publickey)"</h3>
      <p>This is the error everyone meets once. It means GitHub was not shown a key it recognises. Check, in order:</p>
      <ul>
        <li><strong>Is the key loaded?</strong> Run <code>ssh-add -l</code>. If it is empty, run <code>ssh-add ~/.ssh/id_ed25519</code> again.</li>
        <li><strong>Did you add the public key to the right GitHub account?</strong> Look under Settings → SSH and GPG keys.</li>
        <li><strong>Is this a different computer or terminal?</strong> Every machine needs its own key added to GitHub, and the agent must be running in the terminal you are using.</li>
      </ul>
      <p>For a detailed view of what SSH is trying, run <code>ssh -vT git@github.com</code>.</p>
    `,
    quiz: [
      { q: 'Which command tests your SSH connection to GitHub?', options: ['git test github', 'ssh -T git@github.com', 'ping github.com', 'git push --test'], answer: 1 },
      { q: 'You see "Hi username! You\'ve successfully authenticated, but GitHub does not provide shell access." What does it mean?', options: ['Something is broken', 'Your key works', 'You need a new key', 'GitHub is down'], answer: 1 },
      { q: 'You get "Permission denied (publickey)". What is a good first check?', options: ['Reinstall your operating system', 'Run ssh-add -l to see if your key is loaded', 'Delete your GitHub account', 'Change your Git user.name'], answer: 1 }
    ]
  },

  16: {
    title: 'Your first repository over SSH',
    desc: 'Clone with SSH, make a commit and push it, and switch an existing project from HTTPS to SSH.',
    topics: ['Clone with the SSH URL', 'add, commit, push', 'git remote set-url'],
    time: '~20 min',
    content: `
      <h3>Create a repository on GitHub</h3>
      <p>On GitHub, click <strong>New</strong> (or the <strong>+</strong> menu, then <strong>New repository</strong>). Name it <code>my-first-repo</code>, tick <strong>Add a README file</strong>, and click <strong>Create repository</strong>.</p>
      <h3>Clone it with SSH</h3>
      <p>Click the green <strong>Code</strong> button, choose the <strong>SSH</strong> tab, and copy the address. It looks like <code>git@github.com:YOUR-USERNAME/my-first-repo.git</code>.</p>
      <pre><code>git clone git@github.com:YOUR-USERNAME/my-first-repo.git
cd my-first-repo</code></pre>
      <h3>Make a change and push it</h3>
      <pre><code>echo "My first change" >> README.md
git status
git add README.md
git commit -m "Add my first change"
git push origin main</code></pre>
      <ul>
        <li><code>git status</code> shows what changed.</li>
        <li><code>git add</code> picks the changes to include in the next commit.</li>
        <li><code>git commit</code> saves the snapshot with a message.</li>
        <li><code>git push</code> sends it to GitHub. Refresh the repository page and your change is there.</li>
      </ul>
      <h3>An existing project on your computer</h3>
      <pre><code>cd path/to/your-project
git init
git add .
git commit -m "First commit"
git remote add origin git@github.com:YOUR-USERNAME/your-project.git
git push -u origin main</code></pre>
      <p>Create the empty repository on GitHub first (without a README), then run these.</p>
      <h3>Already cloned with HTTPS?</h3>
      <p>Check which address a repository uses, and switch it to SSH:</p>
      <pre><code>git remote -v
git remote set-url origin git@github.com:YOUR-USERNAME/REPO.git</code></pre>
      <div class="highlight">SSH addresses start with <code>git@github.com:</code>. HTTPS addresses start with <code>https://github.com/</code>. If pushes keep asking for a password, you are on HTTPS.</div>
    `,
    quiz: [
      { q: 'Which is an SSH address for a GitHub repository?', options: ['https://github.com/user/repo.git', 'git@github.com:user/repo.git', 'ssh://github.com/user', 'github.com/user/repo'], answer: 1 },
      { q: 'What is the right order to save and upload a change?', options: ['push, commit, add', 'commit, add, push', 'add, commit, push', 'add, push, commit'], answer: 2 },
      { q: 'How do you switch an existing repository from HTTPS to SSH?', options: ['git remote set-url origin git@github.com:user/repo.git', 'git clone --ssh', 'git config --global ssh true', 'Delete the folder and start again'], answer: 0 }
    ]
  },

  17: {
    title: 'Final check & certificate',
    desc: 'A short review, then a 10-question check. Score 70% or more to earn your certificate.',
    topics: ['Review of every step', '10-question final check', 'Your certificate'],
    time: '~15 min',
    content: `
      <h3>What you can do now</h3>
      <ul>
        <li><strong>Module 1:</strong> Git tracks your project's history on your computer; GitHub hosts repositories online. SSH keys prove it is you.</li>
        <li><strong>Module 2:</strong> Git is installed and <code>git --version</code> answers.</li>
        <li><strong>Module 3:</strong> Your name and email are set, new repositories start on <code>main</code>, and line endings are handled.</li>
        <li><strong>Module 4:</strong> You have an ed25519 key pair with a passphrase, loaded into the SSH agent. The private key stays private.</li>
        <li><strong>Module 5:</strong> Your public key is on GitHub and <code>ssh -T git@github.com</code> greets you by name.</li>
        <li><strong>Module 6:</strong> You can clone over SSH, add, commit and push, and switch a repository from HTTPS to SSH.</li>
      </ul>
      <div class="highlight">Answer the 10 questions below. You need 7 correct (70%) to pass. When you pass, mark the module complete and your certificate downloads.</div>
    `,
    quiz: [
      { q: 'Where does Git run?', options: ['Only on GitHub', 'On your computer', 'Only on servers', 'In your browser'], answer: 1 },
      { q: 'Which command checks the installed Git version?', options: ['git --version', 'git info', 'git status', 'git check'], answer: 0 },
      { q: 'Which setting makes GitHub link commits to your profile?', options: ['core.autocrlf', 'user.email', 'init.defaultBranch', 'core.editor'], answer: 1 },
      { q: 'Which key type does this course recommend?', options: ['dsa', 'ed25519', 'rsa 1024', 'md5'], answer: 1 },
      { q: 'Which file do you add to GitHub?', options: ['~/.ssh/id_ed25519', '~/.ssh/id_ed25519.pub', '~/.gitconfig', '~/.ssh/known_hosts'], answer: 1 },
      { q: 'Why add a passphrase to your key?', options: ['GitHub requires it', 'It protects the key if your computer is lost or stolen', 'It makes the key shorter', 'It is needed to clone public repositories'], answer: 1 },
      { q: 'Where do you add a new SSH key on GitHub?', options: ['Repository → Issues', 'Settings → SSH and GPG keys', 'Profile → Followers', 'Settings → Billing'], answer: 1 },
      { q: 'What does "Permission denied (publickey)" usually mean?', options: ['GitHub could not match a key it knows to you', 'The repository is empty', 'Your internet is slow', 'Git is not installed'], answer: 0 },
      { q: 'What does git commit do?', options: ['Uploads to GitHub', 'Saves a snapshot of staged changes with a message', 'Downloads a repository', 'Deletes a branch'], answer: 1 },
      { q: 'Which command changes a repository\'s remote to an SSH address?', options: ['git remote set-url origin git@github.com:user/repo.git', 'git push --ssh', 'git clone origin', 'ssh-add origin'], answer: 0 }
    ]
  }
};

/* ── Session-backed state ────────────────────────────────────
   profile shape: { email, name, phone, country, completed:[], cert_id } */
let profile = null;
let currentModule = null;
let quizAnswers = {};
let quizScore = 0;

/* fetch wrapper: on 401, tries one silent token refresh, then retries once */
async function apiFetch(url, opts = {}) {
  let r = await fetch(url, { credentials: 'same-origin', ...opts });
  if (r.status === 401) {
    const refreshed = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
    if (refreshed.ok) r = await fetch(url, { credentials: 'same-origin', ...opts });
  }
  return r;
}

/* ── Init ─────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', init);

async function init() {
  const r = await apiFetch('/api/trainee/me');
  if (!r.ok) { window.location.href = '/login.html'; return; }
  profile = await r.json();

  document.getElementById('tr-profile-form').addEventListener('submit', onProfileSubmit);
  document.getElementById('tr-lesson-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLesson();
  });

  if (profile.name) {
    showDashboard();
  } else {
    document.getElementById('tr-profile-gate').style.display = 'block';
  }
}

function showDashboard() {
  document.getElementById('tr-profile-gate').style.display = 'none';
  document.getElementById('tr-dashboard').style.display = 'block';
  document.getElementById('tr-welcome-name').textContent = `Welcome back, ${profile.name}`;
  renderModuleGrid();
  renderModuleStates();
  updateProgress();
}

/* ── Profile completion (first login only) ───────────────── */
async function onProfileSubmit(e) {
  e.preventDefault();
  let valid = true;
  const name = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const country = document.getElementById('profile-country').value;
  document.getElementById('err-profile-name').textContent = '';
  document.getElementById('err-profile-phone').textContent = '';
  if (name.length < 2) { document.getElementById('err-profile-name').textContent = 'Please enter your full name.'; valid = false; }
  if (phone.replace(/\D/g, '').length < 7) { document.getElementById('err-profile-phone').textContent = 'Please enter a valid phone number.'; valid = false; }
  if (!valid) return;

  const r = await apiFetch('/api/trainee/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, country })
  });
  if (!r.ok) {
    document.getElementById('err-profile-name').textContent = 'Something went wrong saving your profile — please try again.';
    return;
  }
  profile = await r.json();
  notifyViaWhatsApp(name, profile.email, phone, country);
  showDashboard();
}

function notifyViaWhatsApp(name, email, phone, country) {
  const message =
    `*New Git & GitHub course enrolment — Harts*\n\n` +
    `*Name:* ${name}\n` +
    `*Email:* ${email}\n` +
    `*WhatsApp:* ${phone}\n` +
    `*Country:* ${country}\n` +
    `*Time:* ${new Date().toLocaleString('en-GB')}\n\n` +
    `_Sent from app.hartsdigitalhub.com_`;
  window.open(`https://wa.me/237622341343?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/login.html';
}

/* ── Progress / module rendering ─────────────────────────── */

/* Only this course's modules count. Saved progress can still hold ids 1-10
   from the old AI course; those are ignored here and on the server. */
function completedIds() {
  return (profile.completed || []).filter(id => MODULE_IDS.includes(id));
}

function renderModuleGrid() {
  const grid = document.getElementById('tr-module-grid');
  grid.innerHTML = '';
  MODULE_IDS.forEach((id, i) => {
    const l = lessons[id];
    const card = document.createElement('article');
    card.className = 'tr-module-card';
    card.dataset.module = id;
    card.innerHTML = `
      <div class="tr-module-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="tr-module-body">
        <h3 class="tr-module-title"></h3>
        <p class="tr-module-desc"></p>
        <ul class="tr-module-topics"></ul>
        <div class="tr-module-footer">
          <span class="tr-module-time"></span>
          <button class="tr-module-btn" type="button">Start Lesson</button>
        </div>
      </div>
      <div class="tr-module-check" aria-hidden="true">&#10003;</div>`;
    card.querySelector('.tr-module-title').textContent = l.title;
    card.querySelector('.tr-module-desc').textContent = l.desc;
    card.querySelector('.tr-module-time').textContent = l.time;
    const ul = card.querySelector('.tr-module-topics');
    l.topics.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    card.querySelector('.tr-module-btn').addEventListener('click', () => openLesson(id));
    grid.appendChild(card);
  });
}

function updateProgress() {
  const completed = completedIds().length;
  const pct = Math.round((completed / TOTAL_MODULES) * 100);
  document.getElementById('tr-progress-bar').style.width = pct + '%';
  document.getElementById('tr-progress-label').textContent = `${completed} / ${TOTAL_MODULES} modules complete`;
  if (completed === TOTAL_MODULES) {
    document.getElementById('tr-cert-btn').style.display = 'inline-block';
  }
}

function renderModuleStates() {
  completedIds().forEach(num => {
    const card = document.querySelector(`[data-module="${num}"]`);
    if (card) {
      card.classList.add('completed');
      const btn = card.querySelector('.tr-module-btn');
      if (btn) btn.textContent = 'Review';
    }
  });
}

/* ── Lesson modal ─────────────────────────────────────────── */
function openLesson(num) {
  currentModule = num; quizAnswers = {}; quizScore = 0;
  const lesson = lessons[num];
  document.getElementById('lesson-num-label').textContent = `Module ${MODULE_IDS.indexOf(num) + 1} of ${TOTAL_MODULES}`;
  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-content').innerHTML = lesson.content;
  renderQuiz(num);
  /* The final check's "Mark as Complete" only appears once it is passed,
     unless the trainee already completed it and is just reviewing. */
  const finalPending = num === FINAL_ID && !completedIds().includes(FINAL_ID);
  document.getElementById('lesson-complete-btn').style.display = finalPending ? 'none' : '';
  const bd =document.getElementById('tr-lesson-backdrop');
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
  quizEl.innerHTML = `<p class="tr-quiz-title">Knowledge Check${num === FINAL_ID ? ' — Final Check' : ''}</p>`;
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

  if (moduleNum === FINAL_ID) {
    const total = lessons[FINAL_ID].quiz.length;
    const answered = Object.keys(quizAnswers).filter(k => k.startsWith(`${FINAL_ID}-`)).length;
    if (answered === total) showFinalExamResult(quizScore, total);
  }
}

function showFinalExamResult(score, total) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= PASS_PCT;
  const el = document.getElementById('lesson-quiz');
  const result = document.createElement('div');
  result.style.cssText = 'margin-top:2rem;padding:1.5rem;border:1px solid;border-radius:0.75rem;text-align:center;';
  result.style.borderColor = passed ? '#c8a96e' : '#f87171';
  result.innerHTML = passed
    ? `<p style="font-family:var(--font-display);font-size:1.3rem;color:#c8a96e;margin-bottom:0.5rem;">You passed! ${score}/${total} correct (${pct}%)</p>
       <p style="color:#aaa;font-size:0.88rem;margin-bottom:1.25rem;">Congratulations. Click "Mark as Complete". Once all 7 modules are complete, your certificate downloads.</p>`
    : `<p style="font-family:var(--font-display);font-size:1.1rem;color:#f87171;margin-bottom:0.5rem;">${score}/${total} correct (${pct}%) — not quite there yet</p>
       <p style="color:#aaa;font-size:0.88rem;">You need ${PASS_PCT}% to pass. Go back over the earlier modules, then open this one again to retake it.</p>`;
  el.appendChild(result);
  document.getElementById('lesson-complete-btn').style.display = passed ? '' : 'none';
}

async function completeLesson() {
  if (!currentModule) return;
  if (currentModule === FINAL_ID && quizScore < Math.ceil(lessons[FINAL_ID].quiz.length * PASS_PCT / 100)) return;
  const moduleJustCompleted = currentModule;

  const r = await apiFetch('/api/trainee/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: moduleJustCompleted })
  });
  if (r.ok) profile = await r.json();

  const card = document.querySelector(`[data-module="${moduleJustCompleted}"]`);
  if (card) { card.classList.add('completed'); const btn = card.querySelector('.tr-module-btn'); if (btn) btn.textContent = 'Review'; }
  updateProgress();

  if (completedIds().length === TOTAL_MODULES) {
    closeLesson();
    setTimeout(() => {
      generateCertificate();
      document.getElementById('tr-progress-section').scrollIntoView({ behavior: 'smooth' });
    }, 400);
    return;
  }
  closeLesson();
}

/* ── Certificate — gold/black design (unchanged from training.js,
     but name + cert ID now come from the server-issued profile) ── */
function generateCertificate() {
  const canvas = document.getElementById('cert-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1200, H = 840;
  const name = profile.name || 'Learner';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const certId = profile.git_cert_id || 'PENDING';

  const gold = '#4F8CFF';   /* the site accent, --signal */
  const black = '#0a0a0a';
  const white = '#ffffff';
  const muted = '#888888';

  ctx.fillStyle = white; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = black; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = white; ctx.fillRect(10, 10, W - 20, H - 20);

  ctx.strokeStyle = gold; ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 0.8;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  ctx.fillStyle = black; ctx.fillRect(10, 10, W - 20, 64);

  ctx.fillStyle = white; ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HARTS · HARTS DIGITAL HUB · hartsdigitalhub.com', W / 2, 48);

  ctx.fillStyle = gold; ctx.fillRect(10, 74, W - 20, 4);

  const ornament = (x, y, size) => {
    ctx.fillStyle = gold; ctx.font = `${size}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.fillText('✦', x, y);
  };
  ornament(62, 120, 22); ornament(W - 62, 120, 22);
  ornament(62, H - 60, 22); ornament(W - 62, H - 60, 22);

  ctx.fillStyle = muted; ctx.font = '13px Georgia, serif';
  ctx.letterSpacing = '5px';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', W / 2, 130);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = gold; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(300, 142); ctx.lineTo(900, 142); ctx.stroke();

  ctx.fillStyle = muted; ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('This is to certify that', W / 2, 188);

  ctx.fillStyle = black; ctx.font = `bold 54px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(name, W / 2, 265);

  ctx.strokeStyle = black; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(180, 278); ctx.lineTo(1020, 278); ctx.stroke();

  ctx.fillStyle = muted; ctx.font = 'italic 15px Georgia, serif';
  ctx.fillText('has completed all 7 modules and passed the final check of', W / 2, 318);

  ctx.fillStyle = black; ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('Git & GitHub with SSH Keys', W / 2, 366);

  ctx.fillStyle = muted; ctx.font = '13px Georgia, serif';
  ctx.fillText('INSTALL · CONFIGURE · SSH KEYS · FIRST PUSH', W / 2, 396);

  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 430); ctx.lineTo(1140, 430); ctx.stroke();

  ctx.fillStyle = muted; ctx.font = '11px Georgia, serif';
  ctx.letterSpacing = '3px'; ctx.textAlign = 'center';
  ctx.fillText('DATE ISSUED', 190, 470);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = black; ctx.font = '18px Georgia, serif';
  ctx.fillText(date, 190, 500);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(60, 512); ctx.lineTo(320, 512); ctx.stroke();

  const cx = W / 2, cy = 508;
  ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.fillStyle = black; ctx.fill();
  ctx.strokeStyle = gold; ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.strokeStyle = gold; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = gold; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('HARTS', cx, cy - 8);
  ctx.font = '10px Georgia, serif';
  ctx.fillText('CERTIFIED', cx, cy + 8);
  ctx.font = '9px Georgia, serif';
  ctx.fillText('DIGITAL HUB', cx, cy + 22);

  ctx.fillStyle = muted; ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('AUTHORISED BY', 1010, 470);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = black; ctx.font = 'italic bold 22px Georgia, serif';
  ctx.fillText('Harts', 1010, 500);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(880, 512); ctx.lineTo(1140, 512); ctx.stroke();
  ctx.fillStyle = muted; ctx.font = '12px Georgia, serif';
  ctx.fillText('Harts Digital Hub', 1010, 526);

  ctx.fillStyle = gold; ctx.fillRect(10, H - 50, W - 20, 6);
  ctx.fillStyle = black; ctx.fillRect(10, H - 44, W - 20, 34);

  ctx.fillStyle = gold; ctx.font = '12px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(`Certificate ID: ${certId} · hartsdigitalhub.com/verify`, W / 2, H - 20);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Harts-Git-GitHub-Certificate-${name.replace(/\s+/g, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLesson(); });
