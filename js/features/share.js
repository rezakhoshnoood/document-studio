/* features/share.js — اشتراک‌گذاری: متن ساده، لینک فشرده، شبکه‌های اجتماعی */
import { getDoc, showDocumentBranding } from '../core/state.js';
import { smartFooter,displayTableCell } from '../core/table-math.js';

/* ---------------- متن ساده ---------------- */
export function docToPlainText(doc) {
  const lines = [];
  lines.push(doc.name || '');
  lines.push('—'.repeat(Math.min(48, (doc.name || '').length + 8)));
  (doc.blocks || []).forEach((b) => {
    const d = b.data || {};
    switch (b.type) {
      case 'hero':
        lines.push('', d.title || '');
        if (d.subtitle) lines.push(d.subtitle);
        if (Array.isArray(d.meta)) lines.push(d.meta.join(' | '));
        break;
      case 'heading':
        lines.push('', (d.text || '').toUpperCase());
        break;
      case 'text':
        lines.push(htmlToText(d.html || ''));
        break;
      case 'table': {
        lines.push('', (d.caption || ''));
        if (Array.isArray(d.headers)) lines.push(d.headers.join(' | '));
        (d.rows || []).forEach((r) => lines.push(r.map((_,c)=>displayTableCell(d,r,c,doc.lang)).join(' | ')));
        if (d.hasFooter && Array.isArray(d.footerRow)) lines.push(smartFooter(d, doc.lang).join(' | '));
        break;
      }
      case 'timeline':
        (d.items || []).forEach((it) => lines.push(`- ${it.date || ''}: ${it.title || ''}${it.desc ? ' — ' + it.desc : ''}`));
        break;
      case 'stat-grid':
        (d.stats || []).forEach((s) => lines.push(`• ${s.label || ''}: ${s.value || ''}`));
        break;
      case 'sign':
        (d.signatures || []).forEach((s) => lines.push(`✍ ${s.title || ''}: ${s.name || ''}`));
        break;
      case 'divider':
        lines.push('—'.repeat(28));
        break;
      case 'code':
        lines.push('', '```' + (d.language || ''), d.code || '', '```');
        break;
      case 'chart':
        lines.push('', (d.title || 'نمودار'));
        (d.labels || []).forEach((l, i) => {
          const vals = (d.datasets || []).map((ds) => `${ds.label}: ${ds.data?.[i] ?? ''}`).join(', ');
          lines.push(`- ${l} → ${vals}`);
        });
        break;
      case 'flow':
        lines.push('', (d.caption || 'فلوچارت'), d.mermaid || '');
        break;
      case 'image':
        if (d.caption) lines.push('', `[تصویر] ${d.caption}`);
        break;
      default:
        break;
    }
    (d.miniBlocks||[]).forEach(m=>{if(m.type==='divider')lines.push('—'.repeat(16));else if(m.type==='image'){if(m.alt)lines.push('[Image] '+m.alt);}else if(m.text)lines.push(m.text+(m.type==='button'&&m.href?' ('+m.href+')':''));});
  });
  if(showDocumentBranding(doc)) lines.push('',doc.lang === 'en' ? 'Made with Document Studio' : 'ساخته شده با سندساز هوشمند');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function htmlToText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('li').forEach((li) => { li.textContent = '• ' + li.textContent; });
  tmp.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  tmp.querySelectorAll('p,div,li,h1,h2,h3,h4').forEach((el) => el.append('\n'));
  return (tmp.textContent || '').replace(/\n{2,}/g, '\n').trim();
}

/* ---------------- فشرده‌سازی برای لینک ---------------- */
const hasCompression = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

async function streamThrough(data, kind) {
  const stream = new Blob([data]).stream().pipeThrough(kind === 'compress'
    ? new CompressionStream('gzip')
    : new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

const b64url = (buf) => btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (str) => {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '==='.slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

export async function encodeDocToParam(doc) {
  const payload = {
    n: doc.name, t: doc.theme, l: doc.lang, s: doc.settings,
    b: (doc.blocks || []).map((b) => ({ t: b.type, d: b.data, s: b.style }))
  };
  const json = JSON.stringify(payload);
  if (hasCompression()) {
    const ab = await streamThrough(json, 'compress');
    return 'z1.' + b64url(ab);
  }
  return 'j1.' + b64url(new TextEncoder().encode(json).buffer);
}

export async function decodeDocParam(param) {
  if (!param) throw new Error('empty');
  if (param.startsWith('z1.')) {
    const ab = unb64url(param.slice(3));
    const json = new TextDecoder().decode(await streamThrough(ab, 'decompress'));
    return expandPayload(JSON.parse(json));
  }
  if (param.startsWith('j1.')) {
    const json = new TextDecoder().decode(new Uint8Array(unb64url(param.slice(3))));
    return expandPayload(JSON.parse(json));
  }
  throw new Error('unknown format');
}
function expandPayload(p) {
  const { uid } = { uid: () => 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36) };
  return {
    name: p.n, theme: p.t, lang: p.l, settings: p.s,
    blocks: (p.b || []).map((b) => ({ id: uid(), type: b.t, data: b.d, style: b.s }))
  };
}

export async function buildShareLink(doc) {
  const param = await encodeDocToParam(doc);
  const base = location.origin + location.pathname;
  const url = `${base}#/import?d=${param}`;
  if (url.length > 30000) throw new Error('too-large');
  return url;
}

/* ---------------- شبکه‌های اجتماعی ---------------- */
export function shareTargets(doc, { url = '', text = '' } = {}) {
  const title = doc?.name || 'سند';
  const message = text || `${title}\n${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`
  };
}

export function openShare(kind, doc, opts = {}) {
  const t = shareTargets(doc, opts);
  const target = t[kind];
  if (!target) return false;
  if (kind === 'email') location.href = target;
  else window.open(target, '_blank', 'noopener,noreferrer');
  return true;
}

/** استفاده از Web Share API در صورت وجود */
export async function nativeShare(doc, { url, text }) {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: doc?.name || 'سند', text, url });
    return true;
  } catch (_) { return false; }
}

export default { docToPlainText, buildShareLink, decodeDocParam, encodeDocToParam, openShare, nativeShare, shareTargets };
