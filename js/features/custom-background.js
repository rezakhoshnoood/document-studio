/* User-authored background runs in a separate opaque-origin sandbox. */
export const BACKGROUND_EXAMPLE = {
  html: '<div class="glow one"></div>\n<div class="glow two"></div>',
  css: 'html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#0d1227}\n.glow{position:absolute;width:45vmax;height:45vmax;border-radius:50%;filter:blur(65px);opacity:.5;animation:float 9s ease-in-out infinite alternate}\n.one{background:#4f8cff;top:-15%;left:-10%}\n.two{background:#a855f7;bottom:-20%;right:-10%;animation-delay:-4s}\n@keyframes float{to{transform:translate(18vw,12vh) scale(1.25)}}',
  js: ''
};
// This function is serialized into exports; it must not depend on module scope.
export function customBackgroundDocument(code) {
  code = code || {};
  var css = String(code.css || '').replace(/<\/style/gi, '<\\/style');
  var js = String(code.js || '').replace(/<\/script/gi, '<\\/script');
  var html = String(code.html || '');
  var policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'";
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + policy + '"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}' + css + '</style></head><body>' + html + '<scr' + 'ipt>' + js + '</scr' + 'ipt></body></html>';
}
export function createCustomBackground(code) {
  const frame = document.createElement('iframe');
  frame.title = 'Custom background';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.srcdoc = customBackgroundDocument(code);
  return frame;
}
