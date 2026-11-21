const CUSTOM_GAMES_STORAGE_KEY = 'recess_arcade_custom_games_v1';

const ICONS = {
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>',
  gamepad: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><line x1="6" y1="11" x2="10" y2="11"></line><line x1="8" y1="9" x2="8" y2="13"></line><line x1="15" y1="12" x2="15.01" y2="12"></line><line x1="18" y1="10" x2="18.01" y2="10"></line><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"></path></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

const state = {
  baseGames: [],
  customGames: loadCustomGames(),
  catalogPrefix: './',
  selectedCategory: 'All',
  searchQuery: '',
  activeGame: null,
  theaterFocus: false,
  reloadCounter: 0
};

const els = {
  heroSection: document.getElementById('heroSection'),
  heroMeta: document.getElementById('heroMeta'),
  theaterSection: document.getElementById('theaterSection'),
  theaterTitle: document.getElementById('theaterTitle'),
  theaterCategory: document.getElementById('theaterCategory'),
  theaterControls: document.getElementById('theaterControls'),
  theaterStage: document.getElementById('theaterStage'),
  theaterDesc: document.getElementById('theaterDesc'),
  theaterSrc: document.getElementById('theaterSrc'),
  reloadBtn: document.getElementById('reloadBtn'),
  focusBtn: document.getElementById('focusBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  closeTheaterBtn: document.getElementById('closeTheaterBtn'),
  filterTabs: document.getElementById('filterTabs'),
  searchInput: document.getElementById('searchInput'),
  gridContainer: document.getElementById('gridContainer'),
  jsonPreview: document.getElementById('jsonPreview'),
  jsonCount: document.getElementById('jsonCount'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
  resetCustomBtn: document.getElementById('resetCustomBtn'),
  randomBtn: document.getElementById('randomBtn'),
  addGameBtn: document.getElementById('addGameBtn'),
  brandLink: document.getElementById('brandLink'),
  addModal: document.getElementById('addModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  addGameForm: document.getElementById('addGameForm'),
  formError: document.getElementById('formError'),
  gameTitleInput: document.getElementById('gameTitleInput'),
  gameCategoryInput: document.getElementById('gameCategoryInput'),
  gameIframeInput: document.getElementById('gameIframeInput'),
  gameControlsInput: document.getElementById('gameControlsInput'),
  gameDescInput: document.getElementById('gameDescInput')
};

function loadCustomGames() {
  try {
    const raw = localStorage.getItem(CUSTOM_GAMES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomGames() {
  try {
    localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(state.customGames));
  } catch {
    // Ignore storage quota errors
  }
}

function isSafeIframeSrc(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('./') || trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function resolveCatalogRelativeUrl(src) {
  if (state.catalogPrefix === './public/' && (src.startsWith('./') || (src.startsWith('/') && !src.startsWith('//')))) {
    const clean = src.replace(/^\.?\//, '');
    return `./public/${clean}`;
  }
  return src;
}

function sanitizeIframeStyle(rawStyle) {
  if (!rawStyle) return '';
  const lower = rawStyle.toLowerCase();
  if (lower.includes('url(') || lower.includes('expression') || lower.includes('javascript:')) {
    return '';
  }
  return rawStyle.trim();
}

function parseIframeHtml(iframeHtml, fallbackTitle = 'Embedded Game') {
  const raw = String(iframeHtml || '').trim();

  if (raw && !raw.startsWith('<')) {
    const valid = isSafeIframeSrc(raw);
    return {
      src: valid ? resolveCatalogRelativeUrl(raw) : '',
      title: fallbackTitle,
      id: '',
      className: '',
      allow: 'fullscreen; autoplay',
      loading: 'lazy',
      scrolling: '',
      style: '',
      allowFullscreen: true,
      valid
    };
  }

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const el = doc.querySelector('iframe');
    if (!el) {
      return { src: '', title: fallbackTitle, id: '', className: '', allow: '', loading: '', scrolling: '', style: '', allowFullscreen: false, valid: false };
    }
    const src = el.getAttribute('src') || '';
    const valid = isSafeIframeSrc(src);
    return {
      src: valid ? resolveCatalogRelativeUrl(src) : '',
      title: el.getAttribute('title') || fallbackTitle,
      id: el.getAttribute('id') || '',
      className: el.getAttribute('class') || '',
      allow: el.getAttribute('allow') || '',
      loading: el.getAttribute('loading') || '',
      scrolling: el.getAttribute('scrolling') || '',
      style: sanitizeIframeStyle(el.getAttribute('style') || ''),
      allowFullscreen: el.hasAttribute('allowfullscreen'),
      valid
    };
  } catch {
    return { src: '', title: fallbackTitle, id: '', className: '', allow: '', loading: '', scrolling: '', style: '', allowFullscreen: false, valid: false };
  }
}

function buildIframeSnippet(src, title) {
  const safeTitle = title.replace(/"/g, '&quot;');
  const safeSrc = src.replace(/"/g, '&quot;');
  return `<iframe src="${safeSrc}" title="${safeTitle}" allow="fullscreen; autoplay" loading="lazy"></iframe>`;
}

function getAllGames() {
  return [...state.baseGames, ...state.customGames];
}

async function fetchCatalog() {
  renderLoadingState();
  const candidates = [
    { url: './games.json', prefix: './' },
    { url: './public/games.json', prefix: './public/' }
  ];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate.url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.games)) {
        state.baseGames = data.games;
        state.catalogPrefix = candidate.prefix;
        renderAll();
        return;
      }
    } catch {
      // Try next candidate path
    }
  }

  renderErrorState('Unable to load games.json. Make sure games.json is served alongside index.html.');
}

function renderLoadingState() {
  els.gridContainer.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'game-grid';
  for (let i = 0; i < 6; i++) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = '<div class="skeleton-thumb"></div><div class="card-body"><div class="skeleton-line-sm"></div><div class="skeleton-line-lg"></div></div>';
    grid.appendChild(card);
  }
  els.gridContainer.appendChild(grid);
}

function renderErrorState(message) {
  els.gridContainer.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'state-box';

  const heading = document.createElement('h2');
  heading.textContent = 'Catalog Unavailable';

  const text = document.createElement('p');
  text.textContent = message;

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'btn-dark';
  retryBtn.textContent = 'Retry Loading';
  retryBtn.addEventListener('click', fetchCatalog);

  box.append(heading, text, retryBtn);
  els.gridContainer.appendChild(box);
}

function renderHero() {
  const count = getAllGames().length;
  els.heroMeta.innerHTML = '';
  const parts = ['HTML5 Browser Games', `${count} Iframe Entries`, 'Local JSON Catalog'];
  parts.forEach((part, index) => {
    if (index > 0) {
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      dot.textContent = '·';
      els.heroMeta.appendChild(dot);
    }
    const span = document.createElement('span');
    span.textContent = part;
    els.heroMeta.appendChild(span);
  });

  els.randomBtn.disabled = count === 0;
  if (state.activeGame) {
    els.heroSection.classList.add('hidden');
  } else {
    els.heroSection.classList.remove('hidden');
  }
}

function renderTheater() {
  const game = state.activeGame;
  if (!game) {
    els.theaterSection.classList.add('hidden');
    els.theaterSection.classList.remove('theater-focus');
    els.theaterStage.innerHTML = '';
    return;
  }

  els.theaterSection.classList.remove('hidden');
  els.theaterSection.classList.toggle('theater-focus', state.theaterFocus);
  els.focusBtn.textContent = state.theaterFocus ? 'Exit Focus' : 'Focus Mode';

  els.theaterTitle.textContent = game.title;
  els.theaterCategory.textContent = game.category;
  els.theaterControls.textContent = game.controls;
  els.theaterDesc.textContent = game.description;

  const parsed = parseIframeHtml(game.iframe, game.title);
  els.theaterSrc.textContent = parsed.src || 'Invalid URL';
  els.theaterStage.innerHTML = '';

  if (parsed.valid) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', parsed.src);
    if (parsed.title) iframe.setAttribute('title', parsed.title);
    if (parsed.id) iframe.setAttribute('id', parsed.id);
    iframe.className = parsed.className ? `theater-iframe ${parsed.className}` : 'theater-iframe';
    if (parsed.allow) iframe.setAttribute('allow', parsed.allow);
    if (parsed.loading) iframe.setAttribute('loading', parsed.loading);
    if (parsed.scrolling) iframe.setAttribute('scrolling', parsed.scrolling);
    if (parsed.allowFullscreen) iframe.setAttribute('allowfullscreen', '');
    if (parsed.style) iframe.setAttribute('style', parsed.style);
    els.theaterStage.appendChild(iframe);
  } else {
    const err = document.createElement('div');
    err.className = 'theater-error';
    const h = document.createElement('p');
    h.className = 'theater-error-title';
    h.textContent = 'Invalid iframe source';
    const p = document.createElement('p');
    p.className = 'theater-error-desc';
    p.textContent = 'This entry does not contain a valid HTTP, HTTPS, or local game iframe URL.';
    err.append(h, p);
    els.theaterStage.appendChild(err);
  }
}

function renderFilterTabs() {
  const games = getAllGames();
  const categories = ['All', ...Array.from(new Set(games.map((g) => g.category)))];
  els.filterTabs.innerHTML = '';

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.className = `filter-tab${state.selectedCategory === cat ? ' active' : ''}`;
    btn.setAttribute('aria-selected', String(state.selectedCategory === cat));
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      state.selectedCategory = cat;
      renderFilterTabs();
      renderGameGrid();
    });
    els.filterTabs.appendChild(btn);
  });
}

