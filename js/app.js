/* app.js — بوت‌استرپ اصلی «سندساز هوشمند» (Document Studio) */
import { $, clear, toast, openModal, closeModal, createElement } from './core/dom.js';
import { initLang, getLang, t, setLang } from './core/i18n.js';
import { route, setNotFound, startRouter, navigate, registerCleanup, parseHash } from './core/router.js';
import { getSettings, saveSettings, getDoc, createDoc, themeCss, on as onState } from './core/state.js';
import { bg } from './effects/manager.js';
import { uiColors } from './core/ui-colors.js';
import { injectAppFonts } from './core/fonts.js';
import { renderHome } from './views/home.js';
import { renderGallery } from './views/gallery.js';
import { renderEditor } from './views/editor.js';
import { renderSettings } from './views/settings.js';
import { renderPresent } from './views/present.js';
import { renderPrint } from './views/print.js';
import { renderLanding } from './views/landing.js';
import { decodeDocParam } from './features/share.js';

const VERSION = '4.0.0';

function applyWorkspaceChrome() {
  const settings = getSettings();
  const ui=uiColors(settings),body=document.body;
  body.dataset.skin=ui.mode;body.dataset.uiPalette=ui.palette.id;
  for(const [key,value] of Object.entries({'--bg':ui.bg,'--panel':ui.panel,'--panel-solid':ui.panel,'--border':ui.border,'--text':ui.text,'--muted':ui.muted,'--accent':ui.accent,'--accent-2':ui.accent,'--ui-accent':ui.accent,'--app-bg':ui.bg,'--app-panel':ui.panel,'--app-border':ui.border,'--app-text':ui.text,'--app-muted':ui.muted,'--app-accent':ui.accent}))body.style.setProperty(key,value);
  body.style.setProperty('--accent-soft',`color-mix(in srgb,${ui.accent} 20%,${ui.panel})`);
  body.dataset.uiDensity=settings.uiDensity==='compact'?'compact':'comfortable';body.dataset.uiMotion=settings.uiMotion===false?'off':'on';
  body.style.setProperty('--ui-scale',String(Math.max(.9,Math.min(1.15,Number(settings.uiScale)||1))));
  if(settings.uiRadius!=null && Number.isFinite(Number(settings.uiRadius))){const n=Math.max(0,Math.min(24,Number(settings.uiRadius)));body.style.setProperty('--radius',n+'px');body.style.setProperty('--radius-sm',Math.round(n*.7)+'px');}else{body.style.removeProperty('--radius');body.style.removeProperty('--radius-sm');}
  const path=parseHash().path;
  const inWorkspace=/^\/(editor|print|present|landing)(\/|$)/.test(path);
  bg.set(inWorkspace?'none':(settings.effect || 'particles'), {
    color: settings.effectColor || '#4f8cff',
    opacity: settings.effectOpacity ?? 0.55, interactive: !!settings.effectInteractive
  });
}

function root() { return document.getElementById('app'); }

