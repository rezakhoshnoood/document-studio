/* features/export-json.js — بکاپ/بازیابی JSON */
import { downloadFile } from '../core/dom.js';
import { listDocs, getDoc, createDoc, cloneBlocksWithRemappedIds, remapPrintSettings } from '../core/state.js';
import { uid } from '../core/dom.js';

const slug = (s) => String(s || 'document').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 60);

export function exportDocJSON(doc) {
  const payload = {
    format: 'document-studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: [doc]
  };
  downloadFile(slug(doc.name) + '.json', JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  return payload;
}

export function exportAllJSON() {
  const docs = listDocs().map((d) => getDoc(d.id)).filter(Boolean);
  const payload = {
    format: 'document-studio-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: docs
  };
  downloadFile('document-studio-backup-' + new Date().toISOString().slice(0, 10) + '.json',
    JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  return payload;
}

export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); }
      catch (e) { reject(new Error('invalid JSON')); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** ورود اسناد — هر سند با شناسه جدید ساخته می‌شود */
export function importDocuments(data) {
  const items = Array.isArray(data) ? data : (data.documents || (data.blocks ? [data] : []));
  const created = [];
  items.forEach((d) => {
    if (!d || !Array.isArray(d.blocks)) return;
    const blocks=cloneBlocksWithRemappedIds(d.blocks);
    const settings=remapPrintSettings(d.settings,d.blocks,blocks);
    const imported=createDoc({
      name: (d.name || 'سند وارد‌شده') + ' (وارد‌شده)',
      lang: d.lang, theme: d.theme, settings, blocks
    },{preserveBaseline:!!settings.designBaseline,legacy:!settings.designBaseline});
    if (imported) created.push(imported);
  });
  return created;
}

export function pickJSONFile(onPick) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const data = await readJSONFile(file);
      onPick(data, file);
    } catch (e) {
      onPick(null, file, e);
    }
  });
  input.click();
}

export default { exportDocJSON, exportAllJSON, importDocuments, pickJSONFile, readJSONFile };
