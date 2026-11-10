/* core/state.js — state مرکزی، localStorage، undo/redo، تم‌ها */
import { uid, debounce, toast } from './dom.js';
import { snapshotDesign } from '../features/design-reset.js';

const K = {
  docs: 'ds.docs',
  settings: 'ds.settings',
  templates: 'ds.templates',
  themes: 'ds.themes',
  lang: 'ds.lang'
};

const listeners = new Map();
export function on(evt, fn) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt).delete(fn);
}
export function emit(evt, payload) {
  (listeners.get(evt) || []).forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } });
  (listeners.get('*') || []).forEach((fn) => { try { fn(evt, payload); } catch (_) {} });
}

/* ---------------- low level ---------------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { console.warn('storage failed', e); toast('ذخیره‌سازی مرورگر ناموفق بود؛ فایل پشتیبان JSON بگیرید.', 'err', 6500); emit('storage:error', e); return false; }
}

/* ---------------- settings ---------------- */
export const DEFAULT_SETTINGS = {
  skin: 'flat',
  effect: 'particles',
  effectColor: '#4f8cff',
  effectOpacity: 0.55,
  lang: 'en',
  documentLang: 'en',
  brandingDefault: false,
  lastDocId: null
};
const storedSettings = read(K.settings, null);
let oldLang = null;
try { oldLang = localStorage.getItem(K.lang); } catch (_) {}
let settings = { ...DEFAULT_SETTINGS, ...(storedSettings || {}) };
// Preserve earlier installations' implicit Persian document default and saved UI language.
if (storedSettings && !Object.prototype.hasOwnProperty.call(storedSettings, 'documentLang')) settings.documentLang='fa';
if ((!storedSettings || !storedSettings.lang) && (oldLang==='fa' || oldLang==='en')) settings.lang=oldLang;
export const getSettings = () => ({ ...settings });
// Legacy showFooter contained author attribution; only the new explicit choice controls branding.
export function showDocumentBranding(doc) { const mode=doc?.settings?.branding; return mode==='on' ? true : mode==='off' ? false : settings.brandingDefault === true; }
export function saveSettings(patch = {}) {
  settings = { ...settings, ...patch };
  write(K.settings, settings);
  emit('settings:changed', getSettings());
  return getSettings();
}

export function resetSettings(){
  const lastDocId=settings.lastDocId||null;
  settings={...DEFAULT_SETTINGS,lastDocId};
  write(K.settings,settings);emit('settings:changed',getSettings());return getSettings();
}

