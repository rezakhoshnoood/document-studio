/* core/router.js — SPA hash-based router */
const routes = [];
let notFound = null;
let current = null;
let cleanups = [];

export function route(pattern, handler) {
  const keys = [];
  const rx = new RegExp('^' + pattern
    .replace(/\/$/, '')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/:([\w]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })
    .replace(/\*/g, '.*') + '/?$');
  routes.push({ rx, keys, handler, pattern });
}
export function setNotFound(handler) { notFound = handler; }

export function parseHash() {
  let hash = location.hash.replace(/^#/, '');
  if (!hash || hash === '/') hash = '/home';
  const [pathPart, queryPart] = hash.split('?');
  const params = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => { params[k] = v; });
  }
  return { path: pathPart || '/home', params };
}

export function navigate(path, { replace = false } = {}) {
  const target = '#' + (path.startsWith('/') ? path : '/' + path);
  if (location.hash === target) { resolve(); return; }
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
  if (replace) resolve();
}

export function registerCleanup(fn) { if (typeof fn === 'function') cleanups.push(fn); }
export function runCleanups() {
  cleanups.forEach((fn) => { try { fn(); } catch (e) { console.warn(e); } });
  cleanups = [];
}

let resolving = false;
export function resolve() {
  if (resolving) return;
  resolving = true;
  try {
    const { path, params } = parseHash();
    for (const r of routes) {
      const m = path.match(r.rx);
      if (!m) continue;
      const args = {};
      r.keys.forEach((k, i) => { args[k] = decodeURIComponent(m[i + 1]); });
      runCleanups();
      current = { path, name: r.pattern, args, params };
      try { r.handler({ ...args, ...params, query: params }); }
      catch (err) { console.error('[router]', err); }
      window.scrollTo({ top: 0, behavior: 'auto' });
      resolving = false;
      return;
    }
    runCleanups();
    if (notFound) { current = { path, name: '404' }; notFound({ path }); }
  } finally { resolving = false; }
}

export function currentRoute() { return current; }

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
export default { route, setNotFound, startRouter, navigate, resolve, currentRoute, registerCleanup, parseHash };
