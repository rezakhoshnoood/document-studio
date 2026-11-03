import {remapMergeInsert,remapMergeDelete} from './table-merge.js';
/* Table mutations keep footer sums and every linked chart column reference in sync. */
function remapCellOpacity(table,rowMap,colMap){
 for(const prop of ['cellOpacity','cellAlign','cellTypography']){const old=table.style?.[prop];if(!old)continue;const next={};
 Object.entries(old).forEach(([key,val])=>{const p=key.split(':');if((p[0]==='h'||p[0]==='f')&&p.length===2){const c=colMap(Number(p[1]));if(c>=0)next[p[0]+':'+c]=val;}
 else if(p[0]==='r'&&p.length===3){const row=rowMap(Number(p[1])),c=colMap(Number(p[2]));if(row>=0&&c>=0)next['r:'+row+':'+c]=val;}else next[key]=val;});table.style[prop]=next;}
 const rich=table.data?.richParts;if(rich){const next={};for(const [key,val] of Object.entries(rich)){const p=key.split(':');if((p[0]==='h'||p[0]==='f')&&p.length===2){const c=colMap(Number(p[1]));if(c>=0)next[p[0]+':'+c]=val;}else if(p[0]==='r'&&p.length===3){const r=rowMap(Number(p[1])),c=colMap(Number(p[2]));if(r>=0&&c>=0)next['r:'+r+':'+c]=val;}else next[key]=val;}table.data.richParts=next;}
}
const identity=x=>x;
function linked(doc, id) { return (doc.blocks || []).filter(b => b.type === 'chart' && b.data?.source?.tableId === id); }
function remapColumns(doc, table, fn) {
  const d = table.data;
  const letter=n=>{let v=n+1,r='';while(v>0){v--;r=String.fromCharCode(65+v%26)+r;v=Math.floor(v/26);}return r;};
  for(const cfg of d.columnConfigs||[]){if(cfg?.type==='formula'&&cfg.formula)cfg.formula=cfg.formula.split(/(#REF!)/g).map(part=>part==='#REF!'?part:part.replace(/\b[A-Za-z]{1,2}\b/g,ref=>{let index=0;for(const c of ref.toUpperCase())index=index*26+c.charCodeAt(0)-64;const mapped=fn(index-1);return !Number.isInteger(mapped)||mapped<0?'#REF!':letter(mapped);})).join('');}

  d.sumColumns = (d.sumColumns || []).map(fn).filter(x => Number.isInteger(x) && x >= 0);
  linked(doc, table.id).forEach(chart => {
    const source = chart.data.source;
    source.labelCol = fn(source.labelCol);
    if (!Number.isInteger(source.labelCol)) source.labelCol = -1;
    source.valueCols = (source.valueCols || []).map(fn).filter(x => Number.isInteger(x) && x >= 0);
  });
}
function padRows(d) { const n=d.headers.length;if(Array.isArray(d.columnConfigs))while(d.columnConfigs.length<n)d.columnConfigs.push({});d.rows.forEach(row=>{while(row.length<n)row.push('');});if(Array.isArray(d.footerRow))while(d.footerRow.length<n)d.footerRow.push('');}
function move(arr, from, to) { const v = arr.splice(from,1)[0]; arr.splice(to,0,v); }
export function addTableRow(table, index) {
  const d=table.data, at=Math.max(0,Math.min(d.rows.length, index));
  remapMergeInsert(d,'row',at);remapCellOpacity(table,x=>x>=at?x+1:x,identity);
  d.rows.splice(at,0,d.headers.map(()=>'')); return at;
}
export function deleteTableRow(table, index) {
  const d=table.data; if(index<0||index>=d.rows.length) return false;
  remapMergeDelete(d,'row',index);remapCellOpacity(table,x=>x===index?-1:x>index?x-1:x,identity);
  d.rows.splice(index,1); return true;
}
export function moveTableRow(table, from, to) {
  const rows=table.data.rows; if((table.data.merges||[]).length)return false;if(from<0||to<0||from>=rows.length||to>=rows.length||from===to) return false;
  const map=x=>x===from?to:from<to&&x>from&&x<=to?x-1:from>to&&x>=to&&x<from?x+1:x;remapCellOpacity(table,map,identity);
  move(rows,from,to); return true;
}
export function insertTableColumn(doc, table, index) {
  const d=table.data, at=Math.max(0,Math.min(d.headers.length,index));
  remapMergeInsert(d,'col',at);padRows(d); remapColumns(doc,table,x=>x>=at?x+1:x);remapCellOpacity(table,identity,x=>x>=at?x+1:x);
  if(Array.isArray(d.columnConfigs))d.columnConfigs.splice(at,0,{});
  d.headers.splice(at,0,''); d.rows.forEach(r=>r.splice(at,0,''));
  if(Array.isArray(d.footerRow))d.footerRow.splice(at,0,''); return at;
}
export function deleteTableColumn(doc, table, index) {
  const d=table.data; if(d.headers.length<=1||index<0||index>=d.headers.length)return false;
  remapMergeDelete(d,'col',index);padRows(d); remapColumns(doc,table,x=>x===index?-1:x>index?x-1:x);remapCellOpacity(table,identity,x=>x===index?-1:x>index?x-1:x);
  if(Array.isArray(d.columnConfigs))d.columnConfigs.splice(index,1);
  d.headers.splice(index,1);d.rows.forEach(r=>r.splice(index,1));
  if(Array.isArray(d.footerRow))d.footerRow.splice(index,1);return true;
}
export function moveTableColumn(doc, table, from, to) {
  const d=table.data,n=d.headers.length;if((d.merges||[]).length)return false;if(from<0||to<0||from>=n||to>=n||from===to)return false;
  const map=i=>i===from?to : from<to && i>from && i<=to ? i-1 : from>to && i>=to && i<from ? i+1 : i;
  padRows(d); remapColumns(doc,table,map);remapCellOpacity(table,identity,map);
  if(Array.isArray(d.columnConfigs))move(d.columnConfigs,from,to);
  move(d.headers,from,to);d.rows.forEach(r=>move(r,from,to));
  if(Array.isArray(d.footerRow))move(d.footerRow,from,to);return true;
}
