import { useState } from 'react';
import { Gamepad2, Play, Trash2 } from 'lucide-react';

export function GameCard({ game, isActive, onPlay, onRemoveCustom }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className={`group flex flex-col bg-white rounded-xl border transition-all duration-150 overflow-hidden ${
        isActive
          ? 'border-rose-600 ring-1 ring-rose-600'
          : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5'
      }`}
    >
      <button
        type="button"
        onClick={() => onPlay(game)}
        className="relative block w-full aspect-[4/3] bg-slate-900 overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
      >
        {game.thumbnail && !imgError ? (
          <img
            src={game.thumbnail}
            alt={`${game.title} cover artwork`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-slate-300 p-6">
            <Gamepad2 className="w-10 h-10 mb-2 text-slate-400" aria-hidden="true" />
            <span className="font-display text-base font-bold text-white text-center">
              {game.title}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-end p-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg">
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>Play</span>
          </span>
        </div>
      </button>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
          <span className="font-medium text-slate-700">{game.category}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{game.isCustom ? 'Custom Entry' : 'HTML5 Iframe'}</span>
        </div>

        <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight mb-1.5">
          {game.title}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 flex-1">
          {game.description}
        </p>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPlay(game)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>{isActive ? 'Playing Now' : 'Launch Game'}</span>
          </button>

          {game.isCustom && onRemoveCustom && (
            <button
              type="button"
              onClick={() => onRemoveCustom(game.id)}
              aria-label={`Remove ${game.title}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
