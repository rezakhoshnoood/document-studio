/* views/present.js — نمای ارائه تمام‌صفحه */
import { createElement, clear } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { getDoc } from '../core/state.js';
import { createPresent } from '../features/present-mode.js';
import { navigate } from '../core/router.js';

export function renderPresent(root, { id }) {
  clear(root);
  const doc = getDoc(id);
  if (!doc) {
    root.appendChild(createElement('div.wrap.section', {}, [
      createElement('h2', { text: 'سند پیدا نشد' }),
      createElement('p.muted', { text: 'ممکن است حذف شده باشد یا لینک نادرست باشد.' }),
      createElement('a.btn.btn-primary', { href: '#/gallery' }, 'بازگشت به گالری')
    ]));
    return () => {};
  }
  const host = createElement('div', { style: { position: 'fixed', inset: '0', zIndex: '150' } });
  root.appendChild(host);
  const engine = createPresent(host, doc, {
    onExit: () => navigate('/editor/' + doc.id),
    onPrint: () => { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); navigate('/print/' + doc.id); },
    onDestroy: () => { /* nothing */ }
  });
  return () => { try { engine.destroy(); } catch (_) {} };
}

export default renderPresent;
