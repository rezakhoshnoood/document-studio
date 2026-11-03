/* Simple interoperable exports; CSV is one file per table. */
import { downloadFile } from '../core/dom.js';
import { numeric, tableFooter } from '../core/numbers.js';
export function exportTablesCSV(doc) {
  const tables = (doc.blocks || []).filter(b => b.type === 'table');
  const csvCell = v => { const value = String(v ?? ''); return '"' + (/^[\s]*[=+@\-\t\r]/.test(value) && numeric(value) === null ? "'" + value : value).replace(/"/g, '""') + '"'; };
  tables.forEach((b, i) => {
    const d = b.data || {};
    const rows = [d.headers || [], ...(d.rows || [])];
    if (d.hasFooter && Array.isArray(d.footerRow)) rows.push(tableFooter(d, doc.lang));
    const csv = '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    downloadFile((doc.name || 'document').replace(/[\\/:*?"<>|]/g, '_') + '-table-' + (i + 1) + '.csv', csv, 'text/csv;charset=utf-8');
  });
  return tables.length;
}
