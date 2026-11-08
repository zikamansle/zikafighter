/* Sélection SNES Zika Fighter : 20 noms, 2 curseurs, thème fourni.
   Les portraits manquants n'ont pas de visage inventé. */
(()=>{'use strict';
const root=document.getElementById('select');if(!root||root.dataset.zfRosterLoaded)return;
root.dataset.zfRosterLoaded='1';
const fighters=[
['Pascal','#a7a7d5'],['Micka','#d4a052'],['Emma','#c96599'],['Julie','#49b5b4'],
['Antho','#d9b142'],['Fabrice','#c9a24f'],['Sandy','#a972c4'],
['Fabienne 1','#dc849e'],['Fabienne 2','#985577'],['Billy','#69abb7'],
['Ludo','#e4a067'],['Ju','#8d8bc6'],['Béné','#6e9cdb'],['Kév','#7fb371'],
['Loïc','#5fab7f'],['Laura','#e9ac8a'],['Val','#bfa3d8'],['Victor','#687fb4'],
['Élo','#d474ae'],['Djo','#9cacce']
].map(([name,color],id)=>({name,color,id,slug:name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}));
const bridge=()=>window.ZikaFighterBridge;
const oldStage=document.getElementById('stage'),oldStart=document.getElementById('start');
root.classList.add('zf-select-screen');
root.innerHTML=[
'<div class="zf-select-cabinet" role="group" aria-label="Sélection des vingt combattants">',
'<div class="zf-select-heading"><h1>PLAYER SELECT</h1><small id="zf-select-mode">GAME START</small></div>',
'<div class="zf-select-upper">',
'<div class="zf-select-preview left" id="zf-select-preview-1"><span class="zf-select-initials"></span><strong></strong></div>',
'<div class="zf-world" aria-label="Carte du monde stylisée">',
'<svg viewBox="0 0 400 245" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
'<path class="land" d="M25 37L65 20 86 28 99 13 133 21 146 49 128 66 118 91 98 93 93 119 72 112 60 94 38 90 28 67Z M107 130L139 125 160 146 154 181 134 215 116 222 103 197 106 167 95 148Z M188 30L231 18 269 26 298 17 329 29 364 20 380 42 367 61 339 59 328 83 303 95 285 109 264 96 245 75 222 70 208 55Z M216 106L251 109 270 136 267 162 249 198 230 207 215 179 207 151 195 133Z M310 168L342 157 370 166 374 186 360 198 334 191 317 201Z"/>',
'<path d="M0 81H400 M0 162H400 M100 0V245 M200 0V245 M300 0V245" fill="none" stroke="#bde3f4" opacity=".25"/>',
'<circle cx="204" cy="64" r="5" fill="#ffe776" stroke="#fff" stroke-width="2"/>',
'</svg><label>MANSLE-LES-FONTAINES</label></div>',
'<div class="zf-select-preview right" id="zf-select-preview-2"><span class="zf-select-initials"></span><strong></strong></div>',
'</div><div class="zf-select-roster-wrap"><div class="zf-select-roster" id="zf-select-roster"></div></div>',
'<div class="zf-select-help" id="zf-select-help">FLÈCHES : CHOISIR · START : CONFIRMER</div></div>',
'<div class="zf-select-controls" id="zf-select-controls"><label for="stage">ARÈNE</label></div>'
].join('');
const roster=root.querySelector('#zf-select-roster'),toolbar=root.querySelector('#zf-select-controls');
if(oldStage)toolbar.appendChild(oldStage);
let opened=false,activePlayer=0;
const chosen=[0,1],pointerCursor=[0,1];
let music=null;
function getMusic(){
 if(!music){music=new Audio('./assets/audio/3-character-select.mp3');music.loop=true;music.preload='auto';}
 return music;
}
function changeVolume(){
 if(!music)return;
 const v=Number(window.ZikaFighterSettings?.musicVolume??7);
 music.volume=Math.max(0,Math.min(1,v/10))*.85;
}
function startMusic(){
 window.ZikaArcadeAudio?.stop?.();
 const player=getMusic();changeVolume();
 if(player.paused)void player.play().catch(err=>console.warn('Zika Fighter : musique de sélection',err));
}
function stopMusic(){if(music){music.pause();music.currentTime=0;}}
function count(){return Number(window.ZikaFighterSettings?.players??bridge()?.getPlayers?.()??1)===2?2:1;}
const photos=fighters.map(f=>{
 const im=new Image();
 im.decoding='async';
 im.onload=()=>{if(opened)render();};
 im.onerror=()=>{if(opened)render();};
 const known=bridge()?.portraitFor?.(f.slug);
 im.src=known||'./assets/fighters/'+f.slug+'.png';
 return im;
});
function portrait(i){return photos[i]?.complete&&photos[i]?.naturalWidth>0?photos[i].src:null;}
function initials(name){return name.split(' ').filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}
fighters.forEach((f,i)=>{
 const cell=document.createElement('button');cell.type='button';cell.className='zf-fighter-slot';
 cell.dataset.index=String(i);cell.style.setProperty('--fighter-color',f.color);cell.setAttribute('aria-label',f.name);
 cell.innerHTML='<span class="photo"><span class="initial"></span></span><span class="name"></span>';
 cell.querySelector('.initial').textContent=initials(f.name);
 cell.querySelector('.name').textContent=f.name.toUpperCase();
 cell.addEventListener('click',()=>{if(opened&&!window.ZikaFighterScreens?.busy)choose(i);});
 roster.appendChild(cell);
});
function showPortrait(side,index){
 const panel=root.querySelector('#zf-select-preview-'+side),f=fighters[index],src=portrait(index);
 panel.classList.toggle('has-photo',!!src);
 panel.querySelector('strong').textContent=f.name.toUpperCase();
 panel.querySelector('.zf-select-initials').textContent=initials(f.name);
 const previous=panel.querySelector('img');if(previous)previous.remove();
 if(src){const im=new Image();im.src=src;im.alt=f.name;panel.prepend(im);}
}
function render(){
 if(!opened)return;
 for(const cell of roster.children){
  const i=Number(cell.dataset.index),src=portrait(i),picture=cell.querySelector('.photo');
  cell.classList.toggle('p1',i===chosen[0]);
  cell.classList.toggle('p2',count()===2&&i===chosen[1]);
  cell.classList.toggle('focused',i===pointerCursor[activePlayer]);
  cell.classList.toggle('has-photo',!!src);
  const current=picture.querySelector('img');
  if(src&&!current){const im=new Image();im.alt='';im.src=src;picture.prepend(im);}
  if(!src&&current)current.remove();
 }
 showPortrait(1,chosen[0]);showPortrait(2,count()===2?chosen[1]:(chosen[0]+1)%fighters.length);
 root.querySelector('#zf-select-mode').textContent=count()===2?'V.S. BATTLE':'GAME START';
 root.querySelector('#zf-select-help').textContent=count()===2
  ?(activePlayer===0?'1P : CHOISIR · START CONFIRMER':'2P : CHOISIR · START CONFIRMER')
  :'FLÈCHES : CHOISIR · START : CONFIRMER';
}
function choose(index,player=activePlayer){
 if(!opened||window.ZikaFighterScreens?.busy)return;
 const i=(index+fighters.length)%fighters.length;
 chosen[player]=i;pointerCursor[player]=i;
 if(player===0)bridge()?.setFighter?.(fighters[i].slug);
 else bridge()?.setOpponent?.(fighters[i].slug);
 window.ZikaArcadeAudio?.playEffect?.('move');render();
}
function move(dx,dy){const i=pointerCursor[activePlayer],x=i%10,y=Math.floor(i/10);
 choose(((y+dy+2)%2)*10+(x+dx+10)%10);
}
function enter(){
 opened=true;activePlayer=0;chosen[0]=0;chosen[1]=1;pointerCursor[0]=0;pointerCursor[1]=1;
 bridge()?.setFighter?.(fighters[0].slug);bridge()?.setOpponent?.(fighters[1].slug);
 document.body.classList.add('zf-in-selection');root.hidden=false;
 render();startMusic();roster.children[0]?.focus({preventScroll:true});
}
function finish(){
 if(!opened||window.ZikaFighterScreens?.busy)return;
 const transition=()=>{
  opened=false;stopMusic();document.body.classList.remove('zf-in-selection');
  bridge()?.setFighter?.(fighters[chosen[0]].slug);
  bridge()?.setOpponent?.(fighters[count()===2?chosen[1]:(chosen[0]+1)%fighters.length].slug);
  bridge()?.start?.();
 };
 if(window.ZikaFighterScreens)window.ZikaFighterScreens.change(transition,{out:185,hold:45,in:185});
 else transition();
}
function confirm(){
 if(!opened||window.ZikaFighterScreens?.busy)return;
 window.ZikaArcadeAudio?.playEffect?.('confirm');
 if(count()===2&&activePlayer===0){activePlayer=1;render();}
 else finish();
}
if(oldStart){oldStart.textContent='GAME START';toolbar.appendChild(oldStart);
 oldStart.addEventListener('click',event=>{if(!opened)return;event.preventDefault();event.stopImmediatePropagation();confirm();},true);
}
document.addEventListener('keydown',event=>{
 if(!opened||window.ZikaFighterScreens?.busy||event.repeat)return;
 const code=event.code;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Enter','Space','NumpadEnter'].includes(code))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(code==='ArrowLeft'||code==='KeyA')move(-1,0);
 else if(code==='ArrowRight'||code==='KeyD')move(1,0);
 else if(code==='ArrowUp'||code==='KeyW')move(0,-1);
 else if(code==='ArrowDown'||code==='KeyS')move(0,1);
 else confirm();
},true);
let lastPadDirection=0,padConfirmHeld=false;
function pollPad(now){
 if(opened&&!window.ZikaFighterScreens?.busy){
  let pad=null;
  try{const pads=navigator.getGamepads?.();pad=pads?.[activePlayer]||pads?.[0];}catch(_){}
  if(pad){
   const pressed=i=>Boolean(pad.buttons?.[i]?.pressed);
   const ax=pad.axes?.[0]||0,ay=pad.axes?.[1]||0;
   const dx=pressed(14)||ax<-.6?-1:pressed(15)||ax>.6?1:0;
   const dy=pressed(12)||ay<-.6?-1:pressed(13)||ay>.6?1:0;
   if((dx||dy)&&now-lastPadDirection>170){lastPadDirection=now;move(dx,dy);}
   const down=pressed(9)||pressed(0);
   if(down&&!padConfirmHeld)confirm();
   padConfirmHeld=down;
  }else padConfirmHeld=false;
 }else padConfirmHeld=false;
 requestAnimationFrame(pollPad);
}
requestAnimationFrame(pollPad);
window.addEventListener('zika:settings-changed',changeVolume);
window.ZikaFighterCharacterSelect={
 open:enter,playMusic:startMusic,stopMusic,
 prewarm:()=>{const m=getMusic();m.volume=0;if(m.paused)void m.play().catch(()=>{});},
 getFighters:()=>fighters.map(f=>({...f})),
 getState:()=>({opened,activePlayer,chosen:[...chosen]})
};
})();