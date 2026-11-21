const ICONS = {
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>',
  gamepad: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><line x1="6" y1="11" x2="10" y2="11"></line><line x1="8" y1="9" x2="8" y2="13"></line><line x1="15" y1="12" x2="15.01" y2="12"></line><line x1="18" y1="10" x2="18.01" y2="10"></line><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"></path></svg>'
};

const state = {
  games: [],
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
  focusBtnLabel: document.getElementById('focusBtnLabel'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  fullscreenBtnLabel: document.getElementById('fullscreenBtnLabel'),
  fullscreenIcon: document.getElementById('fullscreenIcon'),
  closeTheaterBtn: document.getElementById('closeTheaterBtn'),
  filterTabs: document.getElementById('filterTabs'),
  searchInput: document.getElementById('searchInput'),
  gridContainer: document.getElementById('gridContainer'),
  randomBtn: document.getElementById('randomBtn'),
  brandLink: document.getElementById('brandLink')
};

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
      referrerPolicy: 'no-referrer',
      style: '',
      allowFullscreen: true,
      valid
    };
  }

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const el = doc.querySelector('iframe');
    if (!el) {
      return { src: '', title: fallbackTitle, id: '', className: '', allow: '', loading: '', scrolling: '', referrerPolicy: 'no-referrer', style: '', allowFullscreen: false, valid: false };
    }
    const src = el.getAttribute('src') || '';
    const valid = isSafeIframeSrc(src);
    const rawAllow = el.getAttribute('allow') || '';
    const allowTokens = new Set(
      rawAllow
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    allowTokens.add('fullscreen');
    allowTokens.add('autoplay');

    return {
      src: valid ? resolveCatalogRelativeUrl(src) : '',
      title: el.getAttribute('title') || fallbackTitle,
      id: el.getAttribute('id') || '',
      className: el.getAttribute('class') || '',
      allow: Array.from(allowTokens).join('; '),
      loading: el.getAttribute('loading') || '',
      scrolling: el.getAttribute('scrolling') || '',
      referrerPolicy: el.getAttribute('referrerpolicy') || 'no-referrer',
      style: sanitizeIframeStyle(el.getAttribute('style') || ''),
      allowFullscreen: true,
      valid
    };
  } catch {
    return { src: '', title: fallbackTitle, id: '', className: '', allow: '', loading: '', scrolling: '', referrerPolicy: 'no-referrer', style: '', allowFullscreen: false, valid: false };
  }
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
        state.games = data.games;
        state.catalogPrefix = candidate.prefix;
        renderAll();
        return;
      }
    } catch {
      // Try next candidate path
    }
  }

  renderErrorState('Unable to load the game directory right now.');
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
  heading.textContent = 'Games Unavailable';

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
  const count = state.games.length;
  els.heroMeta.innerHTML = '';
  const parts = ['HTML5 & WebAssembly', `${count} Playable Games`, 'Instant Launch'];
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

function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function syncTheaterControls() {
  const focusActive = Boolean(state.activeGame && state.theaterFocus);
  const fsActive = isFullscreenActive();

  els.theaterSection.classList.toggle('theater-focus', focusActive);
  document.body.classList.toggle('theater-locked', focusActive);

  if (els.focusBtnLabel) {
    els.focusBtnLabel.textContent = focusActive ? 'Exit Focus' : 'Focus Mode';
  }
  els.focusBtn.setAttribute('aria-pressed', String(focusActive));

  if (els.fullscreenBtnLabel) {
    els.fullscreenBtnLabel.textContent = fsActive ? 'Exit Fullscreen' : 'Fullscreen';
  }
  els.fullscreenBtn.setAttribute('aria-pressed', String(fsActive));

  if (els.fullscreenIcon) {
    els.fullscreenIcon.innerHTML = fsActive
      ? '<polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line>'
      : '<polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>';
  }
}

function focusGameFrame() {
  const iframe = els.theaterStage.querySelector('iframe');
  if (!iframe) return;
  try {
    iframe.focus();
    iframe.contentWindow?.focus();
  } catch {
    // Cross-origin frame focus may be ignored by browser
  }
}

async function exitFullscreenIfActive() {
  if (!isFullscreenActive()) return;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    }
  } catch {
    // Ignore exit errors
  }
}

async function toggleFullscreen() {
  if (!state.activeGame) return;

  if (isFullscreenActive()) {
    await exitFullscreenIfActive();
    syncTheaterControls();
    return;
  }

  const target = els.theaterStage;
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' });
      syncTheaterControls();
      focusGameFrame();
      return;
    }
    if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
      syncTheaterControls();
      focusGameFrame();
      return;
    }
  } catch {
    // Fallback to edge-to-edge focus mode if native fullscreen is blocked
  }

  state.theaterFocus = !state.theaterFocus;
  syncTheaterControls();
  focusGameFrame();
}

