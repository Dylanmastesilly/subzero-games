import { useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';

export function JsonCatalogPanel({ games, hasCustomGames, onResetCustom }) {
  const [copied, setCopied] = useState(false);

  const exportPayload = {
    catalogTitle: 'Recess Arcade Catalog',
    version: '1.0',
    games: games.map(({ isCustom: _ignored, ...rest }) => rest),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API fallback ignored
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="json-catalog"
      className="mt-16 pt-12 border-t border-slate-200"
      aria-labelledby="json-catalog-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h2
            id="json-catalog-heading"
            className="font-display text-2xl font-bold text-slate-900 tracking-tight"
          >
            Iframe JSON Catalog
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Every game in the directory is stored as an <code className="font-mono text-xs text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded">iframe</code> entry inside <code className="font-mono text-xs text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded">public/games.json</code>. Add custom entries above and download the updated JSON anytime.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasCustomGames && (
            <button
              type="button"
              onClick={onResetCustom}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Custom</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download games.json</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#162033] border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>public/games.json</span>
          <span className="tabular-nums">{games.length} entries</span>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
          <code>{jsonString}</code>
        </pre>
      </div>
    </section>
  );
}