function createThumbFallback(title) {
  const fallback = document.createElement('div');
  fallback.className = 'card-thumb-fallback';
  fallback.innerHTML = ICONS.gamepad;
  const label = document.createElement('span');
  label.className = 'brand fallback-title';
  label.textContent = title;
  fallback.appendChild(label);
  return fallback;
}

function renderGameGrid() {
  const games = getAllGames();
  const q = state.searchQuery.trim().toLowerCase();
  const filtered = games.filter((game) => {
    const matchesCat = state.selectedCategory === 'All' || game.category === state.selectedCategory;
    const matchesQuery =
      !q ||
      game.title.toLowerCase().includes(q) ||
      game.description.toLowerCase().includes(q) ||
      game.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  els.gridContainer.innerHTML = '';

  if (games.length === 0) {
    const box = document.createElement('div');
    box.className = 'state-box';
    const heading = document.createElement('h2');
    heading.textContent = 'No games in catalog';
    const text = document.createElement('p');
    text.textContent = 'Add an iframe game entry using the button below or edit public/games.json.';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-primary';
    addBtn.textContent = 'Add Game';
    addBtn.addEventListener('click', openAddModal);
    box.append(heading, text, addBtn);
    els.gridContainer.appendChild(box);
    return;
  }

  if (filtered.length === 0) {
    const box = document.createElement('div');
    box.className = 'state-box';
    const heading = document.createElement('h2');
    heading.textContent = 'No matching games';
    const text = document.createElement('p');
    text.textContent = 'Try clearing your search term or switching back to all categories.';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn-dark';
    resetBtn.textContent = 'Reset Filters';
    resetBtn.addEventListener('click', () => {
      state.selectedCategory = 'All';
      state.searchQuery = '';
      els.searchInput.value = '';
      renderFilterTabs();
      renderGameGrid();
    });
    box.append(heading, text, resetBtn);
    els.gridContainer.appendChild(box);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'game-grid';

  filtered.forEach((game) => {
    const isActive = state.activeGame && state.activeGame.id === game.id;
    const card = document.createElement('article');
    card.className = `game-card${isActive ? ' active' : ''}`;

    const thumbBtn = document.createElement('button');
    thumbBtn.type = 'button';
    thumbBtn.className = 'card-thumb-btn';
    thumbBtn.addEventListener('click', () => playGame(game));

    if (game.thumbnail) {
      const img = document.createElement('img');
      img.className = 'card-thumb-img';
      img.src = game.thumbnail.startsWith('/') ? `.${game.thumbnail}` : game.thumbnail;
      img.alt = `${game.title} cover artwork`;
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => {
        img.replaceWith(createThumbFallback(game.title));
      });
      thumbBtn.appendChild(img);
    } else {
      thumbBtn.appendChild(createThumbFallback(game.title));
    }

    const overlay = document.createElement('div');
    overlay.className = 'card-thumb-overlay';
    overlay.innerHTML = `<span class="card-play-badge">${ICONS.play}<span>Play</span></span>`;
    thumbBtn.appendChild(overlay);

    const body = document.createElement('div');
    body.className = 'card-body';

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const catSpan = document.createElement('span');
    catSpan.className = 'card-category';
    catSpan.textContent = game.category;
    const sep = document.createElement('span');
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '·';
    const typeSpan = document.createElement('span');
    typeSpan.textContent = game.isCustom ? 'Custom Entry' : 'HTML5 Iframe';
    meta.append(catSpan, sep, typeSpan);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = game.title;

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = game.description;

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const launchBtn = document.createElement('button');
    launchBtn.type = 'button';
    launchBtn.className = 'card-launch-btn';
    launchBtn.innerHTML = `${ICONS.play}<span>${isActive ? 'Playing Now' : 'Launch Game'}</span>`;
    launchBtn.addEventListener('click', () => playGame(game));
    footer.appendChild(launchBtn);

    if (game.isCustom) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'card-remove-btn';
      removeBtn.setAttribute('aria-label', `Remove ${game.title}`);
      removeBtn.innerHTML = `${ICONS.trash}<span>Remove</span>`;
      removeBtn.addEventListener('click', () => removeCustomGame(game.id));
      footer.appendChild(removeBtn);
    }

    body.append(meta, title, desc, footer);
    card.append(thumbBtn, body);
    grid.appendChild(card);
  });

  els.gridContainer.appendChild(grid);
}

function getExportJsonString() {
  const payload = {
    catalogTitle: 'Subzero Games Catalog',
    version: '1.0',
    games: getAllGames().map(({ isCustom: _ignored, ...rest }) => rest)
  };
  return JSON.stringify(payload, null, 2);
}

function renderJsonPanel() {
  const games = getAllGames();
  els.jsonPreview.textContent = getExportJsonString();
  els.jsonCount.textContent = `${games.length} entries`;
  if (state.customGames.length > 0) {
    els.resetCustomBtn.classList.remove('hidden');
  } else {
    els.resetCustomBtn.classList.add('hidden');
  }
}

function renderAll() {
  renderHero();
  renderTheater();
  renderFilterTabs();
  renderGameGrid();
  renderJsonPanel();
}

function playGame(game) {
  state.activeGame = game;
  state.theaterFocus = false;
  renderHero();
  renderTheater();
  renderGameGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removeCustomGame(id) {
  state.customGames = state.customGames.filter((g) => g.id !== id);
  saveCustomGames();
  if (state.activeGame && state.activeGame.id === id) {
    state.activeGame = null;
  }
  renderAll();
}

function openAddModal() {
  els.formError.classList.add('hidden');
  els.addModal.classList.remove('hidden');
  els.gameTitleInput.focus();
}

function closeAddModal() {
  els.addModal.classList.add('hidden');
}

// Event bindings
els.brandLink.addEventListener('click', (e) => {
  e.preventDefault();
  state.activeGame = null;
  state.theaterFocus = false;
  state.selectedCategory = 'All';
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelectorAll('[data-nav-category]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.selectedCategory = btn.getAttribute('data-nav-category') || 'All';
    renderFilterTabs();
    renderGameGrid();
    const el = document.getElementById('catalog-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

els.searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderGameGrid();
});

els.randomBtn.addEventListener('click', () => {
  const games = getAllGames();
  if (games.length === 0) return;
  const pool =
    state.activeGame && games.length > 1
      ? games.filter((g) => g.id !== state.activeGame.id)
      : games;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  playGame(pick);
});

els.reloadBtn.addEventListener('click', () => {
  state.reloadCounter += 1;
  renderTheater();
});

els.focusBtn.addEventListener('click', () => {
  state.theaterFocus = !state.theaterFocus;
  els.theaterSection.classList.toggle('theater-focus', state.theaterFocus);
  els.focusBtn.textContent = state.theaterFocus ? 'Exit Focus' : 'Focus Mode';
});

els.fullscreenBtn.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await els.theaterSection.requestFullscreen();
    }
  } catch {
    // Fullscreen may be restricted in certain embedded frames
  }
});

