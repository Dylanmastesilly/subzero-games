export function isSafeIframeSrc(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function parseIframeHtml(iframeHtml, fallbackTitle = 'Embedded Game') {
  const raw = iframeHtml.trim();

  if (raw && !raw.startsWith('<')) {
    const valid = isSafeIframeSrc(raw);
    return {
      src: valid ? raw : '',
      title: fallbackTitle,
      allow: 'fullscreen; autoplay',
      loading: 'lazy',
      valid,
    };
  }

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const el = doc.querySelector('iframe');
    if (!el) {
      return { src: '', title: fallbackTitle, allow: 'fullscreen', loading: 'lazy', valid: false };
    }
    const src = el.getAttribute('src') ?? '';
    const valid = isSafeIframeSrc(src);
    return {
      src: valid ? src : '',
      title: el.getAttribute('title') || fallbackTitle,
      allow: el.getAttribute('allow') || 'fullscreen; autoplay',
      loading: el.getAttribute('loading') === 'eager' ? 'eager' : 'lazy',
      valid,
    };
  } catch {
    return { src: '', title: fallbackTitle, allow: 'fullscreen', loading: 'lazy', valid: false };
  }
}

export function buildIframeSnippet(src, title) {
  const safeTitle = title.replace(/"/g, '&quot;');
  const safeSrc = src.replace(/"/g, '&quot;');
  return `<iframe src="${safeSrc}" title="${safeTitle}" allow="fullscreen; autoplay" loading="lazy"></iframe>`;
}
