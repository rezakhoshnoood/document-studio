/* Document Studio — Service Worker (stale-while-revalidate) */
const VERSION = 'ds-v4.0.0';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/polish.css', './css/core.css', './css/editor.css', './css/landing.css', './css/print.css', './css/present.css',
  './css/skins/flat.css', './css/skins/light.css', './css/ui-colors.css',
  './js/app.js',
  './js/core/ui-colors.js', './js/core/icons.js', './js/core/numbers.js', './js/core/table-math.js', './js/core/dom.js', './js/core/state.js', './js/core/router.js', './js/core/i18n.js', './js/core/fonts.js',
  './js/effects/particles.js', './js/effects/bubbles.js', './js/effects/orbit.js',
  './js/effects/waves.js', './js/effects/matrix.js', './js/effects/gradient-flow.js',
  './js/effects/reactive-background.js', './js/effects/manager.js', './js/effects/extra.js', './js/effects/interaction.js',
  './js/blocks/layout.js', './js/blocks/base.js', './js/blocks/hero.js', './js/blocks/heading.js', './js/blocks/text.js',
  './js/blocks/table-merge.js', './js/blocks/table-keyboard.js', './js/blocks/part-order.js', './js/blocks/typography.js', './js/blocks/icon-design.js', './js/blocks/logo.js', './js/blocks/mini-blocks.js', './js/blocks/ink.js', './js/blocks/parts.js', './js/blocks/table-ops.js', './js/blocks/table.js', './js/blocks/sign.js', './js/blocks/divider.js', './js/blocks/chart.js',
  './js/blocks/timeline.js', './js/blocks/flow.js', './js/blocks/stat-grid.js',
  './js/blocks/image.js', './js/blocks/code.js',
  './js/features/landing-engine.js', './js/features/site-import.js', './js/features/site-components.js', './js/views/landing.js', './js/features/encryption.js', './js/features/export-html.js', './js/features/export-present.js',
  './js/features/export-pdf.js', './js/features/export-json.js', './js/features/share.js',
  './js/features/design-reset.js', './js/features/smart-arrange.js', './js/features/icon-upload.js', './js/features/free-layout.js', './js/features/custom-interaction.js', './js/features/appearance.js', './js/features/template-ui.js', './js/features/custom-background.js', './js/features/export-formats.js', './js/features/theme-builder.js', './js/features/present-mode.js',
  './js/views/home.js', './js/views/chrome.js', './js/views/gallery.js', './js/views/editor.js', './js/views/settings.js',
  './js/views/present.js', './js/views/print.js', './js/templates/index.js', './js/templates/english.js',
  './assets/icons/icon-192.svg', './assets/icons/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // CDN/fonts: let the network handle them
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
