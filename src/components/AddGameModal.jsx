import { useState } from 'react';
import { X } from 'lucide-react';
import { buildIframeSnippet, parseIframeHtml } from '../utils/iframeParser';

export function AddGameModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Arcade');
  const [controls, setControls] = useState('Keyboard & Mouse');
  const [description, setDescription] = useState('');
  const [iframeInput, setIframeInput] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Enter a game title.');
      return;
    }

    const parsed = parseIframeHtml(iframeInput, cleanTitle);
    if (!parsed.valid) {
      setError('Paste a valid <iframe> tag or an https:// or /games/ URL.');
      return;
    }

    const normalizedIframe = iframeInput.trim().startsWith('<iframe')
      ? `<iframe src="${parsed.src}" title="${parsed.title}" allow="${parsed.allow}" loading="lazy"></iframe>`
      : buildIframeSnippet(parsed.src, cleanTitle);

    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    onAdd({
      id: `${slug || 'custom'}-${Date.now()}`,
      title: cleanTitle,
      category,
      controls: controls.trim() || 'Keyboard & Mouse',
      description: description.trim() || 'Custom iframe game added to the local JSON catalog.',
      iframe: normalizedIframe,
      isCustom: true,
    });

    setTitle('');
    setDescription('');
    setIframeInput('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-game-title"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="add-game-title" className="font-display text-lg font-bold text-slate-900">
            Add Game Iframe to Catalog
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="game-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Game Title
              </label>
              <input
                id="game-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tetris Block"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
              />
            </div>

            <div>
              <label htmlFor="game-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="game-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
              >
                <option value="Arcade">Arcade</option>
                <option value="Puzzle">Puzzle</option>
                <option value="Strategy">Strategy</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="game-iframe" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Iframe Code or Embed URL
            </label>
            <textarea
              id="game-iframe"
              rows={3}
              value={iframeInput}
              onChange={(e) => setIframeInput(e.target.value)}
              placeholder='<iframe src="/games/brick-blitz.html" title="Brick Blitz"></iframe>'
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
            />
          </div>

          <div>
            <label htmlFor="game-controls" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Controls Hint
            </label>
            <input
              id="game-controls"
              type="text"
              value={controls}
              onChange={(e) => setControls(e.target.value)}
              placeholder="Arrow Keys or Mouse"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
            />
          </div>

          <div>
            <label htmlFor="game-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Short Description
            </label>
            <input
              id="game-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line summary of the game"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Save to Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
