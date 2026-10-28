// Küçük ve güvenli Markdown → HTML dönüştürücü (blog / özel sayfalar).
// Önce tüm HTML kaçışlanır; yalnızca izin verilen biçimler üretilir. Bağlantılar http(s) veya site içi olmalıdır.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const safeUrl = (u: string) => (/^(https?:\/\/|\/)/i.test(u) ? u : '#');

function inline(s: string): string {
  let out = esc(s);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) =>
    /^https:\/\//i.test(url) ? `<img src="${url}" alt="${alt}" loading="lazy" class="my-4 rounded-2xl" />` : '',
  );
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    const ext = /^https?:/i.test(u);
    return `<a href="${esc(u)}"${ext ? ' target="_blank" rel="noopener nofollow"' : ''}>${t}</a>`;
  });
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out;
}

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let para: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length)
      html.push(`<blockquote class="border-l-4 border-accent/50 pl-4 italic text-slate-300">${inline(quote.join(' '))}</blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushAll();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushAll();
      const lvl = h[1].length + 1; // # → h2 (sayfada h1 başlık var)
      html.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      html.push('<hr class="my-6 border-white/10" />');
      continue;
    }
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      flushQuote();
      const type = ul ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    const qt = /^>\s?(.*)$/.exec(line);
    if (qt) {
      flushPara();
      flushList();
      quote.push(qt[1]);
      continue;
    }
    flushList();
    flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return html.join('\n');
}

export function readingMinutes(src: string): number {
  return Math.max(1, Math.round(src.split(/\s+/).length / 200));
}
