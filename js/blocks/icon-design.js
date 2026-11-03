/* Per-icon layout is stored with the content item so it follows that item. */
export function applyIconDesign(el,obj,kind){
 const raw=Number(obj.iconSize);const n=Number.isFinite(raw)&&raw>0?Math.max(8,Math.min(160,raw)):0;
 if(n){el.style.fontSize=n+'px';if(kind==='timeline'){el.style.width=n+'px';el.style.height=n+'px';}const img=el.querySelector('img');if(img){img.style.width=n+'px';img.style.height=n+'px';img.style.maxWidth='100%';img.style.maxHeight='none';img.style.objectFit='contain';}}
 const a=obj.iconAlign;if(!['left','center','right'].includes(a))return;
 if(kind==='hero'||kind==='timeline'){
  el.style.insetInline='auto';el.style.left=a==='right'?'auto':a==='center'?'50%':kind==='hero'?'18px':'3px';el.style.right=a==='right'?(kind==='hero'?'18px':'3px'):'auto';el.style.transform=a==='center'?'translateX(-50%)':'';
 }else if(kind==='divider'){el.parentElement.style.textAlign=a;el.parentElement.style.justifyContent=a;}
 else el.style.textAlign=a;
}
export function iconDesignControls(api,obj,L,kind='stat'){
 const defaultSize=kind==='hero'?(obj.iconImage?46:40):kind==='timeline'?18:kind==='divider'?(obj.ornamentImage?38:22):(obj.iconImage?36:19);
 return [api.range(L('اندازه آیکون (px)','Icon size (px)'),obj.iconSize||defaultSize,v=>{obj.iconSize=v;api.rerender()},{min:8,max:160,unit:'px'}),api.seg(L('تراز آیکون','Icon alignment'),obj.iconAlign||'', [{value:'left',label:L('چپ','Left')},{value:'center',label:L('وسط','Center')},{value:'right',label:L('راست','Right')},{value:'',label:L('پیش‌فرض','Default')}],v=>{obj.iconAlign=v;api.rerender();api.commit();})];
}
