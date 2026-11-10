/* blocks/base.js — کلاس/رجیستری پایه بلوک‌ها، ساخت، رندر و استایل */
import { createElement, uid, debounce, clamp } from '../core/dom.js';
import { showDocumentBranding } from '../core/state.js';
import { persianDigits, normalizeEditableDigits } from '../core/numbers.js';
import { t, getLang } from '../core/i18n.js';
import { applyTextInk, richHTMLWithoutInk } from './ink.js';
import { applyPartOpacity, hasFadedTextParts } from './parts.js';
import { getAppearance, paletteCss } from '../features/appearance.js';
import {applyTypography,sanitizeInlineHTML,applyGenericRich} from './typography.js';
import {applyPartOrder} from './part-order.js';
import {renderMiniBlocks} from './mini-blocks.js';

/* ---------------- registry ---------------- */
export const registry = new Map();
export function registerBlock(def) {
  if (!def || !def.type) throw new Error('invalid block def');
  registry.set(def.type, def);
  return def;
}
export const blockTypes = () => Array.from(registry.values());

export const ANIMATIONS = ['none', 'fadeIn', 'slideUp', 'slideRight', 'zoomIn', 'glow', 'typewriter', 'flipIn', 'bounceIn'];

export const DEFAULT_STYLE = {
  opacity: 100, textOpacity: 100, graphicsOpacity: 100, bgOpacity: 100, bgColor: '', textColor: '', fontSize: '', fontFamily: '', textAlign: '',
  padding: '', borderRadius: '', border: '',
  animation: 'none', animationDuration: '0.6s', animationDelay: '0s', animationTrigger: 'scroll'
};

export function createBlock(type, override = {}) {
  const def = registry.get(type);
  if (!def) throw new Error('unknown block type: ' + type);
  return {
    id: uid(),
    type,
    data: { ...(def.createData ? def.createData() : {}), ...(override.data || {}) },
    style: { ...DEFAULT_STYLE, ...(override.style || {}) }
  };
}

/* ---------------- style helpers ---------------- */
const px = (v) => (v === '' || v === null || v === undefined ? '' : (typeof v === 'number' ? v + 'px' : String(v)));

export function styleToCss(style = {}) {
  const css = {};
  if (style.opacity !== undefined && style.opacity !== '' && Number.isFinite(Number(style.opacity))) css['--block-opacity'] = String(Math.max(0, Math.min(100, Number(style.opacity))) / 100);
  if (style.textOpacity != null && Number.isFinite(Number(style.textOpacity))) css['--block-text-opacity']=String(Math.max(0,Math.min(100,Number(style.textOpacity)))/100);
  if (style.graphicsOpacity != null && Number.isFinite(Number(style.graphicsOpacity))) css['--block-graphics-opacity']=String(Math.max(0,Math.min(100,Number(style.graphicsOpacity)))/100);
  if (style.bgColor) {
    const color=String(style.bgColor), amount=style.bgOpacity == null ? 100 : Math.max(0,Math.min(100,Number(style.bgOpacity)||0));
    const hex=/^#([0-9a-f]{6})$/i.exec(color);
    const bg=hex && amount<100 ? `rgba(${parseInt(hex[1].slice(0,2),16)},${parseInt(hex[1].slice(2,4),16)},${parseInt(hex[1].slice(4,6),16)},${amount/100})` : color;
    css.background=bg; css['--block-bg-override']=bg;
  }
  if(style.bgGradient && /^#[0-9a-f]{6}$/i.test(style.bgGradient.a||'') && /^#[0-9a-f]{6}$/i.test(style.bgGradient.b||'')) {
    const a=Math.max(0,Math.min(1,Number(style.bgOpacity??100)/100)),rgba=h=>`rgba(${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)},${a})`;
    css['--block-bg-override']=`linear-gradient(${Math.max(0,Math.min(360,Number(style.bgGradient.angle)||0))}deg,${rgba(style.bgGradient.a)},${rgba(style.bgGradient.b)})`;css.background=css['--block-bg-override'];
  }
  if(typeof style.bgImage==='string' && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(style.bgImage)){
    css['--block-bg-image']=`url("${style.bgImage}")`;css.backgroundImage=css['--block-bg-image'];css.backgroundSize='cover';css.backgroundPosition='center';
  }
  if (style.textColor) css.color = style.textColor;
  if (style.fontSize) css.fontSize = px(style.fontSize);
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.padding) css.padding = px(style.padding);
  if (style.borderRadius !== '' && style.borderRadius != null) css.borderRadius = px(style.borderRadius);
  if (style.blockWidth != null && Number.isFinite(Number(style.blockWidth))) { css.width=Math.max(20,Math.min(100,Number(style.blockWidth)))+'%';css.maxWidth='100%'; }
  if (style.minHeight != null && Number(style.minHeight)>0) css.minHeight=Math.min(2000,Math.max(0,Number(style.minHeight)))+'px';
  // Legacy fixed heights are now minimum heights: content is never trapped in a scroller.
  if (Number(style.blockHeight)>0) css.minHeight=Math.max(Number(style.minHeight)||0,Math.min(2000,Number(style.blockHeight)))+'px';
  if(Number.isFinite(Number(style.flowOffset))){css.marginLeft=Math.max(0,Math.min(100,Number(style.flowOffset)))+'%';css.marginRight='auto';}
  if(Number.isFinite(Number(style.flowShiftY))&&Number(style.flowShiftY)!==0){css.top=Math.max(-2000,Math.min(2000,Number(style.flowShiftY)))+'px';css.marginBottom=`calc(16px + ${Math.max(-2000,Math.min(2000,Number(style.flowShiftY)))}px)`;}
  if(Number.isFinite(Number(style.stackOrder)))css.zIndex=String(Math.max(0,Math.min(9999,Number(style.stackOrder))));
  if (style.border) css.border = style.border;
  return css;
}