/* ---------------- print / visual themes ---------------- */
export const THEMES = [
  { id: 'modern-blue', label: { fa: 'آبی مدرن', en: 'Modern Blue' }, vars: {
    '--d-accent': '#4f8cff', '--d-accent-light': '#e8f0ff', '--d-title': '#1a237e', '--d-text': '#333333',
    '--d-header-bg': 'linear-gradient(135deg,#4f8cff,#6c5ce7)', '--d-header-text': '#ffffff',
    '--d-th-bg': '#4f8cff', '--d-zebra': '#f5f8ff', '--d-border': '#e0e0e0',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '12px', '--d-bg': '#ffffff' } },
  { id: 'emerald', label: { fa: 'سبز زمردی', en: 'Emerald' }, vars: {
    '--d-accent': '#0e9f6e', '--d-accent-light': '#e6f7f1', '--d-title': '#064e3b', '--d-text': '#2f3b36',
    '--d-header-bg': 'linear-gradient(135deg,#0e9f6e,#0ea5e9)', '--d-header-text': '#ffffff',
    '--d-th-bg': '#0e9f6e', '--d-zebra': '#f3fbf7', '--d-border': '#d9e9e2',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '14px', '--d-bg': '#ffffff' } },
  { id: 'sunset', label: { fa: 'غروب', en: 'Sunset' }, vars: {
    '--d-accent': '#f2743b', '--d-accent-light': '#fff0e8', '--d-title': '#7c2d12', '--d-text': '#3d3229',
    '--d-header-bg': 'linear-gradient(135deg,#f97316,#e11d48)', '--d-header-text': '#ffffff',
    '--d-th-bg': '#f2743b', '--d-zebra': '#fff7f2', '--d-border': '#f0dfd3',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '16px', '--d-bg': '#fffdfb' } },
  { id: 'ocean', label: { fa: 'اقیانوس', en: 'Ocean' }, vars: {
    '--d-accent': '#0284c7', '--d-accent-light': '#e0f2fe', '--d-title': '#0c4a6e', '--d-text': '#293b45',
    '--d-header-bg': 'linear-gradient(135deg,#0369a1,#22d3ee)', '--d-header-text': '#ffffff',
    '--d-th-bg': '#0284c7', '--d-zebra': '#f2fafe', '--d-border': '#cfe6f2',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '10px', '--d-bg': '#ffffff' } },
  { id: 'royal', label: { fa: 'بنفش سلطنتی', en: 'Royal' }, vars: {
    '--d-accent': '#7c3aed', '--d-accent-light': '#f1e9ff', '--d-title': '#3b0764', '--d-text': '#33303f',
    '--d-header-bg': 'linear-gradient(135deg,#6d28d9,#a855f7)', '--d-header-text': '#ffffff',
    '--d-th-bg': '#7c3aed', '--d-zebra': '#faf5ff', '--d-border': '#e6dcf5',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '12px', '--d-bg': '#ffffff' } },
  { id: 'minimal', label: { fa: 'مینیمال', en: 'Minimal' }, vars: {
    '--d-accent': '#111827', '--d-accent-light': '#f3f4f6', '--d-title': '#111827', '--d-text': '#374151',
    '--d-header-bg': '#111827', '--d-header-text': '#ffffff',
    '--d-th-bg': '#111827', '--d-zebra': '#f9fafb', '--d-border': '#e5e7eb',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '4px', '--d-bg': '#ffffff' } },
  { id: 'warm', label: { fa: 'گرم', en: 'Warm' }, vars: {
    '--d-accent': '#b45309', '--d-accent-light': '#fdf3e3', '--d-title': '#5b3a1a', '--d-text': '#40372c',
    '--d-header-bg': 'linear-gradient(135deg,#d97706,#b45309)', '--d-header-text': '#fffaf2',
    '--d-th-bg': '#b45309', '--d-zebra': '#fdf8f0', '--d-border': '#ecdfc9',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '12px', '--d-bg': '#fffdf8' } },
  { id: 'academic', label: { fa: 'آکادمیک', en: 'Academic' }, vars: {
    '--d-accent': '#8b1d2c', '--d-accent-light': '#f7eeee', '--d-title': '#3f0d16', '--d-text': '#2b2b2b',
    '--d-header-bg': 'linear-gradient(135deg,#8b1d2c,#b03a4a)', '--d-header-text': '#fff9f4',
    '--d-th-bg': '#8b1d2c', '--d-zebra': '#faf6f4', '--d-border': '#e3d8d2',
    '--d-font': "'Vazirmatn', 'Times New Roman', serif", '--d-radius': '3px', '--d-bg': '#fffefb' } },
  { id: 'darkprint', label: { fa: 'چاپ تیره', en: 'Dark print' }, vars: {
    '--d-accent': '#60a5fa', '--d-accent-light': '#1e293b', '--d-title': '#f8fafc', '--d-text': '#cbd5e1',
    '--d-header-bg': 'linear-gradient(135deg,#0f172a,#1e3a8a)', '--d-header-text': '#f8fafc',
    '--d-th-bg': '#1e3a8a', '--d-zebra': '#111c30', '--d-border': '#1e293b',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '12px', '--d-bg': '#0b1220' } },
  { id: 'official', label: { fa: 'اداری رسمی', en: 'Official' }, vars: {
    '--d-accent': '#1e3a5f', '--d-accent-light': '#eef2f7', '--d-title': '#14202e', '--d-text': '#2f3742',
    '--d-header-bg': '#1e3a5f', '--d-header-text': '#ffffff',
    '--d-th-bg': '#1e3a5f', '--d-zebra': '#f7f9fb', '--d-border': '#d6dde6',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '2px', '--d-bg': '#ffffff' } },
  { id: 'pastel', label: { fa: 'پاستیلی', en: 'Pastel' }, vars: {
    '--d-accent': '#ec8fb4', '--d-accent-light': '#fdf1f6', '--d-title': '#7a3f57', '--d-text': '#4a4049',
    '--d-header-bg': 'linear-gradient(135deg,#f9a8d4,#a5b4fc)', '--d-header-text': '#4b2f42',
    '--d-th-bg': '#f0a7c6', '--d-zebra': '#fdf6fa', '--d-border': '#f0e0e9',
    '--d-font': "'Vazirmatn', system-ui, sans-serif", '--d-radius': '18px', '--d-bg': '#fffdfe' } },
  { id: 'technical', label: { fa: 'فنی', en: 'Technical' }, vars: {
    '--d-accent': '#0f766e', '--d-accent-light': '#e7f5f3', '--d-title': '#083344', '--d-text': '#243b46',
    '--d-header-bg': 'linear-gradient(135deg,#0f766e,#155e75)', '--d-header-text': '#ecfeff',
    '--d-th-bg': '#0f766e', '--d-zebra': '#f4fbfa', '--d-border': '#cfe4e0',
    '--d-font': "'JetBrains Mono', ui-monospace, 'Vazirmatn', monospace", '--d-radius': '0px', '--d-bg': '#ffffff' } }
];

