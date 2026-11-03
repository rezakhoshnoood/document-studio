/* blocks/flow.js — بلوک فلوچارت (Mermaid + رندر جایگزین خودکفا) */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ARROW = /\s*(-->|---|-\.->|==>)\s*(\|[^|]*\|)?\s*/;

const TOKEN_RE = /(-->|---|-\.->|==>)\s*(?:\|([^|]*)\|)?|([\w\u0600-\u06FF-]+)\s*(?:\[\[(.+?)\]\]|\[(.+?)\]|\{(.+?)\}|\{\{(.+?)\}\}|\(\((.+?)\)\)|\((.+?)\))?/g;

export function parseMermaid(code = '') {
  const nodes = new Map();
  const edges = [];
  let dir = 'TD';
  const lines = String(code).split(/\r?\n/);
  for (let raw of lines) {
    let line = raw.trim();
    if (!line || line.startsWith('%%')) continue;
    if (/^(graph|flowchart)\b/i.test(line)) {
      const m = line.match(/\b(TB|TD|BT|LR|RL)\b/i);
      if (m) dir = m[1].toUpperCase() === 'TB' ? 'TD' : m[1].toUpperCase();
      line = line.replace(/^(graph|flowchart)\s*/i, '').replace(/\b(TB|TD|BT|LR|RL)\b/i, '').trim();
      if (!line) continue;
    }
    line = line.replace(/;$/, '').trim();
    TOKEN_RE.lastIndex = 0;
    let m;
    let prevId = null;
    let pendingLabel = '';
    let pendingArrow = false;
    while ((m = TOKEN_RE.exec(line)) !== null) {
      if (m[1]) { pendingArrow = true; pendingLabel = m[2] || ''; continue; }
      const id = m[3];
      if (!id) continue;
      const label = m[4] ?? m[5] ?? m[6] ?? m[7] ?? m[8];
      const shape = m[6] !== undefined ? 'diamond' : ((m[7] !== undefined || m[8] !== undefined) ? 'round' : 'box');
      if (!nodes.has(id)) nodes.set(id, { id, label: label ?? id, shape });
      else if (label) { const n = nodes.get(id); n.label = label; n.shape = shape; }
      if (prevId && prevId !== id) {
        edges.push({ from: prevId, to: id, label: pendingArrow ? pendingLabel : '' });
      }
      prevId = id;
      pendingArrow = false;
      pendingLabel = '';
    }
  }
  return { dir, nodes: Array.from(nodes.values()), edges };
}

