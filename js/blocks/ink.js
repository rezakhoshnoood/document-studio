/* Text-only opacity without fading block fills, figures or table cell backgrounds. */
export function applyTextInk(root, active) {
  if (!root) return;
  if (!active) {
    root.querySelectorAll('[data-ds-ink]').forEach(span=>span.replaceWith(...span.childNodes));
    return;
  }
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) {
    const node=walker.currentNode, parent=node.parentElement;
    if (!node.nodeValue.trim() || !parent || parent.closest('[data-ds-ink],svg,script,style,textarea,option,.b-tools,.doc-badge')) continue;
    nodes.push(node);
  }
  nodes.forEach(node=>{const span=document.createElement('span');span.dataset.dsInk='';node.replaceWith(span);span.appendChild(node);});
}
export function richHTMLWithoutInk(node) {
  const copy=node.cloneNode(true);
  copy.querySelectorAll('[data-ds-ink]').forEach(el=>el.replaceWith(...el.childNodes));
  copy.querySelectorAll('[data-ds-original-style]').forEach(el=>{const original=el.dataset.dsOriginalStyle;if(original==='__no_style__')el.removeAttribute('style');else el.setAttribute('style',original);el.removeAttribute('data-ds-original-style');el.removeAttribute('data-ds-part');el.removeAttribute('data-ds-part-instance');});
  copy.querySelectorAll('[data-reorder-key],[data-reorder-group]').forEach(el=>{el.removeAttribute('data-reorder-key');el.removeAttribute('data-reorder-group');});
  return copy.innerHTML;
}
