import { useRef, useState } from 'react';
import { Maximize2, Minimize2, RotateCw, X, AlertCircle } from 'lucide-react';
import { parseIframeHtml } from '../utils/iframeParser';

export function GameTheater({ game, onClose }) {
  const containerRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [theaterWide, setTheaterWide] = useState(false);

  const parsed = parseIframeHtml(game.iframe, game.title);

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen may be restricted in certain embedded previews
    }
  };

  return (
    <section
      aria-label={`Playing ${game.title}`}
      className={
        theaterWide
          ? 'fixed inset-0 z-40 flex flex-col bg-[#0B1120] text-slate-100 p-4 md:p-6'
          : 'mb-10 rounded-xl bg-[#0F172A] text-slate-100 border border-slate-800 overflow-hidden'
      }
      ref={containerRef}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-[#162033] border-b border-slate-800">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-white truncate">
            {game.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>{game.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono truncate">{game.controls}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={() => setTheaterWide((w) => !w)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            {theaterWide ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Focus Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
          >
            <span>Fullscreen</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close game player"
            className="inline-flex items-center justify-center w-8 h-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={
          theaterWide
            ? 'flex-1 min-h-0 bg-[#070B14] rounded-lg overflow-hidden mt-3 border border-slate-800'
            : 'relative w-full aspect-[16/10] max-h-[680px] bg-[#070B14]'
        }
      >
        {parsed.valid ? (
          <iframe
            key={`${game.id}-${reloadKey}`}
            src={parsed.src}
            title={parsed.title}
            allow={parsed.allow}
            loading={parsed.loading}
            className="w-full h-full border-0 block"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-white">Invalid iframe source</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              This entry does not contain a valid HTTP, HTTPS, or local game iframe URL.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-[#111827] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>{game.description}</span>
        <span className="font-mono text-slate-500 truncate max-w-md">{parsed.src}</span>
      </div>
    </section>
  );
}