export function animAttrs(block, index = 0, animate = false) {
  const s = block.style || {};
  if (!animate || !s.animation || s.animation === 'none') return { className: '', css: {} };
  const delay = s.animationDelay === 'auto' ? (Math.min(index, 8) * 0.09).toFixed(2) + 's' : (s.animationDelay || '0s');
  return {
    className: 'anim',
    attrs: { 'data-anim': s.animation, 'data-trigger': s.animationTrigger || 'scroll' },
    css: { '--anim-dur': s.animationDuration || '0.6s', '--anim-delay': delay }
  };
}

/* ---------------- rendering ---------------- */
/**
 * renderBlock(block, ctx)
 * ctx: { editable, animate, index, doc, onChange }
 */
export function applyBackgroundLayer(el,block){
 const style=block.style||{},image=!!style.bgImage,defaultHero=block.type==='hero'&&!style.bgColor&&!style.bgGradient&&!image&&Number(style.bgOpacity??100)<100;
 const layer=image||defaultHero;el.style.setProperty('--block-bg-alpha',String(Math.max(0,Math.min(100,Number(style.bgOpacity??100)))/100));
 if(layer){el.dataset.bgLayer='true';el.style.removeProperty('background-image');el.style.setProperty('--block-layer-bg',image?`url("${style.bgImage}")`:(block.data?.bgGradient||'var(--d-header-bg)'));}else{delete el.dataset.bgLayer;el.style.removeProperty('--block-layer-bg');}
}