export function mermaidToSvg(code, { animate = false, animation='sequence', maxWidth = 700 } = {}) {
  const { dir, nodes, edges } = parseMermaid(code);
  if (!nodes.length) {
    return { svg: `<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg"><text x="150" y="45" text-anchor="middle" font-size="12" fill="#8b95a8">فلوچارت خالی است</text></svg>`, width: 300, height: 80 };
  }
  // levels
  const level = new Map(nodes.map((n) => [n.id, 0]));
  for (let i = 0; i < nodes.length + 1; i++) {
    edges.forEach((e) => {
      const lf = level.get(e.from) ?? 0;
      const lt = level.get(e.to) ?? 0;
      if (lt < lf + 1 && (e.to !== e.from)) level.set(e.to, Math.min(lf + 1, nodes.length));
    });
  }
  const byLevel = new Map();
  nodes.forEach((n) => {
    const l = level.get(n.id) || 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l).push(n);
  });
  const nW = 148, nH = 46, gapX = 26, gapY = 52;
  const maxPerLevel = Math.max(...Array.from(byLevel.values()).map((a) => a.length));
  const levels = Math.max(...byLevel.keys()) + 1;
  const horizontal = dir === 'LR' || dir === 'RL';
  const contentW = horizontal ? levels * (nW + gapX) : maxPerLevel * (nW + gapX);
  const contentH = horizontal ? maxPerLevel * (nH + gapY) : levels * (nH + gapY);
  const W = Math.max(contentW + 28, 260);
  const H = contentH + 20;
  const pos = new Map();
  byLevel.forEach((list, l) => {
    list.forEach((n, i) => {
      const count = list.length;
      if (horizontal) {
        const x = 14 + l * (nW + gapX);
        const y = 14 + (contentH - count * nH - (count - 1) * gapY) / 2 + i * (nH + gapY);
        pos.set(n.id, { x, y });
      } else {
        const x = 14 + (contentW - count * nW - (count - 1) * gapX) / 2 + i * (nW + gapX);
        const y = 14 + l * (nH + gapY);
        pos.set(n.id, { x, y });
      }
    });
  });

  const accent = '#4f8cff';
  const edgeEls = edges.map((e, i) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return '';
    let x1, y1, x2, y2, path;
    if (horizontal) {
      const leftToRight = b.x >= a.x;
      x1 = leftToRight ? a.x + nW : a.x; y1 = a.y + nH / 2;
      x2 = leftToRight ? b.x : b.x + nW; y2 = b.y + nH / 2;
      const mx = (x1 + x2) / 2;
      path = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    } else {
      x1 = a.x + nW / 2; y1 = a.y + nH;
      x2 = b.x + nW / 2; y2 = b.y;
      const my = (y1 + y2) / 2;
      path = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
    }
    const labelEl = e.label
      ? `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${(((y1 + y2) / 2) - 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#6b7488">${esc(e.label)}</text>`
      : '';
    const anim = animate ? `<animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="${(animation==='fade'?0:(0.15 + i * 0.08)).toFixed(2)}s" fill="freeze"/>` : '';
    return `<path d="${path}" fill="none" stroke="#a8b4c8" stroke-width="1.8" marker-end="url(#arrow)">${anim}</path>${labelEl}`;
  }).join('');

  const nodeEls = nodes.map((n, i) => {
    const p = pos.get(n.id);
    const cx = p.x + nW / 2, cy = p.y + nH / 2;
    const fill = '#eef4ff';
    const stroke = accent;
    const anim = animate ? `<animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="${(animation==='fade'?0:(i * 0.07)).toFixed(2)}s" fill="freeze"/>` : '';
    let shape;
    if (n.shape === 'diamond') {
      shape = `<polygon points="${cx},${p.y} ${p.x + nW},${cy} ${cx},${p.y + nH} ${p.x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>`;
    } else if (n.shape === 'round') {
      shape = `<rect x="${p.x}" y="${p.y}" width="${nW}" height="${nH}" rx="${nH / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>`;
    } else {
      shape = `<rect x="${p.x}" y="${p.y}" width="${nW}" height="${nH}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>`;
    }
    const label = String(n.label);
    const shortLabel = label.length > 22 ? label.slice(0, 21) + '…' : label;
    return `<g>${anim}${shape}<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11.5" fill="#243447">${esc(shortLabel)}</text></g>`;
  }).join('');

  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#a8b4c8"/></marker></defs>
    ${edgeEls}${nodeEls}
  </svg>`;
  return { svg, width: W, height: H };
}

/* بارگذاری اختیاری Mermaid از CDN (اگر اینترنت باشد؛ در حالت آفلاین نادیده گرفته می‌شود) */
let mermaidLoading = null;
export function ensureMermaid(timeout = 3500) {
  if (globalThis.mermaid) return Promise.resolve(true);
  if (mermaidLoading) return mermaidLoading;
  mermaidLoading = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    const timer = setTimeout(() => { resolve(!!globalThis.mermaid); }, timeout);
    s.onload = () => {
      clearTimeout(timer);
      try {
        globalThis.mermaid.initialize({ startOnLoad: false, theme: 'base', securityLevel: 'loose',
          themeVariables: { primaryColor: '#eef4ff', primaryBorderColor: '#4f8cff', primaryTextColor: '#243447', lineColor: '#a8b4c8' } });
      } catch (_) {}
      resolve(true);
    };
    s.onerror = () => { clearTimeout(timer); resolve(false); };
    document.head.appendChild(s);
  });
  return mermaidLoading;
}

const def = {
  type: 'flow',
  icon: '🔀',
  labelKey: 'block.flow',
  createData: () => ({
    mermaid: 'graph TD\n  A[شروع] --> B{تصمیم}\n  B -->|بله| C[اجرای فرایند]\n  B -->|خیر| D[پایان]\n  C --> D',
    caption: 'فرایند کاری'
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const wrap = createElement('div.b-flow');
    const box = createElement('div.mermaid-box');
    const { svg } = mermaidToSvg(d.mermaid || '', { animate: !!ctx.animateCharts && d.flowAnimation!=='none' && !matchMedia('(prefers-reduced-motion: reduce)').matches, animation:d.flowAnimation||'sequence' });
    box.innerHTML = svg;
    wrap.appendChild(box);
    if (d.caption) wrap.appendChild(createElement('div.hint', { text: d.caption, ...(ctx.editable?{'data-edit':'caption'}:{}), style: { color: '#7b849c', textAlign: 'center', marginTop: '4px' } }));
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    return [api.group(t('prop.content'), [
      api.select(L('فلوچارت آماده','Flowchart template'),'', [{value:'',label:L('انتخاب کنید','Choose')},{value:'startup',label:L('مسیر استارتاپ','Startup journey')},{value:'sales',label:L('فرایند فروش','Sales process')},{value:'decision',label:L('تصمیم‌گیری','Decision')},{value:'roadmap',label:L('نقشه راه محصول','Product roadmap')},{value:'support',label:L('پشتیبانی مشتری','Customer support')},{value:'onboarding',label:L('ورود کاربر','User onboarding')}],v=>{const presets={startup:'graph TD\n A[ایده] --> B[اعتبارسنجی]\n B --> C[محصول اولیه]\n C --> D[رشد]',sales:'graph TD\n A[مشتری] --> B[انتخاب کالا]\n B --> C{پرداخت}\n C -->|موفق| D[صدور رسید]\n C -->|ناموفق| E[تلاش دوباره]',decision:'graph TD\n A[شروع] --> B{بررسی}\n B -->|بله| C[اقدام]\n B -->|خیر| D[بازنگری]',roadmap:'graph LR\n A[کشف] --> B[طراحی] --> C[ساخت] --> D[عرضه]',support:'graph TD\n A[درخواست] --> B[بررسی]\n B --> C{حل شد}\n C -->|بله| D[پایان]\n C -->|خیر| E[ارجاع]',onboarding:'graph LR\n A[ثبت نام] --> B[تایید] --> C[آموزش] --> D[شروع]'};if(v&&presets[v]){d.mermaid=presets[v];api.rerender();api.commit();api.refresh();}}),
      api.select(L('انیمیشن فلوچارت','Flowchart animation'),d.flowAnimation||'sequence',[{value:'none',label:L('خاموش','None')},{value:'fade',label:L('محو همزمان','Fade together')},{value:'sequence',label:L('ورود مرحله‌ای','Sequential')}],v=>{d.flowAnimation=v;api.rerender();api.commit();}),
      api.text(L('کد Mermaid','Mermaid code'), d.mermaid, (v) => { d.mermaid = v; api.rerender(); }, { multiline: true, dir: 'ltr' }),
      api.text(L('عنوان زیر نمودار','Caption below chart'), d.caption, (v) => { d.caption = v; api.rerender(); }),
      createElement('p.hint', { text: 'نمونه: graph TD سپس A[شروع] --> B{تصمیم}. پیش‌نمایش زنده است.' })
    ])];
  }
};
export default def;
