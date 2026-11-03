/* Same interface geometry in both modes; palettes change colors only. */
export const UI_PALETTES = [
  {id:'ocean',fa:'اقیانوس',en:'Ocean',accent:'#185a9d',dark:['#111d2a','#1c2b3a','#3c5266','#eff6fc','#b9cde0'],light:['#eaf2f8','#f8fbfe','#bfcedc','#192f40','#516b7f']},
  {id:'sage',fa:'مریم‌گلی',en:'Sage',accent:'#346e58',dark:['#15211e','#22322c','#40574c','#eef7f0','#b9d0c1'],light:['#eef3ed','#fafdf9','#c8d7cb','#23392e','#526b5a']},
  {id:'plum',fa:'آلویی',en:'Plum',accent:'#744991',dark:['#211b29','#30273b','#54445f','#f7f0fa','#d2bfd9'],light:['#f5f0f6','#fdfafd','#d9cbdc','#392b3d','#6e5c72']},
  {id:'sand',fa:'شنزار',en:'Sand',accent:'#815c27',dark:['#252118','#332d23','#584d3c','#faf5e8','#d6cbb5'],light:['#f5f1e9','#fffdf8','#ddd1bd','#403728','#75694f']},
  {id:'blue',fa:'آبی',en:'Blue',accent:'#315fbd',dark:['#171b22','#242a33','#394657','#eef2f8','#b7c5d8'],light:['#eef2f7','#f9fbfe','#c9d5e2','#1d2d40','#4d6076']},
  {id:'violet',fa:'بنفش',en:'Violet',accent:'#7248b9',dark:['#1d1927','#2a2639','#4c4260','#f2effa','#c8bed9'],light:['#f2eff8','#fcfaff','#d8cfe7','#302743','#645776']},
  {id:'teal',fa:'فیروزه‌ای',en:'Teal',accent:'#08746c',dark:['#142323','#203330','#3b5550','#e7f4f0','#afcfc4'],light:['#eaf4f1','#f8fdfb','#bfd8ce','#203d35','#496b60']},
  {id:'green',fa:'سبز',en:'Green',accent:'#38744b',dark:['#19241b','#273429','#405845','#edf6ed','#b9d0bd'],light:['#edf4ed','#fbfefa','#cbdcca','#243b29','#506a55']},
  {id:'rose',fa:'رز',en:'Rose',accent:'#a03961',dark:['#271b21','#35262e','#5b404c','#f8eef2','#d4bac6'],light:['#f9eef2','#fffbfc','#e8cbd5','#432a34','#765661']},
  {id:'amber',fa:'کهربایی',en:'Amber',accent:'#946016',dark:['#292116','#382d21','#5d4d38','#fff4df','#d7c4a9'],light:['#f8f2e7','#fffdf8','#e7d6bb','#433521','#75644a']},
  {id:'slate',fa:'خاکستری',en:'Slate',accent:'#526379',dark:['#1b1e22','#292d33','#454c55','#eff2f5','#c0cad3'],light:['#eff1f3','#fcfcfd','#d1d8df','#29343e','#586b79']},
  {id:'indigo',fa:'نیلی',en:'Indigo',accent:'#4c4bb2',dark:['#191b2a','#25283d','#434969','#f0f1ff','#bec5df'],light:['#eef0fa','#fafbff','#cbd3e9','#292e48','#59627e']}
];
function mixHex(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');}
function luminance(c){const a=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
export function uiColors(settings={}){
 const palette=UI_PALETTES.find(p=>p.id===settings.uiPalette)||UI_PALETTES.find(p=>p.id==='blue');
 const amount=settings.uiLightness==null?(['light','neu'].includes(settings.skin)?100:0):Math.max(0,Math.min(100,Number(settings.uiLightness)||0));const t=amount/100;
 const valid=v=>/^#[0-9a-f]{6}$/i.test(v||'');
 let bg=valid(settings.uiBackground)?settings.uiBackground:mixHex(palette.dark[0],palette.light[0],t);
 let panel=valid(settings.uiPanel)?settings.uiPanel:mixHex(palette.dark[1],palette.light[1],t);
 const border=mixHex(palette.dark[2],palette.light[2],t);
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const white=Math.min(contrast('#ffffff',panel),contrast('#ffffff',bg)),black=Math.min(contrast('#000000',panel),contrast('#000000',bg));const darkText=black>white,mode=darkText?'light':'flat';
 const text=darkText?'#000000':'#ffffff';
 function improve(surface,custom){if(custom)return surface;const target=darkText?'#ffffff':'#000000';let step=0;while(contrast(text,surface)<4.5&&step++<100)surface=mixHex(surface,target,.025);return surface;}
 bg=improve(bg,valid(settings.uiBackground));panel=improve(panel,valid(settings.uiPanel));
 const candidate=mixHex(text,panel,.12),muted=Math.min(contrast(candidate,panel),contrast(candidate,bg))>=4.5?candidate:text;
 return {mode,palette,bg,panel,border,text,muted,lightness:amount,accent:valid(settings.uiAccent)?settings.uiAccent:palette.accent};
}
