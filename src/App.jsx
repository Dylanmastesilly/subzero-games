import { useEffect, useMemo, useState } from 'react';
import { Search, Shuffle, AlertTriangle } from 'lucide-react';
import { GameTheater } from './components/GameTheater';
import { GameCard } from './components/GameCard';
import { AddGameModal } from './components/AddGameModal';
import { JsonCatalogPanel } from './components/JsonCatalogPanel';

const CUSTOM_GAMES_STORAGE_KEY = 'recess_arcade_custom_games_v1';

export default function App() {
  const [baseGames, setBaseGames] = useState([]);
  const [customGames, setCustomGames] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_GAMES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGame, setActiveGame] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/games.json');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.games)) {
        throw new Error('Invalid games.json structure');
      }
      setBaseGames(data.games);
    } catch {
      setLoadError('Unable to load the game catalog from /games.json.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_GAMES_STORAGE_KEY, JSON.stringify(customGames));
    } catch {
      // Ignore storage quota errors
    }
  }, [customGames]);

  const allGames = useMemo(
    () => [...baseGames, ...customGames],
    [baseGames, customGames]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allGames.map((g) => g.category)));
    return ['All', ...unique];
  }, [allGames]);

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allGames.filter((game) => {
      const matchesCat =
        selectedCategory === 'All' || game.category === selectedCategory;
      const matchesQuery =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        game.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [allGames, selectedCategory, searchQuery]);

  const handlePlayGame = (game) => {
    setActiveGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayRandom = () => {
    if (allGames.length === 0) return;
    const pool =
      activeGame && allGames.length > 1
        ? allGames.filter((g) => g.id !== activeGame.id)
        : allGames;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    handlePlayGame(pick);
  };

  const handleAddCustomGame = (entry) => {
    setCustomGames((prev) => [...prev, entry]);
    setSelectedCategory('All');
    setSearchQuery('');
    handlePlayGame(entry);
  };

  const handleRemoveCustomGame = (id) => {
    setCustomGames((prev) => prev.filter((g) => g.id !== id));
    if (activeGame?.id === id) {
      setActiveGame(null);
    }
  };

  const handleResetCustom = () => {
    setCustomGames([]);
    if (activeGame?.isCustom) {
      setActiveGame(null);
    }
  };

  const handleNavCategory = (cat) => {
    setSelectedCategory(cat);
    const el = document.getElementById('catalog-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#111827]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveGame(null);
              setSelectedCategory('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Recess Arcade
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => handleNavCategory('All')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              All Games
            </button>
            <button
              type="button"
              onClick={() => handleNavCategory('Arcade')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Arcade
            </button>
            <button
              type="button"
              onClick={() => handleNavCategory('Puzzle')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Puzzle
            </button>
            <a
              href="#json-catalog"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              JSON Catalog
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              Add Game
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 w-full max-w-6xl mx-auto px-6 py-10">
        {activeGame ? (
          <GameTheater
            game={activeGame}
            onClose={() => setActiveGame(null)}
          />
        ) : (
          <section className="mb-10 pb-10 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3 tabular-nums">
                <span>HTML5 Browser Games</span>
                <span aria-hidden="true">·</span>
                <span>{allGames.length} Iframe Entries</span>
                <span aria-hidden="true">·</span>
                <span>Local JSON Catalog</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] text-balance">
                Instant unblocked games, ready in one click.
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-xl">
                Every game runs directly inside a clean iframe loaded from a single JSON catalog—fast, self-contained, and playable with keyboard or mouse.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePlayRandom}
                disabled={allGames.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <Shuffle className="w-4 h-4" aria-hidden="true" />
                <span>Play Random</span>
              </button>
            </div>
          </section>
        )}

        <section id="catalog-grid" aria-label="Game directory">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
            <div
              className="inline-flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg self-start overflow-x-auto max-w-full"
              role="tablist"
              aria-label="Filter games by category"
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                aria-label="Search games"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                    <div className="h-4 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-xl bg-white border border-slate-200 p-10 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-3" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-slate-900">
                Catalog Unavailable
              </h2>
              <p className="text-sm text-slate-600 mt-1 mb-4">{loadError}</p>
              <button
                type="button"
                onClick={loadCatalog}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="rounded-xl bg-white border border-slate-200 p-10 text-center">
              <h2 className="font-display text-lg font-bold text-slate-900">
                No matching games
              </h2>
              <p className="text-sm text-slate-600 mt-1 mb-4">
                Try clearing your search term or switching back to all categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isActive={activeGame?.id === game.id}
                  onPlay={handlePlayGame}
                  onRemoveCustom={handleRemoveCustomGame}
                />
              ))}
            </div>
          )}
        </section>

        <JsonCatalogPanel
          games={allGames}
          hasCustomGames={customGames.length > 0}
          onResetCustom={handleResetCustom}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>Recess Arcade · Self-contained HTML, CSS, JS &amp; JSON Iframe Directory</span>
          <a href="#top" className="hover:text-slate-900 font-medium transition-colors">
            Back to top
          </a>
        </div>
      </footer>

      <AddGameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddCustomGame}
      />
    </div>
  );
}
