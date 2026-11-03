import { getLang } from './i18n.js';
/* core/dom.js — توابع کمکی DOM */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * createElement('div.cls#id', {attrs}, children)
 * children: string | Node | Array<string|Node>
 */
export function createElement(spec, props = {}, children = []) {
  const m = String(spec).match(/^([a-zA-Z0-9-]*)((?:[.#][\w-]+)*)$/) || [];
  const tag = m[1] || 'div';
  const el = document.createElement(tag);
  if (m[2]) {
    for (const part of m[2].match(/[.#][\w-]+/g) || []) {
      if (part[0] === '.') el.classList.add(part.slice(1));
      else el.id = part.slice(1);
    }
  }
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'value' && tag.toLowerCase() === 'textarea') el.value = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}
export function append(el, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
export const el = createElement; // alias
export const clear = (node) => { while (node && node.firstChild) node.removeChild(node.firstChild); return node; };
export const html = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (vals[i] ?? ''), '');

export function on(target, type, handler, opts) {
  target.addEventListener(type, handler, opts);
  return () => target.removeEventListener(type, handler, opts);
}
export function delegate(root, type, selector, handler) {
  return on(root, type, (e) => {
    const t = e.target.closest(selector);
    if (t && root.contains(t)) handler(e, t);
  });
}
export function debounce(fn, ms = 300) {
  let id = null;
  const wrapped = (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
  wrapped.cancel = () => clearTimeout(id);
  wrapped.flush = (...args) => { clearTimeout(id); fn(...args); };
  return wrapped;
}
export function throttle(fn, ms = 100) {
  let last = 0, timer = null;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
    else { clearTimeout(timer); timer = setTimeout(() => { last = Date.now(); fn(...args); }, ms - (now - last)); }
  };
}
export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ||
    'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9));

export const escapeHTML = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function formatDate(ts, lang = 'fa') {
  try {
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  } catch { return new Date(ts).toLocaleString(); }
}
export function formatDateShort(ts, lang = 'fa') {
  try {
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(ts));
  } catch { return new Date(ts).toLocaleDateString(); }
}

/* ---------- toast ---------- */
export function toast(msg, kind = '', ms = 2400) {
  const host = document.getElementById('toast-host');
  if (!host) return;
  const t = createElement('div.toast', { text: msg });
  if (kind) t.classList.add(kind);
  host.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; }, ms - 260);
  setTimeout(() => t.remove(), ms);
}

/* ---------- modal ---------- */
let modalCloser = null;
export function openModal({ title = '', body = null, footer = null, size = '', onClose = null } = {}) {
  const host = document.getElementById('modal-host');
  if (!host) return null;
  closeModal(true);
  const backdrop = createElement('div.modal-backdrop', { onclick: () => closeModal() });
  const box = createElement('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  if (size === 'lg') box.style.width = 'min(940px,96vw)';
  if (size === 'sm') box.style.width = 'min(460px,94vw)';
  const head = createElement('div.modal-head', {}, [
    createElement('h3', { text: title }),
    createElement('button.icon-btn', { 'aria-label': 'close', onclick: () => closeModal() }, '✕')
  ]);
  const bodyEl = createElement('div.modal-body');
  if (body) append(bodyEl, body);
  box.append(head, bodyEl);
  if (footer) {
    const foot = createElement('div.modal-foot');
    append(foot, footer);
    box.append(foot);
  }
  host.append(backdrop, box);
  host.classList.add('open');
  modalCloser = () => { if (typeof onClose === 'function') onClose(); };
  const esc = (e) => { if (e.key === 'Escape') { closeModal(); } };
  document.addEventListener('keydown', esc);
  host._esc = esc;
  const focusable = box.querySelector('input,select,textarea,button');
  if (focusable) setTimeout(() => focusable.focus(), 40);
  return { box, body: bodyEl, close: closeModal };
}
export function closeModal(silent = false) {
  const host = document.getElementById('modal-host');
  if (!host) return;
  if (!silent && modalCloser) { try { modalCloser(); } catch (_) {} }
  modalCloser = null;
  if (host._esc) document.removeEventListener('keydown', host._esc);
  host.classList.remove('open');
  clear(host);
}

/* ---------- download helper ---------- */
export function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1200);
}

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = el('textarea', { style: { position: 'fixed', opacity: '0' } });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};

/* simple confirm dialog */
export function confirmDialog(message, { ok = getLang()==='en'?'Confirm':'تأیید', cancel = getLang()==='en'?'Cancel':'انصراف', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; closeModal(); resolve(v); };
    const m = openModal({
      title: '—',
      size: 'sm',
      body: createElement('p', { text: message, style: { margin: '0', fontSize: '.88rem', lineHeight: '1.9' } }),
      footer: [
        createElement('button.btn.btn-sm', { onclick: () => finish(false) }, cancel),
        createElement('button.btn.btn-sm' + (danger ? '.btn-danger' : '.btn-primary'), { onclick: () => finish(true) }, ok)
      ],
      onClose: () => { if (!done) { done = true; resolve(false); } }
    });
    if (m) m.box.querySelector('.modal-head h3').textContent = getLang()==='en'?'Confirm':'تأیید';
  });
}
export function promptDialog(title, { value = '', placeholder = '', ok = getLang()==='en'?'Confirm':'تأیید', type = 'text' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const input = createElement('input.input', { type, value, placeholder, dir: 'auto' });
    const finish = (v) => { if (done) return; done = true; closeModal(); resolve(v); };
    openModal({
      title, size: 'sm',
      body: createElement('div.field', {}, [createElement('label', { text: title }), input]),
      footer: [
        createElement('button.btn.btn-sm', { onclick: () => finish(null) }, getLang()==='en'?'Cancel':'انصراف'),
        createElement('button.btn.btn-sm.btn-primary', { onclick: () => finish(input.value) }, ok)
      ],
      onClose: () => { if (!done) { done = true; resolve(null); } }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(input.value); });
    setTimeout(() => input.focus(), 60);
  });
}
