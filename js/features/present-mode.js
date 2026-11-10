import {createReactiveBackground} from '../effects/reactive-background.js';
/* features/present-mode.js — موتور حالت ارائه/پرزنتیشن (درون برنامه) */
import { createElement, on, clear } from '../core/dom.js';
import { renderBlock } from '../blocks/base.js';
import { createInteraction } from '../effects/interaction.js';
import { createCustomInteraction } from './custom-interaction.js';
import { setupFreePage } from './free-layout.js';
import { BackgroundManager } from '../effects/manager.js';
import { getAppearance, paletteCss } from './appearance.js';
import { createCustomBackground } from './custom-background.js';
import { t, getLang } from '../core/i18n.js';
import { showDocumentBranding } from '../core/state.js';

const SPEEDS = { slow: 1.4, normal: 1, fast: 0.6 };

export function createPresent(host, doc, opts = {}) {
  const lang = doc.lang || getLang();
  const settings = { ...(doc.settings || {}), ...(opts.settings || {}) };
  const speedFactor = SPEEDS[settings.transitionSpeed] || 1;
  const disposers = [];
  let index = 0, slideMode = false;
  let autoTimer = null;
  let destroyed = false;
  const previousEffect = document.body.getAttribute('data-effect');
  const previousFxColor = document.documentElement.style.getPropertyValue('--fx-color');
  const previousFxOpacity = document.documentElement.style.getPropertyValue('--fx-opacity');

  /* ---------- build DOM ---------- */
  const appearance = getAppearance(doc);
  const root = createElement('div.present', { 'data-web-surface':appearance.surface, 'data-web-width':appearance.width, role: 'dialog', 'aria-modal': 'true', 'aria-label': doc.name || 'presentation' });
  const canvas = createElement('canvas#present-canvas', { 'aria-hidden': 'true' });
  const progressBar = createElement('div.present-topbar', {}, [createElement('i')]);
  const title = createElement('div.present-title', { text: doc.name || '' });
  const exitBtn = createElement('button.present-exit', { title: t('present.exit'), 'aria-label': t('present.exit'), onclick: () => opts.onExit ? opts.onExit() : destroy() }, '✕');
  const scroller = createElement('div.present-scroll');
  const page = createElement('div.present-page.doc-page.site-page', {
    'data-theme': doc.theme || 'modern-blue', 'data-web-style':appearance.style, 'data-web-surface':appearance.surface, 'data-web-width':appearance.width, 'data-web-layout':appearance.layout, 'data-web-theme-hero':String(appearance.themeHero),
    dir: doc.lang === 'en' ? 'ltr' : 'rtl',
    lang: doc.lang || 'fa', 'data-free-layout':String(!!settings.freeLayout)
  });
  if (appearance.palette) page.style.cssText += paletteCss(appearance.palette);
  (doc.blocks || []).forEach((b, i) => {
    const blk = renderBlock(b, { editable: false, animate: settings.animations !== false, index: i, doc, cascade: true, animateCharts: settings.animations !== false });
    blk.style.setProperty('--anim-dur', (parseFloat(b.style?.animationDuration || '0.6') * speedFactor) + 's');
    page.appendChild(blk);
  });
  if (showDocumentBranding(doc)) {
    page.appendChild(createElement('div.doc-footer', { text:lang === 'en' ? 'Made with Document Studio' : 'ساخته شده با سندساز هوشمند' }));
  }
  scroller.appendChild(page);
  const freePage=setupFreePage(page);

  const counter = createElement('span.pc-counter', { text: '0 / ' + (doc.blocks || []).length });
  const controls = createElement('div.present-controls', { role: 'toolbar', 'aria-label': 'presentation controls' }, [
    createElement('button', { title: t('present.first'), 'aria-label': t('present.first'), onclick: () => go(0) }, '⏮'),
    createElement('button', { title: t('present.prev'), 'aria-label': t('present.prev'), onclick: () => go(index - 1) }, '⬆'),
    createElement('button', { title: t('present.next'), 'aria-label': t('present.next'), onclick: () => go(index + 1) }, '⬇'),
    createElement('button', { title: t('present.last'), 'aria-label': t('present.last'), onclick: () => go((doc.blocks || []).length - 1) }, '⏭'),
    createElement('button',{'data-slide-toggle':'true',title:getLang()==='en'?'Toggle individual slides':'نمایش اسلایدی جداگانه','aria-pressed':'false',onclick:e=>{slideMode=!slideMode;e.currentTarget.setAttribute('aria-pressed',String(slideMode));root.classList.toggle('slides-mode',slideMode);go(index);}}, getLang()==='en'?'Slides':'اسلاید'),
    createElement('span.pc-div'),
    counter,
    createElement('span.pc-div'),
    createElement('button', { title: t('present.restart'), 'aria-label': t('present.restart'), onclick: () => replay() }, '🔄'),
    createElement('button', { title: t('present.enterFullscreen'), 'aria-label': t('present.enterFullscreen'), onclick: () => toggleFullscreen() }, '⛶'),
    createElement('button', { title: t('btn.print'), 'aria-label': t('btn.print'), onclick: () => opts.onPrint && opts.onPrint() }, '🖨'),
    createElement('button', { title: t('present.exit'), 'aria-label': t('present.exit'), onclick: () => opts.onExit ? opts.onExit() : destroy() }, '✕')
  ]);
  const hint = createElement('div.present-hint', { html:
    `<div>${t('present.hintKeys').split('·').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = s.match(/^([^:]+):\s*(.*)$/);
      return m ? `<b>${m[1]}</b>: ${m[2].split(/\s+/).map((k) => '<kbd>' + k + '</kbd>').join(' ')}` : s;
    }).join('<br>')}</div>` });

  root.append(canvas, progressBar, title, exitBtn, scroller, controls, hint);
  if (settings.bgEffect === 'custom') { const frame = createCustomBackground(settings.customBackground); frame.className = 'custom-bg'; frame.style.opacity = String(settings.bgEffectOpacity ?? .3); root.insertBefore(frame, scroller); }
  if (settings.bgEffect === 'gradient-flow') { root.classList.add('present-gradient'); root.style.setProperty('--present-gradient-color', settings.bgEffectColor || '#4f8cff'); }
  clear(host).appendChild(root);

  /* ---------- background effect ---------- */
  let effect = null, interaction=null, reactive=null;
  try {
    effect = new BackgroundManager(canvas);
    effect.set(['custom','gradient-flow'].includes(settings.bgEffect) ? 'none' : (settings.bgEffect || 'particles'), {
      color: settings.bgEffectColor || '#4f8cff',
      opacity: settings.bgEffectOpacity ?? 0.35, interactive:false
    });
    if((settings.bgReactMove||settings.bgReactClick)&&settings.bgEffect!=='none'){const isGradient=settings.bgEffect==='gradient-flow',target=isGradient?root:settings.bgEffect==='custom'?root.querySelector('.custom-bg'):canvas;reactive=createReactiveBackground(target,{move:!!settings.bgReactMove,click:!!settings.bgReactClick,pseudo:isGradient});}
    if(settings.bgInteractive && !matchMedia('(prefers-reduced-motion: reduce)').matches) interaction=settings.bgInteractiveMode==='custom'?createCustomInteraction(root,settings.customInteraction||{},settings.bgInteractiveOpacity??.65):createInteraction(root,settings.bgEffectColor||'#4f8cff',settings.bgInteractiveOpacity??.65,settings.bgInteractiveMode||'trail');
    root.style.setProperty('--p-fx-opacity', String(settings.bgEffectOpacity ?? 0.5));
  } catch (e) { console.warn(e); }

  /* ---------- animations ---------- */
  let observer = null;
  function observeBlocks() {
    const nodes = Array.from(page.querySelectorAll('.b.anim'));
    if (!(settings.animations !== false) || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => { n.classList.add('in'); countIn(n); });
      return;
    }
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        countIn(en.target);
        observer.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach((n) => {
      if (n.getAttribute('data-trigger') === 'load') { n.classList.add('in'); countIn(n); }
      else observer.observe(n);
    });
  }
  function countIn(scope) {
    scope.querySelectorAll('[data-count-to]').forEach((el) => {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';
      const target = parseFloat(el.dataset.countTo) || 0;
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const dur = 900 * speedFactor;
      let t0 = null;
      const step = (ts) => {
        if (destroyed) return;
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        const isFa = lang !== 'en';
        (el.querySelector('[data-ds-ink]') || el).textContent = pre + (Math.abs(target) >= 1000
          ? Math.round(val).toLocaleString(isFa ? 'fa-IR' : 'en-US')
          : (isFa ? Math.round(val).toLocaleString('fa-IR') : (Math.round(val * 10) / 10).toString())) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function replay() {
    page.querySelectorAll('.b.anim').forEach((n) => {
      n.classList.remove('in');
      n.querySelectorAll('[data-count-to]').forEach((c) => {
        c.dataset.counted = '';
        (c.querySelector('[data-ds-ink]') || c).textContent = (c.dataset.prefix || '');
      });
    });
    page.querySelectorAll('.b-timeline ol.cascade li').forEach((li) => { li.style.animation = 'none'; void li.offsetWidth; li.style.animation = ''; });
    requestAnimationFrame(observeBlocks);
  }

  /* ---------- navigation ---------- */
  const blocks = () => Array.from(page.querySelectorAll('.b'));
  function go(i) {
    const list = blocks();
    if (!list.length) return;
    index = Math.max(0, Math.min(i, list.length - 1));
    if(slideMode){list.forEach((el,n)=>el.classList.toggle('current-slide',n===index));scroller.scrollTop=0;list[index].classList.add('in');countIn(list[index]);}else{list.forEach(el=>el.classList.remove('current-slide'));list[index].scrollIntoView({ behavior: 'smooth', block: 'center' });}
    updateCounter();
  }
  function updateCounter() {
    const list = blocks();
    counter.textContent = (list.length ? index + 1 : 0) + ' / ' + list.length;
  }
  function nearestIndex() {
    const list = blocks();
    if (!list.length) return 0;
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (scroller.scrollTop <= 4) return 0;
    if (max > 0 && scroller.scrollTop >= max - 6) return list.length - 1;
    const mid = scroller.getBoundingClientRect().top + scroller.clientHeight / 2;
    let best = 0, bestD = Infinity;
    list.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
  function updateProgress() {
    const max = scroller.scrollHeight - scroller.clientHeight;
    const p = max > 0 ? Math.min(scroller.scrollTop / max, 1) : 0;
    progressBar.firstChild.style.width = (p * 100).toFixed(1) + '%';
    const idx = slideMode ? index : nearestIndex();
    if (idx !== index) { index = idx; updateCounter(); }
    if (settings.showProgress === false) progressBar.style.display = 'none';
  }

  /* ---------- keyboard ---------- */
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); opts.onExit ? opts.onExit() : destroy(); }
    else if (e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey) || e.key === 'PageDown') { e.preventDefault(); go(index + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); go(index - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(blocks().length - 1); }
    else if (e.key.toLowerCase() === 'r') { e.preventDefault(); replay(); }
    else if (e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
  };
  disposers.push(on(document, 'keydown', onKey));
  disposers.push(on(scroller, 'scroll', updateProgress, { passive: true }));
  disposers.push(on(root, 'click', (e) => {
    if (e.target === scroller || e.target === root || e.target.closest('.present-page') === null) {
      if (!e.target.closest('button')) go(index + 1);
    }
  }));

  /* ---------- autoscroll ---------- */
  if (settings.autoScroll) {
    autoTimer = setInterval(() => {
      const list = blocks();
      const nextIdx = index + 1 >= list.length ? 0 : index + 1;
      go(nextIdx);
    }, Math.max(2, Number(settings.autoScrollInterval) || 5) * 1000);
  }

  /* ---------- fullscreen ---------- */
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await root.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  }
  setTimeout(() => { toggleFullscreen(); }, 60);

  /* ---------- music ---------- */
  let audio = null;
  if (settings.musicDataUrl || settings.musicUrl) {
    audio = new Audio(settings.musicDataUrl || settings.musicUrl);
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(() => {const retry=()=>{audio?.play().catch(()=>{});};root.addEventListener('pointerdown',retry,{once:true});disposers.push(()=>root.removeEventListener('pointerdown',retry));});
  }

  /* ---------- boot ---------- */
  observeBlocks();
  updateCounter();
  updateProgress();
  setTimeout(() => hint.classList.add('gone'), 4200);
  window.addEventListener('beforeunload', destroy);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearInterval(autoTimer);
    if (observer) observer.disconnect();
    disposers.forEach((fn) => fn());
    window.removeEventListener('beforeunload', destroy);
    freePage.destroy();
    if(interaction)interaction.destroy();if(reactive)reactive.destroy();
    if (effect) { try { effect.destroy(); } catch (_) {} }
    if (previousEffect === null) document.body.removeAttribute('data-effect'); else document.body.setAttribute('data-effect', previousEffect);
    document.documentElement.style.setProperty('--fx-color', previousFxColor);
    document.documentElement.style.setProperty('--fx-opacity', previousFxOpacity);
    if (audio) { audio.pause(); audio = null; }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    clear(host);
    if (typeof opts.onDestroy === 'function') opts.onDestroy();
  }

  return { destroy, next: () => go(index + 1), prev: () => go(index - 1), replay, toggleFullscreen, root, page };
}

export default createPresent;