function boot() {
  /* ---------- فونت جاسازی‌شده (آفلاین) ---------- */
  injectAppFonts();

  const themeStyle = document.createElement('style'); themeStyle.id='ds-theme-styles';
  const updateThemeStyles = () => { themeStyle.textContent=themeCss('.doc-page'); };
  updateThemeStyles(); document.head.appendChild(themeStyle); onState('themes:changed',updateThemeStyles);

  /* ---------- زبان ---------- */
  const lang = initLang();
  const settings = getSettings();
  if (settings.lang && settings.lang !== lang) setLang(settings.lang);

  /* ---------- ظاهر و افکت ---------- */
  applyWorkspaceChrome();

  /* ---------- مسیرها ---------- */
  route('/home', () => {
    document.body.classList.remove('editing');
    applyWorkspaceChrome(); renderHome(root());
  });
  route('/gallery', () => {
    document.body.classList.remove('editing');
    applyWorkspaceChrome(); renderGallery(root());
  });
  route('/landing/:id/:block', ({id,block}) => { applyWorkspaceChrome(); renderLanding(root(),{id,block}); });
  route('/settings', () => {
    document.body.classList.remove('editing');
    applyWorkspaceChrome(); renderSettings(root());
  });
  route('/editor', () => {
    renderEditor(root(), {});
  });
  route('/editor/:id', ({ id }) => {
    renderEditor(root(), { id });
  });
  route('/print/:id', ({ id }) => { document.body.classList.remove('editing'); renderPrint(root(), { id }); });
  route('/present/:id', ({ id }) => {
    const cleanup = renderPresent(root(), { id });
    if (typeof cleanup === 'function') registerCleanup(cleanup);
  });

  /* ---------- ورود سند از لینک اشتراک ---------- */
  route('/import', async () => {
    const { params } = parseHash();
    const main = root();
    clear(main);
    main.appendChild(createElement('div.wrap.section', {}, [
      createElement('h2', { text: 'در حال بازکردن سند اشتراکی…' }),
      createElement('p.muted', { text: 'لطفاً صبر کنید.' })
    ]));
    try {
      const partial = await decodeDocParam(params.d);
      const doc = createDoc({
        name: partial.name || 'سند اشتراکی',
        theme: partial.theme,
        lang: partial.lang,
        settings: partial.settings,
        blocks: partial.blocks
      });
      if (!doc) throw new Error('storage unavailable');
      toast('سند اشتراکی باز شد', 'ok');
      navigate('/editor/' + doc.id);
    } catch (err) {
      console.error(err);
      clear(main);
      main.appendChild(createElement('div.wrap.section', {}, [
        createElement('h2', { text: 'لینک معتبر نیست' }),
        createElement('p.muted', { text: 'ممکن است لینک ناقص کپی شده باشد. از فایل HTML یا JSON استفاده کنید.' }),
        createElement('a.btn.btn-primary', { href: '#/gallery' }, 'بازگشت به گالری')
      ]));
    }
  });

  setNotFound(({ path }) => {
    clear(root()).appendChild(createElement('div.wrap.section', {}, [
      createElement('h1', { text: '۴۰۴ — صفحه پیدا نشد' }),
      createElement('p.muted', { text: 'مسیر ' + path + ' وجود ندارد.' }),
      createElement('a.btn.btn-primary', { href: '#/home' }, 'بازگشت به خانه')
    ]));
  });

  startRouter();

  /* ---------- Service Worker ---------- */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[sw]', err));
    });
  }

  /* ---------- نصب PWA ---------- */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__dsInstallPrompt = e;
  });

  /* ---------- وضعیت آنلاین ---------- */
  window.addEventListener('offline', () => toast(t('msg.offline')));
  window.addEventListener('online', () => toast('آنلاین شدید', 'ok'));

  /* ---------- تغییر تنظیمات ---------- */
  import('./core/state.js').then(({ on }) => {
    on('settings:changed', () => applyWorkspaceChrome());
  });

  /* ---------- صفحه کلید سراسری ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.altKey) {
      openModal({
        title: 'میان‌برهای صفحه‌کلید',
        body: createElement('div.about-box', { html: `
          <b>ادیتور</b><br>
          <kbd>Ctrl/⌘ + Z</kbd> واگرد · <kbd>Ctrl/⌘ + ⇧ + Z</kbd> ازنو<br>
          <kbd>Ctrl/⌘ + S</kbd> ذخیره · <kbd>Ctrl/⌘ + P</kbd> چاپ<br>
          <kbd>Ctrl/⌘ + D</kbd> تکثیر بلوک · <kbd>Delete</kbd> حذف بلوک · <kbd>Esc</kbd> لغو انتخاب<br><br>
          <b>حالت ارائه</b><br>
          <kbd>↑</kbd>/<kbd>↓</kbd>/<kbd>Space</kbd> جابه‌جایی · <kbd>R</kbd> اجرای مجدد انیمیشن<br>
          <kbd>F</kbd> تمام‌صفحه · <kbd>Esc</kbd> خروج
        ` }),
        footer: [createElement('button.btn.btn-sm', { onclick: () => closeModal() }, 'بستن')]
      });
    }
  });

  /* ---------- خطاهای پیش‌بینی‌نشده ---------- */
  window.addEventListener('error', (e) => {
    console.error('[app error]', e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[promise]', e.reason);
  });

  console.info(`%c Document Studio v${VERSION} %c طراح: رضا خوشنود — reza.khoshnoood@gmail.com `,
    'background:#4f8cff;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px',
    'background:#16162a;color:#9aa4bf;border-radius:0 4px 4px 0;padding:2px 6px');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