export function renderBlock(block, ctx = {}) {
  const def = registry.get(block.type);
  const wrap = createElement('div.b', {
    'data-id': block.id,
    'data-type': block.type,
    class: 'b-' + block.type
  });
  if (!def) {
    wrap.innerHTML = '<p style="color:#b00">Unknown block: ' + block.type + '</p>';
    return wrap;
  }
  const a = animAttrs(block, ctx.index || 0, ctx.animate);
  if (a.className) {
    wrap.classList.add(a.className);
    Object.entries(a.attrs || {}).forEach(([k, v]) => wrap.setAttribute(k, v));
  }
  if (block.style?.bgColor || block.style?.bgGradient || block.style?.bgImage) wrap.dataset.customBg='true';
  if (block.style?.borderRadius !== '' && block.style?.borderRadius != null) wrap.dataset.customRadius='true';
  const rawStyle = styleToCss(block.style);
  if (block.type === 'hero' && (block.style?.bgColor||block.style?.bgGradient||block.style?.bgImage)){delete rawStyle.background;delete rawStyle.backgroundImage;}
  if(block.type==='logo'&&block.style?.logoFitWidthPx&&!ctx.doc?.settings?.freeLayout){rawStyle.width=Math.max(20,Math.min(500,Number(block.style.logoFitWidthPx)))+'px';rawStyle.maxWidth='100%';if(!Number.isFinite(Number(block.style.flowOffset))){const a=block.data.align||'right';rawStyle.marginLeft=a==='right'||a==='center'?'auto':'0';rawStyle.marginRight=a==='left'||a==='center'?'auto':'0';}}
  if(ctx.doc?.settings?.freeLayout){delete rawStyle.top;delete rawStyle.marginBottom;}
  if(ctx.doc?.settings?.freeLayout && Number.isFinite(Number(block.style?.freeX)) && Number.isFinite(Number(block.style?.freeY))){ rawStyle['--free-x']=Math.max(0,Math.min(95,Number(block.style.freeX)))+'%';rawStyle['--free-y']=Math.max(0,Math.min(50000,Number(block.style.freeY)))+'px';rawStyle['--free-w']=Math.max(5,Math.min(100-Math.max(0,Math.min(95,Number(block.style.freeX))),Number(block.style.blockWidth)||100))+'%'; }
  if (a.css && (a.css['--anim-dur'] || a.css['--anim-delay'])) {
    rawStyle['--anim-dur'] = a.css['--anim-dur'];
    rawStyle['--anim-delay'] = a.css['--anim-delay'];
  }
  Object.entries(rawStyle).forEach(([k, v]) => { wrap.style.setProperty(k.startsWith('--') ? k : k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()), v); });

  let inner;
  try { inner = def.render(block, ctx); }
  catch (err) {
    console.error('[block render]', block.type, err);
    inner = createElement('div', { text: '⚠ ' + block.type });
  }
  if(inner instanceof Element){const children=renderMiniBlocks(block,ctx);if(children)inner.appendChild(children);}
  if (inner instanceof Node) wrap.appendChild(inner);
  else if (typeof inner === 'string') wrap.insertAdjacentHTML('beforeend', inner);
  applyBackgroundLayer(wrap,block);
  applyPartOpacity(wrap,block);
  applyGenericRich(wrap,block,ctx);
  applyPartOrder(wrap,block);
  applyTypography(wrap,block);
  if (Number(block.style?.textOpacity ?? 100) < 100 || hasFadedTextParts(block.style)) applyTextInk(wrap,true);
  return wrap;
}

export function renderPage(doc, ctx = {}) {
  const a = getAppearance(doc);
  const page = createElement('div.doc-page.site-page', {
    'data-web-surface': a.surface, 'data-web-style':a.style, 'data-web-layout':a.layout, 'data-web-width':a.width, 'data-web-theme-hero':String(a.themeHero),
    dir: doc.lang === 'en' ? 'ltr' : 'rtl', lang: doc.lang === 'en' ? 'en' : 'fa',
    'data-theme': doc.theme || 'modern-blue',
    'data-lang': doc.lang || 'fa', 'data-free-layout':String(!!doc.settings?.freeLayout)
  });
  if (a.palette) page.style.cssText += paletteCss(a.palette);
  (doc.blocks || []).forEach((b, i) => {
    page.appendChild(renderBlock(b, { ...ctx, index: i, doc }));
  });
  if (showDocumentBranding(doc) && ctx.footer !== false) {
    page.appendChild(createElement('div.doc-footer', { text:doc.lang === 'en' ? 'Made with Document Studio' : 'ساخته شده با سندساز هوشمند' }));
  }
  return page;
}

/* ---------------- inline editing ---------------- */
export function setPath(obj, path, value) {
  const parts = String(path).split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] === undefined || cur[k] === null) cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}
export function getPath(obj, path) {
  return String(path).split('.').reduce((a, k) => (a === undefined || a === null ? a : a[k]), obj);
}

/**
 * فعال‌سازی ویرایش درون‌خطی روی عناصر دارای [data-edit]
 * onChange(msg) هر بار که محتوا تغییر می‌کند صدا زده می‌شود.
 */
