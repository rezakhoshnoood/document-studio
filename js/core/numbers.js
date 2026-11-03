/* Parse Persian/Arabic and Western decimal numbers, preserving negative signs. */
export function numeric(value) {
  let s=String(value ?? '').trim().replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
  s=s.replace(/\u2212/g,'-').replace(/[٬,\s]/g,'').replace(/٫/g,'.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null;
  const n=Number(s);return Number.isFinite(n)?n:null;
}

export function tableFooter(d, lang='fa') {
  return (d.footerRow || []).map((cell,c)=> (d.sumColumns || []).includes(c) ? (d.rows || []).reduce((sum,row)=>sum+(numeric(row[c]) ?? 0),0).toLocaleString(lang === 'en' ? 'en-US' : 'fa-IR',{maximumFractionDigits:12}) : cell);
}

/* Convert typed/pasted text only; leave URL and email tokens untouched. */
export function persianDigits(value){
  return String(value ?? '').replace(/[^\s]+/g,word=>/(?:https?:\/\/|www\.|@)/i.test(word)?word:word.replace(/[0-9٠-٩]/g,c=>'۰۱۲۳۴۵۶۷۸۹'[c>='٠'?c.charCodeAt(0)-1632:Number(c)]));
}

/* Same-length conversion keeps DOM nodes, formatting and selection offsets intact. */
export function normalizeEditableDigits(node){
  const sel=window.getSelection(),anchor=sel?.anchorNode,focus=sel?.focusNode,ao=sel?.anchorOffset,fo=sel?.focusOffset;
  let changed=false;const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const text=walker.currentNode,next=persianDigits(text.nodeValue);if(next!==text.nodeValue){text.nodeValue=next;changed=true;}}
  if(changed)try{if(anchor&&focus&&node.contains(anchor)&&node.contains(focus))sel.setBaseAndExtent(anchor,ao,focus,fo);}catch{}
  return changed;
}
