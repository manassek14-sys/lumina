// ===== Lumina — Inspiring local messaging circle =====

const STORAGE_KEY = 'lumina_user';
const MESSAGES_KEY = 'lumina_messages';
const USERS_KEY = 'lumina_known_users';

const QUOTES = [
  "« La lumière que tu cherches est déjà en toi. »",
  "« Chaque petit pas compte plus que tu ne l'imagines. »",
  "« Sois la lumière que tu souhaites voir dans le monde. »",
  "« Les mots doux ont le pouvoir de guérir des cœurs. »",
  "« Aujourd'hui est une page blanche. Écris-y de la beauté. »",
  "« Ta présence est déjà un cadeau pour quelqu'un. »",
  "« Respire. Tu es exactement là où tu dois être. »",
  "« L'inspiration naît souvent dans le silence. »"
];

const SEED_MESSAGES = [
  {
    id: 'seed1',
    author: 'Luna',
    color: '#7c6af5',
    text: 'Bienvenue dans ce cercle. Ici, chaque message est une graine d\'inspiration. 🌱',
    time: Date.now() - 1000 * 60 * 60 * 5
  },
  {
    id: 'seed2',
    author: 'Soleil Levant',
    color: '#f59e0b',
    text: 'Ce matin j\'ai regardé le ciel et j\'ai réalisé que chaque lever de soleil est une promesse renouvelée.',
    time: Date.now() - 1000 * 60 * 60 * 3
  },
  {
    id: 'seed3',
    author: 'Océane',
    color: '#06b6d4',
    text: 'Parfois le simple fait d\'écrire une pensée la rend plus claire. Merci d\'être ici.',
    time: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'seed4',
    author: 'Étoile',
    color: '#ec4899',
    text: 'À ceux qui doutent : vous avez déjà survécu à 100 % de vos jours les plus difficiles. Continuez.',
    time: Date.now() - 1000 * 60 * 20
  }
];

const SEED_USERS = [
  { name: 'Luna', bio: 'Gardienne de lumière douce', color: '#7c6af5' },
  { name: 'Soleil Levant', bio: 'Chaque matin est un recommencement', color: '#f59e0b' },
  { name: 'Océane', bio: 'Je collectionne les vagues et les mots', color: '#06b6d4' },
  { name: 'Étoile', bio: 'Briller même dans l\'obscurité', color: '#ec4899' }
];

// ===== State =====
let currentUser = null;
let selectedColor = '#7c6af5';

// ===== DOM =====
const landing = document.getElementById('landing');
const app = document.getElementById('app');
const joinForm = document.getElementById('join-form');
const createForm = document.getElementById('create-form');
const tabs = document.querySelectorAll('.tab');
const colorBtns = document.querySelectorAll('.color-btn');
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const profileBtn = document.getElementById('profile-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfile = document.getElementById('close-profile');
const logoutBtn = document.getElementById('logout-btn');
const onlineUsersEl = document.getElementById('online-users');
const dailyQuotesEl = document.getElementById('daily-quotes');
const rotatingQuote = document.getElementById('rotating-quote');

// ===== Init =====
function init() {
  // Rotate quote on landing
  let qIndex = 0;
  setInterval(() => {
    qIndex = (qIndex + 1) % QUOTES.length;
    rotatingQuote.style.opacity = 0;
    setTimeout(() => {
      rotatingQuote.textContent = QUOTES[qIndex];
      rotatingQuote.style.opacity = 1;
    }, 300);
  }, 6000);

  // Check existing user
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
    enterApp();
  }

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      document.getElementById(tab.dataset.tab === 'join' ? 'join-form' : 'create-form').classList.add('active');
    });
  });

  // Color picker
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
    });
  });

  // Forms
  joinForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('join-name').value.trim();
    if (!name) return;
    currentUser = {
      name,
      bio: '',
      color: selectedColor,
      joined: Date.now()
    };
    saveUser();
    enterApp();
  });

  createForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('create-name').value.trim();
    const bio = document.getElementById('create-bio').value.trim();
    if (!name) return;
    currentUser = {
      name,
      bio,
      color: selectedColor,
      joined: Date.now()
    };
    saveUser();
    // Add to known users
    addKnownUser(currentUser);
    enterApp();
  });

  // Message
  messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    addMessage({
      id: 'msg_' + Date.now(),
      author: currentUser.name,
      color: currentUser.color,
      text,
      time: Date.now()
    });
    messageInput.value = '';
    messageInput.focus();
  });

  // Profile
  profileBtn.addEventListener('click', showProfile);
  closeProfile.addEventListener('click', () => profileModal.classList.remove('active'));
  logoutBtn.addEventListener('click', logout);

  // Close modal on outside click
  profileModal.addEventListener('click', e => {
    if (e.target === profileModal) profileModal.classList.remove('active');
  });
}

