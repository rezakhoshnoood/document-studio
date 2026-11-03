/* features/export-present.js — خروجی HTML با حالت ارائه فعال */
import { buildExportHTML } from './export-html.js';
import { downloadFile } from '../core/dom.js';

export function presentExportName(doc) {
  return (doc.name || 'document').replace(/[\\/:*?"<>|]+/g, '-') + '-present.html';
}

/** فایل HTML با حالت ارائه (به‌صورت پیش‌فرض در حالت present باز می‌شود) */
export async function exportPresentHTML(doc, opts = {}) {
  const html = await buildExportHTML(doc, {
    mode: 'present',
    animations: true,
    bgEffect: opts.bgEffect ?? doc.settings?.bgEffect ?? 'particles',
    effectColor: opts.effectColor ?? doc.settings?.bgEffectColor ?? '#4f8cff',
    effectOpacity: opts.effectOpacity ?? doc.settings?.bgEffectOpacity ?? 0.35,
    theme: opts.theme || doc.theme,
    ...opts
  });
  downloadFile(presentExportName(doc), html, 'text/html;charset=utf-8');
  return html;
}
export default exportPresentHTML;
