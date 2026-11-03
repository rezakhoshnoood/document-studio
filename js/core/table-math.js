/* Safe arithmetic parser, no eval, with same-row spreadsheet letters A..ZZ. */
import {numeric} from './numbers.js';
export function evaluateFormula(expression, getValue){
 const src=String(expression||'').replace(/^\s*=/,'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
 if(src.length>200)throw Error('length');const tokens=src.match(/(?:\d+(?:\.\d*)?|\.\d+)|[A-Za-z]{1,2}|[()+\-*/]/g)||[];
 if(tokens.join('').toLowerCase()!==src.replace(/\s+/g,'').toLowerCase())throw Error('token');let i=0;
 function atom(){const t=tokens[i++];if(t==='('){let n=add();if(tokens[i++]!==')')throw Error('parenthesis');return n;}if(t==='-')return -atom();if(t==='+')return atom();if(/^[A-Za-z]{1,2}$/.test(t||'')){let n=0;for(const ch of t.toUpperCase())n=n*26+ch.charCodeAt(0)-64;const value=getValue(n-1);if(value==null||!Number.isFinite(value))throw Error('reference');return value;}if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t||''))throw Error('number');return Number(t);}
 function mul(){let n=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],r=atom();if(op==='/'&&r===0)throw Error('zero');n=op==='*'?n*r:n/r;}return n;}
 function add(){let n=mul();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=mul();n=op==='+'?n+r:n-r;}return n;}
 const result=add();if(i!==tokens.length||!Number.isFinite(result)||Math.abs(result)>1e15)throw Error('result');return result;
}
export function tableValue(data,row,c,seen=new Set()){
 const config=data.columnConfigs?.[c]||{};if(config.type!=='formula')return numeric(row?.[c]);if(seen.has(c))return null;
 seen.add(c);try{return evaluateFormula(config.formula||'',i=>i<(data.headers||[]).length?tableValue(data,row,i,new Set(seen)):null);}catch{return null;}
}
export function displayTableCell(data,row,c,lang='fa'){
 const config=data.columnConfigs?.[c]||{};if(config.type!=='formula')return String(row?.[c]??'');const n=tableValue(data,row,c);return n===null?(lang==='en'?'Error':'خطا'):n.toLocaleString(lang==='en'?'en-US':'fa-IR',{maximumFractionDigits:2});
}
export function smartFooter(data,lang='fa'){
 return (data.headers||[]).map((_,c)=>{const config=data.columnConfigs?.[c]||{},op=config.aggregate||((data.sumColumns||[]).includes(c)?'sum':'none');if(op==='none')return data.footerRow?.[c]??'';const rows=data.rows||[],results=rows.map(row=>tableValue(data,row,c));if((config.type==='formula'&&results.some(x=>x===null))||(['number','currency','percent'].includes(config.type)&&results.some((x,i)=>x===null&&String(rows[i]?.[c]??'').trim()!=='')))return lang==='en'?'Error':'خطا';const values=results.filter(x=>x!==null);if(!values.length)return '—';let n=op==='avg'?values.reduce((a,b)=>a+b,0)/values.length:op==='min'?Math.min(...values):op==='max'?Math.max(...values):values.reduce((a,b)=>a+b,0);return n.toLocaleString(lang==='en'?'en-US':'fa-IR',{maximumFractionDigits:2});});
}
