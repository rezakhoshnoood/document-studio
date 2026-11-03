/* Immutable design-only baseline: never snapshots text, media, data or music. */
const copy=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
export const DESIGN_GROUPS={
 colors:['bgColor','bgGradient','bgImage','bgType','textColor','border'],
 dimensions:['typography','cellTypography','logoFitWidthPx','blockWidth','minHeight','blockHeight','freeX','freeY','flowOffset','flowShiftY','borderRadius','padding','fontSize','fontFamily','textAlign','partAlignment','partInstances','cellAlign','stackOrder'],
 opacity:['opacity','textOpacity','graphicsOpacity','bgOpacity','partOpacity','cellOpacity'],
 animation:['animation','animationDuration','animationDelay','animationTrigger']
};
const settingGroups={colors:['webSurface','webStyle','webPalette','webThemeHero','bgEffectColor'],dimensions:['webWidth','webLayout','freeLayout'],opacity:['bgEffectOpacity'],animation:['bgEffect','bgReactMove','bgReactClick','bgInteractive','bgInteractiveMode','bgInteractiveOpacity']};
const allStyle=new Set(Object.values(DESIGN_GROUPS).flat());
function visualData(b){const d=b.data||{},v={};for(const key of ({logo:['width','align'],image:['maxWidth','align'],divider:['thickness'],chart:['height'], 'stat-grid':['columns']}[b.type]||[]))if(d[key]!==undefined)v[key]=copy(d[key]);if(b.type==='hero'||b.type==='divider'){v.iconSize=d.iconSize;v.iconAlign=d.iconAlign;}if(b.type==='stat-grid')v.statIconDesign=(d.stats||[]).map(x=>({iconSize:x.iconSize,iconAlign:x.iconAlign}));if(b.type==='timeline')v.timelineIconDesign=(d.items||[]).map(x=>({iconSize:x.iconSize,iconAlign:x.iconAlign}));if(b.type==='hero')v.bgGradient=d.bgGradient;if(b.type==='divider')v.color=d.color;if(b.type==='stat-grid')v.statColors=(d.stats||[]).map(x=>x.color);if(b.type==='chart')v.datasetColors=(d.datasets||[]).map(x=>x.color);return v;}
export function snapshotBlockDesign(block){const style={};for(const key of allStyle)if(block.style?.[key]!==undefined)style[key]=copy(block.style[key]);return {style,visual:visualData(block)};}
export function snapshotDesign(doc){const settings={};for(const key of Object.values(settingGroups).flat())if(doc.settings?.[key]!==undefined)settings[key]=copy(doc.settings[key]);return {version:1,theme:doc.theme,settings,blocks:Object.fromEntries((doc.blocks||[]).map(b=>[b.id,snapshotBlockDesign(b)]))};}
export function rememberBlockDesign(doc,block){if(doc.settings?.designBaseline)doc.settings.designBaseline.blocks[block.id]=snapshotBlockDesign(block);}
export function resetDesign(doc,groups,defaultSettings,makeDefaultBlock){
 const baseline=doc.settings?.designBaseline||null;
 for(const group of groups){
   if(group==='colors')doc.theme=baseline?.theme||'modern-blue';
   for(const k of settingGroups[group]||[]){if(baseline && Object.hasOwn(baseline.settings,k))doc.settings[k]=copy(baseline.settings[k]);else if(Object.hasOwn(defaultSettings,k))doc.settings[k]=copy(defaultSettings[k]);else delete doc.settings[k];}
   for(const b of doc.blocks||[]){let fallback;try{fallback=snapshotBlockDesign(makeDefaultBlock(b.type));}catch{fallback={style:{},visual:{}};}
     const entry=baseline?.blocks?.[b.id]||fallback;b.style ||= {};
     for(const key of DESIGN_GROUPS[group]||[]){if(Object.hasOwn(entry.style||{},key))b.style[key]=copy(entry.style[key]);else delete b.style[key];}
     if(group==='dimensions'){(b.data?.miniBlocks||[]).forEach(item=>delete item.typography);const v=entry.visual||fallback.visual||{};if(b.type==='hero'||b.type==='divider'){for(const key of ['iconSize','iconAlign'])if(v[key]!==undefined)b.data[key]=v[key];else delete b.data[key];}if(b.type==='stat-grid'||b.type==='timeline'){const items=b.type==='stat-grid'?b.data.stats:b.data.items,defaults=b.type==='stat-grid'?v.statIconDesign:v.timelineIconDesign;(items||[]).forEach((x,i)=>{for(const key of ['iconSize','iconAlign'])if(defaults?.[i]?.[key]!==undefined)x[key]=defaults[i][key];else delete x[key];});}for(const key of ({logo:['width','align'],image:['maxWidth','align'],divider:['thickness'],chart:['height'], 'stat-grid':['columns']}[b.type]||[]))if(v[key]!==undefined)b.data[key]=copy(v[key]);}
     if(group==='colors'){
       const v=entry.visual||fallback.visual||{};if(b.type==='hero' && v.bgGradient!==undefined)b.data.bgGradient=v.bgGradient;if(b.type==='divider' && v.color!==undefined)b.data.color=v.color;
       if(b.type==='stat-grid')(b.data.stats||[]).forEach((x,i)=>{const c=v.statColors?.[i]??fallback.visual?.statColors?.[i%(fallback.visual?.statColors?.length||1)];if(c!==undefined)x.color=c;});
       if(b.type==='chart')(b.data.datasets||[]).forEach((x,i)=>{const c=v.datasetColors?.[i]??fallback.visual?.datasetColors?.[i%(fallback.visual?.datasetColors?.length||1)];if(c!==undefined)x.color=c;});
     }
   }
 }
}
