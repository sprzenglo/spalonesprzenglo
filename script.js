const API_BASE = 'https://spalonesprzenglo-backend.onrender.com'; // Twój backend

// --- Auth Section ---
function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('open-auth-btn').style.display = 'none';
}
function hideAuthSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('open-auth-btn').style.display = 'block';
}

// --- Collapsible categories ---
function toggleCategory(id) {
  document.getElementById(id).classList.toggle('open');
}
document.getElementById('cat-animals').classList.add('open');

// --- Search logic ---
let articles = [];
window.addEventListener('DOMContentLoaded', () => {
  articles = Array.from(document.querySelectorAll('.article-link'))
                  .map(a => ({ name: a.textContent.trim(), link: a.getAttribute('href') }));
  loadAuth();
});

function showSuggestions() {
  const input = document.getElementById('search').value.trim().toLowerCase();
  const sugg = document.getElementById('suggestions');
  const searchInput = document.getElementById('search');
  if (!input) { sugg.style.display='none'; sugg.innerHTML=''; return; }
  const matches = articles.filter(a => a.name.toLowerCase().includes(input)).slice(0,5);
  if (!matches.length) { sugg.style.display='none'; sugg.innerHTML=''; return; }
  sugg.innerHTML = matches.map(a => `<li style='padding:6px; cursor:pointer;' onclick="window.location.href='${a.link}'">${a.name}</li>`).join('');
  const rect = searchInput.getBoundingClientRect();
  sugg.style.left = searchInput.offsetLeft+'px';
  sugg.style.top = (searchInput.offsetTop + searchInput.offsetHeight)+'px';
  sugg.style.display='block';
}

function searchGo() {
  const input = document.getElementById('search').value.trim().toLowerCase();
  if (!input) return;
  const match = articles.find(a=>a.name.toLowerCase()===input) || articles.find(a=>a.name.toLowerCase().includes(input));
  if (match) window.location.href = match.link;
}

function searchKeyDown(e) { if(e.key==='Enter') searchGo(); }
document.addEventListener('click', e => { if(!document.getElementById('search').contains(e.target)) document.getElementById('suggestions').style.display='none'; });

// --- Auth & User Logic ---
let currentUser = null;

async function register() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (!u || !p) { showAuthMsg('Podaj nazwę i hasło'); return; }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username: u, password: p})
    });
    const data = await res.json();
    if (data.success) {
      currentUser = u;
      localStorage.setItem('currentUser', currentUser);
      showAuthMsg('');
      loadAuth();
    } else {
      showAuthMsg(data.msg || 'Błąd rejestracji');
    }
  } catch(err) {
    showAuthMsg(err.message);
  }
}

async function login() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (!u || !p) { showAuthMsg('Podaj nazwę i hasło'); return; }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username: u, password: p})
    });
    const data = await res.json();
    if (data.success) {
      currentUser = u;
      localStorage.setItem('currentUser', currentUser);
      showAuthMsg('');
      loadAuth();
    } else {
      showAuthMsg(data.msg || 'Błędna nazwa lub hasło');
    }
  } catch(err) {
    showAuthMsg(err.message);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  hideAuthSection();
  loadAuth();
}

function showAuthMsg(msg) {
  document.getElementById('auth-msg').textContent = msg;
}

// --- Load user panel ---
async function loadAuth() {
  currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('user-panel').style.display = 'block';
    document.getElementById('welcome-msg').textContent = 'Witaj, '+currentUser+'!';
    await loadUserActions();
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('open-auth-btn').style.display = 'none';
  } else {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('user-panel').style.display = 'none';
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('open-auth-btn').style.display = 'block';
  }
}

// --- Load user/admin panel ---
async function loadUserActions() {
  const panel = document.getElementById('user-actions');
  if (currentUser === 'sprzenglo') {
    // Admin panel
    try {
      const res = await fetch(`${API_BASE}/pending`);
      const pending = await res.json();
      panel.innerHTML = `<h4>Panel admina: oczekujące artykuły</h4>` + 
        (pending.length === 0 ? '<i>Brak oczekujących artykułów</i>' :
        '<ul>'+pending.map(a=>`<li><b>${a.title}</b> (${a.category})<br>${a.content}<br><button onclick='acceptArticle("${a._id}")'>Akceptuj</button> <button onclick='deleteArticle("${a._id}")'>Usuń</button> <span style="font-size:0.9em;color:#888;">autor: ${a.author}</span></li>`).join('')+'</ul>');
    } catch(err) {
      panel.innerHTML = `<p>Błąd pobierania artykułów: ${err.message}</p>`;
    }
  } else {
    // User panel
    panel.innerHTML = `<h4>Dodaj artykuł</h4>
      <select id='article-category'>
        <option value='Zwierzęta'>Zwierzęta</option>
        <option value='top samochody oat'>top samochody oat</option>
        <option value='śmieszne obrazki'>śmieszne obrazki</option>
        <option value='Kategoria 4'>Kategoria 4</option>
        <option value='Kategoria 5'>Kategoria 5</option>
      </select><br>
      <input type='text' id='article-title' placeholder='Tytuł artykułu' style='width:100%;margin:6px 0;'><br>
      <textarea id='article-content' placeholder='Treść artykułu' style='width:100%;height:80px;'></textarea><br>
      <button onclick='submitArticle()'>Wyślij do akceptacji</button>
      <div id='user-article-msg' style='color:green;margin-top:8px;'></div>`;
  }
}

// --- Submit article ---
async function submitArticle() {
  const cat = document.getElementById('article-category').value;
  const title = document.getElementById('article-title').value.trim();
  const content = document.getElementById('article-content').value.trim();
  if (!title || !content) { document.getElementById('user-article-msg').textContent='Podaj tytuł i treść artykułu'; return; }

  try {
    const res = await fetch(`${API_BASE}/article`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({author: currentUser, category: cat, title, content})
    });
    const data = await res.json();
    if(data.success) {
      document.getElementById('user-article-msg').textContent='Artykuł wysłany do akceptacji!';
      loadUserActions();
    } else {
      document.getElementById('user-article-msg').textContent=data.msg || 'Błąd';
    }
  } catch(err) {
    document.getElementById('user-article-msg').textContent='Błąd: '+err.message;
  }
}

// --- Admin actions ---
async function acceptArticle(id) {
  await fetch(`${API_BASE}/approve`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id})
  });
  loadUserActions();
}

async function deleteArticle(id) {
  await fetch(`${API_BASE}/delete`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id})
  });
  loadUserActions();
}
// --- End of script.js --- 