export function getThemes() {
  return [...THEMES, ...listCustomThemes().map((c) => ({
    id: c.id, label: { fa: c.name, en: c.name }, vars: c.vars, custom: true
  }))];
}
export function getTheme(id) {
  const list = getThemes();
  return list.find((t) => t.id === id) || list[0];
}
export function themeVars(id) {
  return getTheme(id).vars || {};
}
export function themeCss(scope = '.doc-page') {
  return getThemes().map((t) => {
    const body = Object.entries(t.vars).map(([k, v]) => `${k}:${v};`).join('');
    return `${scope}[data-theme="${t.id}"]{${body}}`;
  }).join('\n');
}

/* ---------------- custom themes ---------------- */
export function listCustomThemes() { return read(K.themes, []); }
export function saveCustomTheme(theme) {
  const all = listCustomThemes();
  const item = { id: theme.id || 'ct-' + uid().slice(0, 8), name: theme.name || 'My theme', vars: theme.vars, createdAt: Date.now() };
  const i = all.findIndex((x) => x.id === item.id);
  if (i >= 0) all[i] = { ...all[i], ...item }; else all.push(item);
  write(K.themes, all);
  emit('themes:changed', all);
  return item;
}
export function deleteCustomTheme(id) {
  const all = listCustomThemes().filter((t) => t.id !== id);
  write(K.themes, all);
  emit('themes:changed', all);
}

/* ---------------- documents ---------------- */
export const DEFAULT_DOC_SETTINGS = {
  webSurface: 'dark',
  webWidth: 'wide',
  webLayout: 'flow',
  bgEffect: 'particles',
  customBackground: null,
  bgEffectColor: '#4f8cff',
  bgEffectOpacity: 0.3,
  bgReactMove: false, bgReactClick: false,
  transitionSpeed: 'normal',
  autoScroll: false,
  autoScrollInterval: 5,
  showProgress: true,
  musicUrl: '',
  animations: true,
  exportMode: 'view',
  showFooter: false,
  branding: 'inherit'
};

