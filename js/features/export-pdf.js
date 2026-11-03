/* features/export-pdf.js — چاپ / ذخیره PDF از طریق print dialog */
import { buildExportHTML } from './export-html.js';

/** سندی را در یک iframe مخفی رندر و پنجره چاپ را باز می‌کند */
export async function printDocument(doc, { theme } = {}) {
  const html = await buildExportHTML(doc, {
    mode: 'readonly',
    animations: false,
    bgEffect: 'none',
    theme: theme || doc.theme,
    effectOpacity: 0
  });
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;inset-inline-end:0;bottom:0;width:1px;height:1px;opacity:0;border:0;pointer-events:none';
    document.body.appendChild(frame);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(() => frame.remove(), 600);
      resolve(true);
    };
    frame.onload = () => {
      try {
        const win = frame.contentWindow;
        win.focus();
        win.print();
        setTimeout(finish, 900);
      } catch (e) {
        console.error(e);
        finish();
      }
    };
    frame.srcdoc = html;
    if ('onafterprint' in window) window.addEventListener('afterprint', finish, { once: true });
    setTimeout(finish, 20000);
  });
}

/** چاپ مستقیم صفحه فعلی ادیتور (سریع‌تر، بدون iframe) */
export function printCurrent() {
  window.print();
}
export default printDocument;