els.closeTheaterBtn.addEventListener('click', () => {
  state.activeGame = null;
  state.theaterFocus = false;
  renderHero();
  renderTheater();
  renderGameGrid();
});

els.addGameBtn.addEventListener('click', openAddModal);
els.closeModalBtn.addEventListener('click', closeAddModal);
els.cancelModalBtn.addEventListener('click', closeAddModal);
els.addModal.addEventListener('click', (e) => {
  if (e.target === els.addModal) closeAddModal();
});

els.addGameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  els.formError.classList.add('hidden');

  const cleanTitle = els.gameTitleInput.value.trim();
  if (!cleanTitle) {
    els.formError.textContent = 'Enter a game title.';
    els.formError.classList.remove('hidden');
    return;
  }

  const rawIframe = els.gameIframeInput.value.trim();
  const parsed = parseIframeHtml(rawIframe, cleanTitle);
  if (!parsed.valid) {
    els.formError.textContent = 'Paste a valid <iframe> tag or an https:// or ./games/ URL.';
    els.formError.classList.remove('hidden');
    return;
  }

  const normalizedIframe = rawIframe.startsWith('<iframe')
    ? rawIframe
    : buildIframeSnippet(parsed.src, cleanTitle);

  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const entry = {
    id: `${slug || 'custom'}-${Date.now()}`,
    title: cleanTitle,
    category: els.gameCategoryInput.value,
    controls: els.gameControlsInput.value.trim() || 'Keyboard & Mouse',
    description: els.gameDescInput.value.trim() || 'Custom iframe game added to the local JSON catalog.',
    iframe: normalizedIframe,
    isCustom: true
  };

  state.customGames.push(entry);
  saveCustomGames();
  state.selectedCategory = 'All';
  state.searchQuery = '';
  els.searchInput.value = '';
  els.addGameForm.reset();
  closeAddModal();
  renderAll();
  playGame(entry);
});

els.copyJsonBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(getExportJsonString());
    els.copyJsonBtn.textContent = 'Copied';
    setTimeout(() => {
      els.copyJsonBtn.textContent = 'Copy JSON';
    }, 1800);
  } catch {
    // Clipboard fallback ignored
  }
});

els.downloadJsonBtn.addEventListener('click', () => {
  const blob = new Blob([getExportJsonString()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'games.json';
  a.click();
  URL.revokeObjectURL(url);
});

els.resetCustomBtn.addEventListener('click', () => {
  state.customGames = [];
  saveCustomGames();
  if (state.activeGame && state.activeGame.isCustom) {
    state.activeGame = null;
  }
  renderAll();
});

fetchCatalog();