function saveUser() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
}

function addKnownUser(user) {
  let known = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (!known.find(u => u.name === user.name)) {
    known.push({ name: user.name, bio: user.bio, color: user.color });
    localStorage.setItem(USERS_KEY, JSON.stringify(known));
  }
}

function enterApp() {
  landing.classList.remove('active');
  app.classList.add('active');

  // Avatar button
  profileBtn.style.background = currentUser.color;
  profileBtn.textContent = currentUser.name.charAt(0).toUpperCase();

  renderMessages();
  renderSidebar();
  renderDailyQuotes();
}

function getMessages() {
  let msgs = JSON.parse(localStorage.getItem(MESSAGES_KEY) || 'null');
  if (!msgs) {
    msgs = [...SEED_MESSAGES];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  }
  return msgs;
}

function addMessage(msg) {
  const msgs = getMessages();
  msgs.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  renderMessages(true);
}

function renderMessages(scrollToBottom = true) {
  const msgs = getMessages();
  messagesEl.innerHTML = '';

  if (msgs.length === 0) {
    messagesEl.innerHTML = `
      <div class="empty-state">
        <div class="icon">✦</div>
        <p>Le cercle est silencieux...<br>Sois le premier à partager une lumière.</p>
      </div>`;
    return;
  }

  msgs.forEach(msg => {
    const isOwn = currentUser && msg.author === currentUser.name;
    const div = document.createElement('div');
    div.className = 'message' + (isOwn ? ' own' : '');
    div.innerHTML = `
      <div class="message-avatar" style="background:${msg.color}">${msg.author.charAt(0).toUpperCase()}</div>
      <div class="message-body">
        <div class="message-header">
          <span class="message-author" style="color:${msg.color}">${escapeHtml(msg.author)}</span>
          <span class="message-time">${formatTime(msg.time)}</span>
        </div>
        <div class="message-text">${escapeHtml(msg.text)}</div>
      </div>
    `;
    messagesEl.appendChild(div);
  });

  if (scrollToBottom) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

function renderSidebar() {
  let known = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  // Merge seeds
  const all = [...SEED_USERS];
  known.forEach(u => {
    if (!all.find(s => s.name === u.name)) all.push(u);
  });
  // Add current if not there
  if (currentUser && !all.find(u => u.name === currentUser.name)) {
    all.unshift({ name: currentUser.name, bio: currentUser.bio || 'Membre du cercle', color: currentUser.color });
  }

  onlineUsersEl.innerHTML = all.map(u => `
    <div class="user-item">
      <div class="user-avatar" style="background:${u.color}">${u.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${escapeHtml(u.name)}</div>
        <div class="user-bio">${escapeHtml(u.bio || '')}</div>
      </div>
    </div>
  `).join('');
}

function renderDailyQuotes() {
  // Pick 3 random quotes
  const shuffled = [...QUOTES].sort(() => 0.5 - Math.random()).slice(0, 3);
  dailyQuotesEl.innerHTML = shuffled.map(q => `
    <div class="quote-card">${q}</div>
  `).join('');
}

function showProfile() {
  const view = document.getElementById('profile-view');
  const joined = new Date(currentUser.joined).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  view.innerHTML = `
    <div class="profile-avatar-large" style="background:${currentUser.color}">
      ${currentUser.name.charAt(0).toUpperCase()}
    </div>
    <div class="profile-name">${escapeHtml(currentUser.name)}</div>
    <div class="profile-bio">${escapeHtml(currentUser.bio || 'Aucune bio pour le moment')}</div>
    <div class="profile-joined">Rejoint le ${joined}</div>
  `;
  profileModal.classList.add('active');
}

function logout() {
  localStorage.removeItem(STORAGE_KEY);
  currentUser = null;
  profileModal.classList.remove('active');
  app.classList.remove('active');
  landing.classList.add('active');
  // Reset forms
  joinForm.reset();
  createForm.reset();
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Start
init();