function renderTheater() {
  const game = state.activeGame;
  if (!game) {
    els.theaterSection.classList.add('hidden');
    els.theaterStage.innerHTML = '';
    syncTheaterControls();
    return;
  }

  els.theaterSection.classList.remove('hidden');
  syncTheaterControls();

  els.theaterTitle.textContent = game.title;
  els.theaterCategory.textContent = game.category;
  els.theaterControls.textContent = game.controls;
  els.theaterDesc.textContent = game.description;

  const parsed = parseIframeHtml(game.iframe, game.title);
  els.theaterSrc.textContent = !parsed.src
    ? 'Invalid URL'
    : /snokido/i.test(parsed.src)
      ? `${game.title} · Flash Ruffle Player`
      : parsed.src;
  els.theaterStage.innerHTML = '';

  if (parsed.valid) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('referrerpolicy', parsed.referrerPolicy || 'no-referrer');
    iframe.referrerPolicy = parsed.referrerPolicy || 'no-referrer';
    iframe.setAttribute('src', parsed.src);
    if (parsed.title) iframe.setAttribute('title', parsed.title);
    if (parsed.id) iframe.setAttribute('id', parsed.id);
    iframe.className = parsed.className ? `theater-iframe ${parsed.className}` : 'theater-iframe';
    if (parsed.allow) iframe.setAttribute('allow', parsed.allow);
    if (parsed.loading) iframe.setAttribute('loading', parsed.loading);
    if (parsed.scrolling) iframe.setAttribute('scrolling', parsed.scrolling);
    if (parsed.allowFullscreen) iframe.setAttribute('allowfullscreen', '');
    if (parsed.style) iframe.setAttribute('style', parsed.style);
    iframe.addEventListener('load', focusGameFrame);
    els.theaterStage.appendChild(iframe);
  } else {
    const err = document.createElement('div');
    err.className = 'theater-error';
    const h = document.createElement('p');
    h.className = 'theater-error-title';
    h.textContent = 'Invalid game source';
    const p = document.createElement('p');
    p.className = 'theater-error-desc';
    p.textContent = 'This entry does not contain a valid HTTP, HTTPS, or local game URL.';
    err.append(h, p);
    els.theaterStage.appendChild(err);
  }
}

function renderFilterTabs() {
  const categories = ['All', ...Array.from(new Set(state.games.map((g) => g.category)))];
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
  const games = state.games;
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
    heading.textContent = 'No games found';
    const text = document.createElement('p');
    text.textContent = 'Unable to find any games to load.';
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn-dark';
    retryBtn.textContent = 'Reload Games';
    retryBtn.addEventListener('click', fetchCatalog);
    box.append(heading, text, retryBtn);
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
      img.className = `card-thumb-img${game.thumbnailFit === 'contain' ? ' is-contain' : ''}`;
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
    typeSpan.textContent = 'Browser Game';
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

    body.append(meta, title, desc, footer);
    card.append(thumbBtn, body);
    grid.appendChild(card);
  });

  els.gridContainer.appendChild(grid);
}

function renderAll() {
  renderHero();
  renderTheater();
  renderFilterTabs();
  renderGameGrid();
}

function playGame(game) {
  state.activeGame = game;
  state.theaterFocus = false;
  renderHero();
  renderTheater();
  renderGameGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

els.brandLink.addEventListener('click', (e) => {
  e.preventDefault();
  exitFullscreenIfActive();
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
  const games = state.games;
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
  focusGameFrame();
});

els.focusBtn.addEventListener('click', () => {
  state.theaterFocus = !state.theaterFocus;
  syncTheaterControls();
  focusGameFrame();
});

els.fullscreenBtn.addEventListener('click', () => {
  toggleFullscreen();
});

document.addEventListener('fullscreenchange', () => {
  syncTheaterControls();
  focusGameFrame();
});

document.addEventListener('webkitfullscreenchange', () => {
  syncTheaterControls();
  focusGameFrame();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.activeGame && state.theaterFocus && !isFullscreenActive()) {
    state.theaterFocus = false;
    syncTheaterControls();
  }
});

els.closeTheaterBtn.addEventListener('click', () => {
  exitFullscreenIfActive();
  state.activeGame = null;
  state.theaterFocus = false;
  renderHero();
  renderTheater();
  renderGameGrid();
});

fetchCatalog();