export function attachInlineEditing(root, block, onChange, docLang='fa') {
  const nodes = root.querySelectorAll('[data-edit]');
  nodes.forEach((node) => {
    if (node.dataset.editBound === '1') return;
    node.dataset.editBound = '1';
    node.setAttribute('contenteditable', 'true');
    node.setAttribute('spellcheck', 'false');
    node.classList.add('is-editable');
    let dirty=false;
    node.addEventListener('beforeinput',e=>{const sel=window.getSelection(),parent=sel?.anchorNode?.parentElement;const word=sel?.anchorNode?.textContent?.slice(0,sel.anchorOffset).split(/\s/).pop()||'';if(parent?.closest('a,code,pre')||/(?:https?:\/\/|www\.|@)/i.test(word)||docLang!=='fa'||e.isComposing||e.inputType!=='insertText'||!/[0-9٠-٩]/.test(e.data||''))return;e.preventDefault();document.execCommand('insertText',false,persianDigits(e.data));});
    const read = () => (node.dataset.rich === '1' ? (node.dataset.formatInstance||node.dataset.edit==='textHTML'||/^miniBlocks\.\d+\.textHTML$/.test(node.dataset.edit)?sanitizeInlineHTML(richHTMLWithoutInk(node)):richHTMLWithoutInk(node)) : node.textContent.trim());
    const syncPlain=()=>{if(node.dataset.formatInstance){block.data.richParts ||= {};block.data.richParts[node.dataset.formatInstance]={text:node.textContent.trim(),html:read()};setPath(block.data,node.dataset.edit,node.textContent.trim());}if(node.dataset.edit==='textHTML')block.data.text=node.textContent.trim();const m=/^miniBlocks\.(\d+)\.textHTML$/.exec(node.dataset.edit);if(m&&block.data.miniBlocks?.[Number(m[1])])block.data.miniBlocks[Number(m[1])].text=node.textContent.trim();};
    if(block.type==='table'&&docLang==='fa')node.addEventListener('compositionend',()=>{if(normalizeEditableDigits(node))node.dispatchEvent(new Event('input',{bubbles:true}));});
    node.addEventListener('input', (e) => {
      if(block.type==='table'&&docLang==='fa'&&!e.isComposing&&e.inputType==='insertFromPaste')normalizeEditableDigits(node);
      dirty=true;
      setPath(block.data, node.dataset.edit, read());syncPlain();
      onChange({ silent: true });
    });
    node.addEventListener('blur', () => {
      if(!dirty)return;dirty=false;
      setPath(block.data, node.dataset.edit, read());syncPlain();
      onChange({ commit: true });
    });
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && node.dataset.multiline !== '1') {
        e.preventDefault();
        node.blur();
      }
      if (e.key === 'Escape') { node.blur(); }
    });
    node.addEventListener('paste', (e) => {
      // چسباندن به‌صورت متن ساده تا ساختار سند خراب نشود
      if (node.dataset.rich === '1') return;
      e.preventDefault();
      let text = (e.clipboardData || window.clipboardData).getData('text');if(docLang==='fa')text=persianDigits(text);
      document.execCommand('insertText', false, text);
    });
  });
}