export function listDocs() {
  return read(K.docs, []).map((d) => ({
    id: d.id, name: d.name, lang: d.lang, theme: d.theme,
    createdAt: d.createdAt, updatedAt: d.updatedAt,
    blockCount: (d.blocks || []).length
  })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
export function getDoc(id) {
  if (!id) return null;
  const d = read(K.docs, []).find((x) => x.id === id);
  if (!d) return null;
  return normalizeDoc(d);
}
export function normalizeDoc(d) {
  return {
    id: d.id || uid(),
    name: d.name || 'Untitled',
    lang: d.lang === 'en' ? 'en' : 'fa',
    theme: d.theme || 'modern-blue',
    createdAt: d.createdAt || Date.now(),
    updatedAt: d.updatedAt || Date.now(),
    settings: { ...DEFAULT_DOC_SETTINGS, ...(d.settings || {}) },
    blocks: Array.isArray(d.blocks) ? d.blocks : []
  };
}
export function createDoc(partial = {}, { preserveBaseline=false, legacy=false } = {}) {
  const doc = normalizeDoc({
    id: uid(),
    name: partial.name || (settings.documentLang === 'en' ? 'Untitled document' : 'سند بدون عنوان'),
    lang: settings.documentLang === 'en' ? 'en' : 'fa',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial
  });
  if(!legacy && !preserveBaseline)doc.settings.designBaseline=snapshotDesign(doc);
  if(legacy)delete doc.settings.designBaseline;
  const all = read(K.docs, []);
  all.push(doc);
  if (!write(K.docs, all)) return null;
  saveSettings({ lastDocId: doc.id });
  emit('docs:changed', listDocs());
  return doc;
}
export function saveDoc(doc) {
  if (!doc || !doc.id) return null;
  doc.updatedAt = Date.now();
  const all = read(K.docs, []);
  const i = all.findIndex((x) => x.id === doc.id);
  if (i >= 0) all[i] = doc; else all.push(doc);
  if (!write(K.docs, all)) return null;
  saveSettings({ lastDocId: doc.id });
  emit('docs:changed', listDocs());
  return doc;
}
export function deleteDoc(id) {
  if (!write(K.docs, read(K.docs, []).filter((d) => d.id !== id))) return false;
  clearTimeout(saveTimers.get(id)); saveTimers.delete(id);
  historyCache.delete(id);
  emit('docs:changed', listDocs());
  return true;
}
export function cloneBlocksWithRemappedIds(blocks) {
  const ids=new Map((blocks||[]).map(b=>[b.id,uid()]));
  return (blocks||[]).map(b=>{
    const copy=JSON.parse(JSON.stringify(b)); copy.id=ids.get(b.id);
    if (copy.type==='chart' && copy.data?.source?.tableId && ids.has(copy.data.source.tableId)) copy.data.source.tableId=ids.get(copy.data.source.tableId);
    return copy;
  });
}
export function remapPrintSettings(settings, oldBlocks, newBlocks) {
  const copy=JSON.parse(JSON.stringify(settings||{}));
  const ids=new Map((oldBlocks||[]).map((b,i)=>[b.id,newBlocks[i]?.id]));
  if (Array.isArray(copy.printOptions?.hidden)) copy.printOptions.hidden=copy.printOptions.hidden.map(id=>ids.get(id)).filter(Boolean);
  if(copy.designBaseline?.blocks){const mapped={};for(const [id,entry] of Object.entries(copy.designBaseline.blocks))if(ids.has(id))mapped[ids.get(id)]=entry;copy.designBaseline.blocks=mapped;}
  return copy;
}
export function duplicateDoc(id) {
  const src = getDoc(id);
  if (!src) return null;
  const blocks=cloneBlocksWithRemappedIds(src.blocks);
  const settings=remapPrintSettings(src.settings,src.blocks,blocks);
  return createDoc({ ...src, id:uid(), name:src.name+' (کپی)', settings, blocks },{preserveBaseline:!!settings.designBaseline,legacy:!settings.designBaseline});
}

/* debounced auto-save */
const saveTimers = new Map();
export function queueSave(doc, { onSaved } = {}) {
  const key = doc.id;
  clearTimeout(saveTimers.get(key));
  emit('doc:save-state', { id: key, state: 'saving' });
  saveTimers.set(key, setTimeout(() => {
    const saved = saveDoc(doc);
    emit('doc:save-state', { id: key, state: saved ? 'saved' : 'error', at: Date.now() });
    if (saved && onSaved) onSaved();
  }, 2000));
}
export function flushSave(doc) {
  clearTimeout(saveTimers.get(doc.id));
  const saved = saveDoc(doc);
  emit('doc:save-state', { id: doc.id, state: saved ? 'saved' : 'error', at: Date.now() });
  return !!saved;
}

/* ---------------- undo / redo ---------------- */
const historyCache = new Map(); // id -> { stack: [], index: -1 }
const MAX_HISTORY = 50;

export function initHistory(doc) {
  if (historyCache.has(doc.id)) return historyCache.get(doc.id);
  const h = { stack: [snapshot(doc)], index: 0 };
  historyCache.set(doc.id, h);
  return h;
}
function snapshot(doc) {
  return JSON.stringify({ blocks: doc.blocks, name: doc.name, theme: doc.theme, lang: doc.lang, settings: doc.settings });
}
export function commitHistory(doc) {
  const h = initHistory(doc);
  const snap = snapshot(doc);
  if (h.stack[h.index] === snap) return false;
  h.stack = h.stack.slice(0, h.index + 1);
  h.stack.push(snap);
  if (h.stack.length > MAX_HISTORY) h.stack.shift();
  h.index = h.stack.length - 1;
  emit('history:changed', historyState(doc.id));
  return true;
}
export function historyState(id) {
  const h = historyCache.get(id);
  if (!h) return { canUndo: false, canRedo: false };
  return { canUndo: h.index > 0, canRedo: h.index < h.stack.length - 1, size: h.stack.length };
}
function applySnapshot(doc, snap) {
  const data = JSON.parse(snap);
  const oldBlockIds = new Set((doc.blocks || []).map(b => b.id));
  const entirelyNewBlocks = oldBlockIds.size > 0 && data.blocks.length > 0 && !data.blocks.some(b => oldBlockIds.has(b.id));
  doc.blocks = data.blocks;
  doc.name = data.name;
  doc.theme = data.theme;
  doc.lang = data.lang;
  if (data.settings) { const printOptions=doc.settings?.printOptions; doc.settings=data.settings; if (printOptions && !entirelyNewBlocks) doc.settings.printOptions=printOptions; }
  return doc;
}
export function undo(doc) {
  const h = initHistory(doc);
  if (h.index <= 0) return false;
  h.index--;
  applySnapshot(doc, h.stack[h.index]);
  emit('history:changed', historyState(doc.id));
  return true;
}
export function redo(doc) {
  const h = initHistory(doc);
  if (h.index >= h.stack.length - 1) return false;
  h.index++;
  applySnapshot(doc, h.stack[h.index]);
  emit('history:changed', historyState(doc.id));
  return true;
}

/* ---------------- custom templates ---------------- */
export function listTemplates() { return read(K.templates, []).sort((a, b) => b.createdAt - a.createdAt); }
export function saveAsTemplate(doc, name) {
  const all = read(K.templates, []);
  const item = {
    id: 'usr-' + uid().slice(0, 8),
    name: name || doc.name,
    lang: doc.lang,
    theme: doc.theme,
    category: 'mine',
    settings: doc.settings,
    blocks: JSON.parse(JSON.stringify(doc.blocks)),
    createdAt: Date.now(),
    custom: true
  };
  all.push(item);
  write(K.templates, all);
  emit('templates:changed', all);
  return item;
}
export function deleteTemplate(id) {
  write(K.templates, read(K.templates, []).filter((t) => t.id !== id));
  emit('templates:changed', listTemplates());
}

/* ---------------- storage info ---------------- */
export function storageUsage() {
  let total = 0;
  for (const k of Object.values(K)) {
    const v = localStorage.getItem(k);
    if (v) total += v.length * 2;
  }
  return total;
}
export function clearAllData() {
  Object.values(K).forEach((k) => { if (k !== K.lang) localStorage.removeItem(k); });
  historyCache.clear();
  emit('docs:changed', []);
  emit('themes:changed', []);
  emit('templates:changed', []);
}

/* auto-save queue for settings */
export const persistSettings = debounce((patch) => saveSettings(patch), 250);

export default {
  on, emit, getSettings, saveSettings, THEMES, getThemes, getTheme, themeVars, themeCss,
  listCustomThemes, saveCustomTheme, deleteCustomTheme,
  listDocs, getDoc, createDoc, saveDoc, deleteDoc, duplicateDoc, queueSave, flushSave,
  initHistory, commitHistory, undo, redo, historyState,
  listTemplates, saveAsTemplate, deleteTemplate, storageUsage, clearAllData,
  DEFAULT_SETTINGS, DEFAULT_DOC_SETTINGS
};