/* ---------------- props helpers (پنل راست) ---------------- */
export function propsApi(block, { onChange, rerender, onChangeCommit, doc, refresh } = {}) {
  const fire = (commit) => { if (typeof onChange === 'function') onChange({ commit }); };
  const api = {
    block, doc,
    refresh() { if (refresh) refresh(); },
    update(patch, opts = {}) {
      Object.assign(block.data, patch);
      if (opts.rerender !== false) rerender && rerender();
      fire(!!opts.commit);
    },
    setStyle(patch, opts = {}) {
      Object.assign(block.style, patch);
      if (opts.rerender !== false) rerender && rerender();
      fire(!!opts.commit);
    },
    rerender() { rerender && rerender(); fire(false); },
    commit() { fire(true); },
    t
  };

  /* --- UI builders --- */
  api.group = (title, children) => createElement('div.prop-group', {}, [
    createElement('h4', { text: title }),
    ...(Array.isArray(children) ? children : [children])
  ]);
  api.field = (label, control, extraClass = '') => createElement('div.field' + (extraClass ? '.' + extraClass : ''), {},
    [label ? createElement('label', { text: label }) : null, control]);

  api.text = (label, value, onInput, { multiline = false, dir = 'auto', placeholder = '' } = {}) => {
    const input = createElement(multiline ? 'textarea.textarea' : 'input.input', { value: value ?? '', dir, placeholder, 'aria-label':label || '' });
    if (multiline) input.rows = 3;
    input.addEventListener('input', () => { if(doc?.lang==='fa' && dir!=='ltr' && block.type!=='code' && !/(?:https?:\/\/|www\.|@)/i.test(input.value)){const pos=input.selectionStart;input.value=input.value.replace(/[0-9]/g,c=>'۰۱۲۳۴۵۶۷۸۹'[Number(c)]);if(pos!=null)input.setSelectionRange(pos,pos);}onInput(input.value); });
    input.addEventListener('change', () => { onInput(input.value, true); fire(true); });
    return api.field(label, input);
  };
  api.number = (label, value, onInput, { min = 0, max = 400, step = 1, suffix = '' } = {}) => {
    const input = createElement('input.input', { type: 'number', value: value ?? 0, min, max, step, 'aria-label':label || '' });
    input.addEventListener('input', () => onInput(clamp(Number(input.value || 0), min, max)));
    return api.field(label + (suffix ? ' ' + suffix : ''), input);
  };
  api.color = (label, value, onInput, { allowEmpty = true } = {}) => {
    const wrap = createElement('div.row', { style: { gap: '.35rem' } });
    const input = createElement('input', { type: 'color', value: value || '#4f8cff', 'aria-label': label, style: { flex: '1' } });
    input.addEventListener('input', () => onInput(input.value));
    input.addEventListener('change', () => fire(true));
    wrap.appendChild(input);
    if (allowEmpty) {
      const clearBtn = createElement('button.btn.btn-sm', { title: 'clear', onclick: () => { onInput(''); fire(true); } }, '⨯');
      wrap.appendChild(clearBtn);
    }
    return api.field(label, wrap);
  };
  api.range = (label, value, onInput, { min = 0, max = 100, step = 1, unit = '' } = {}) => {
    const out = createElement('span.tiny.muted', { text: value + unit, style: { minWidth: '38px', textAlign: 'center' } });
    const input = createElement('input.range', { type: 'range', min, max, step, value: value ?? min, 'aria-label':label || '' });
    input.addEventListener('input', () => { out.textContent = input.value + unit; onInput(Number(input.value)); });
    input.addEventListener('change', () => fire(true));
    return api.field(label, createElement('div.row', { style: { gap: '.45rem' } }, [input, out]));
  };
  api.select = (label, value, options, onInput) => {
    const sel = createElement('select.select',{'aria-label':label || ''});
    options.forEach((o) => {
      const opt = createElement('option', { value: o.value, text: o.label });
      if (String(o.value) === String(value)) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => onInput(sel.value));
    return api.field(label, sel);
  };
  api.switch = (label, value, onInput) => {
    const input = createElement('input', { type: 'checkbox' });
    input.checked = !!value;
    input.addEventListener('change', () => onInput(input.checked));
    return createElement('label.switch', { style: { marginBottom: '.5rem', display: 'flex' } }, [input, label]);
  };
  api.seg = (label, value, options, onInput) => {
    const box = createElement('div.seg');
    options.forEach((o) => {
      const b = createElement('button', { type: 'button', text: o.label });
      if (String(o.value) === String(value)) b.classList.add('on');
      b.addEventListener('click', () => {
        box.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        onInput(o.value);
      });
      box.appendChild(b);
    });
    return api.field(label, box);
  };
  api.button = (label, onClick, cls = '') => createElement('button.add-mini' + (cls ? '.' + cls : ''), { type: 'button', text: label, onclick: onClick });
  api.row = (children) => createElement('div.prop-row', {}, children);
  api.listWrap = () => createElement('div.mini-list');
  return api;
}

/* --- استایل مشترک همه بلوک‌ها در پنل ویژگی‌ها --- */
export function commonStyleProps(api) {
  const L=(fa,en)=>getLang()==='en'?en:fa;
  const s = api.block.style;
  return [
    api.group(L('ظاهر عمومی کل بلوک','Whole-block appearance'), [
      api.row([
        api.color(t('prop.color'), s.textColor, (v) => api.setStyle({ textColor: v }))
      ]),
      api.row([
        api.seg(t('prop.align'), s.textAlign || '', [
          { value: '', label: '—' }, { value: 'right', label: L('راست','Right') },
          { value: 'center', label: L('وسط','Center') }, { value: 'left', label: L('چپ','Left') }
        ], (v) => api.setStyle({ textAlign: v })),
      ]),
      api.row([
        api.number(L('اندازه فونت کل بلوک','Whole-block font size'), parseInt(s.fontSize) || 0, (v) => api.setStyle({ fontSize: v || '' }), { min: 0, max: 48 }),
        api.number(t('prop.radius'), parseInt(s.borderRadius) || 0, (v) => api.setStyle({ borderRadius: v || '' }), { min: 0, max: 40 })
      ]),
      api.number(t('prop.padding'), parseInt(s.padding) || 0, (v) => api.setStyle({ padding: v || '' }), { min: 0, max: 60 }),
      api.select(L('فونت کل بلوک','Whole-block font'), s.fontFamily || '', [
        { value: '', label: L('پیش\u200cفرض تم','Theme default') }, { value: 'Vazirmatn, sans-serif', label: L('وزیرمتن','Vazirmatn') },
        { value: 'Inter, sans-serif', label: 'Inter' }, { value: 'Georgia, serif', label: 'Serif' },
        { value: 'ui-monospace, monospace', label: 'Monospace' }
      ], (v) => api.setStyle({ fontFamily: v }))
    ]),
    api.group(t('prop.animation'), [
      api.select(L('انیمیشن','Animation'), s.animation || 'none', ANIMATIONS.map((a) => ({ value: a, label: a === 'none' ? L('بدون','None') : a })), (v) => api.setStyle({ animation: v })),
      api.row([
        api.select(t('prop.duration'), s.animationDuration || '0.6s', [
          { value: '0.3s', label: '0.3s' }, { value: '0.6s', label: '0.6s' },
          { value: '1s', label: '1s' }, { value: '1.6s', label: '1.6s' }
        ], (v) => api.setStyle({ animationDuration: v })),
        api.select(t('prop.delay'), s.animationDelay || '0s', [
          { value: '0s', label: '0' }, { value: 'auto', label: 'auto (cascade)' },
          { value: '0.2s', label: '0.2s' }, { value: '0.5s', label: '0.5s' }, { value: '1s', label: '1s' }
        ], (v) => api.setStyle({ animationDelay: v }))
      ]),
      api.select(t('prop.trigger'), s.animationTrigger || 'scroll', [
        { value: 'scroll', label: 'scroll (viewport)' }, { value: 'load', label: L('load (فوری)','load (immediate)') }
      ], (v) => api.setStyle({ animationTrigger: v }))
    ])
  ];
}

export default { registry, registerBlock, createBlock, renderBlock, renderPage, blockTypes, ANIMATIONS, DEFAULT_STYLE };

/* --------------------------------------------------------------------------
   ثبت همه بلوک‌ها (ترتیب = ترتیب نمایش در پالت)
   -------------------------------------------------------------------------- */
import heroDef from './hero.js';
import headingDef from './heading.js';
import textDef from './text.js';
import tableDef from './table.js';
import chartDef from './chart.js';
import timelineDef from './timeline.js';
import statGridDef from './stat-grid.js';
import flowDef from './flow.js';
import signDef from './sign.js';
import dividerDef from './divider.js';
import imageDef from './image.js';
import logoDef from './logo.js';
import codeDef from './code.js';
import layoutDef from './layout.js';

[heroDef, headingDef, textDef, tableDef, chartDef, timelineDef, statGridDef, flowDef, signDef, dividerDef, imageDef, logoDef, codeDef, layoutDef]
  .forEach(registerBlock);
