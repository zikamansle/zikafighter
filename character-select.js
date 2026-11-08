/* Sélection SNES Zika Fighter : 20 noms, 2 curseurs, thème fourni.
   Les portraits manquants n'ont pas de visage inventé. */
(()=>{'use strict';
const root=document.getElementById('select');if(!root||root.dataset.zfRosterLoaded)return;
root.dataset.zfRosterLoaded='1';
const fighters=[
['Pascal','#a7a7d5'],['Micka','#d4a052'],['Emma','#c96599'],['Julie','#49b5b4'],
['Antho','#d9b142'],['Fabrice','#c9a24f'],['Sandy','#a972c4'],
['Fabienne','#dc849e'],['Fabienne','#985577'],['Billy','#69abb7'],
['Ludo','#e4a067'],['Ju','#8d8bc6'],['Béné','#6e9cdb'],['Kév','#7fb371'],
['Loïc','#5fab7f'],['Laura','#e9ac8a'],['Val','#bfa3d8'],['Victor','#687fb4'],
['Élo','#d474ae'],['Djo','#9cacce'],['Zika','#e9b64d']
].map(([name,color],id)=>({name,color,id,slug:(id===7?'fabienne-1':id===8?'fabienne-2':name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))}));
// Les 20 personnages humains seulement. Zika est réservé à une future option bonus.
const bridge=()=>window.ZikaFighterBridge;
const oldStage=document.getElementById('stage'),oldStart=document.getElementById('start');
root.classList.add('zf-select-screen');
root.innerHTML=[
'<div class="zf-select-cabinet" role="group" aria-label="Sélection des vingt combattants">',
'',
'<canvas id="zf-select-type" width="320" height="240" aria-hidden="true"></canvas>',
'<div class="zf-select-heading"><h1>PLAYER SELECT</h1><small>START</small></div>',
'<button type="button" id="zf-select-start-control" aria-label="Confirmer le personnage sélectionné"></button>',
'<div class="zf-select-preview left" id="zf-select-preview-1"><span class="zf-select-initials"></span><strong></strong></div>',
'<div class="zf-select-player-label"><b>1P</b><strong id="zf-player-1-name">PASCAL</strong></div>',
'<div class="zf-select-player-label right-player" id="zf-select-player-2-label" hidden><b>2P</b><strong id="zf-player-2-name">MICKA</strong></div>',
'<div class="zf-select-preview right" id="zf-select-preview-2" hidden><span class="zf-select-initials"></span><strong></strong></div>',
'<div class="zf-select-roster-wrap"><div class="zf-select-roster" id="zf-select-roster"></div></div>',
'<div class="zf-select-help" id="zf-select-help">FLÈCHES : CHOISIR · START : CONFIRMER</div>',
'</div><div class="zf-select-controls" id="zf-select-controls"><label for="stage">ARÈNE</label></div>'
].join('');

const roster=root.querySelector('#zf-select-roster'),toolbar=root.querySelector('#zf-select-controls');
if(oldStage)toolbar.appendChild(oldStage);
let opened=false,activePlayer=0;
const chosen=[0,1],pointerCursor=[0,1];
let music=null;
// Validation du personnage : clip SFII_0~3.WAV fourni, allégé en MP3.
// Le même bruitage est joué pour la sélection du joueur 1 ou du joueur 2.
// Deux lecteurs persistants préchargés. Contrairement à cloneNode(), le
// navigateur ne perd pas le son lorsque l'écran change pendant la lecture.
const confirmSoundFile='./assets/audio/SFII-character-confirm.mp3';
// Le MP3 fourni par l'utilisateur emprunte le même bus audio normalisé que
// les déplacements, les sons du menu et les coups du combat.
const confirmationFallback=new Audio(confirmSoundFile);
confirmationFallback.preload='auto';
window.ZikaArcadeAudio?.preloadClip?.(confirmSoundFile);
function playCharacterConfirmSound(){
 const audio=window.ZikaArcadeAudio;
 const useMenuConfirmation=()=>{
   if(window.ZikaFighterMenuSfx?.confirm)window.ZikaFighterMenuSfx.confirm();
   else window.ZikaArcadeAudio?.playEffect?.('confirm');
 };
 if(audio?.playClip){
   audio.playClip(confirmSoundFile,useMenuConfirmation);
   return;
 }
 // Repli pour environnement sans Web Audio (le MP3 d'origine reste intact).
 try{
   confirmationFallback.pause();
   confirmationFallback.currentTime=0;
   const raw=Number(window.ZikaFighterSettings?.fxVolume??8);
   confirmationFallback.volume=Math.max(0,Math.min(1,raw/10));
   const result=confirmationFallback.play();
   if(result?.catch)result.catch(useMenuConfirmation);
 }catch(_){useMenuConfirmation();}
}
function getMusic(){
 if(!music){music=new Audio('./assets/audio/Player Select EXTENDED Street Fighter 2 SNES.mp3');music.loop=true;music.preload='auto';}
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
// 20 portraits SNES visibles : Zika sera ajouté ultérieurement comme bonus.
// Portraits 20 humains recréés en style pixel SNES ; Zika n'est pas sélectionnable.
// PORTRAITS FACIAUX uniquement, extraits du cadre visage sur les fiches fournies.
// Ne jamais remettre les fiches complètes dans la grille.
// EXACTEMENT les portraits sans texte de la maquette 7-7-6 validée.
// La seule exception est Zika, masqué jusqu'au déblocage du bonus.
const portraitSources=window.ZikaFighterFinalThumbnails||{};
const largePortraitSources=window.ZikaFighterFinalHeroes||{};
const zikaUnlocked=()=>window.ZikaFighterStages?.isZikaUnlocked?.()===true;
const visibleCount=()=>zikaUnlocked()?21:20;
const normalizedThumbnails=Array(fighters.length).fill(null);
const photos=fighters.map((f,index)=>{
 const im=new Image();
 im.decoding='async';
 im.onload=()=>{
   normalizedThumbnails[index]=window.ZikaFighterThumbNormalize?.fromImage?.(f.slug,im)||null;
   if(opened)render();
 };
 im.onerror=()=>{
   // Une éventuelle photo locale prend le relais si la médiathèque n'est pas joignable.
   const fallback='./assets/fighters/'+f.slug+'.png';
   if(im.src!==new URL(fallback,location.href).href)im.src=fallback;
   else if(opened)render();
 };
 const known=portraitSources[f.slug]||bridge()?.portraitFor?.(f.slug);
 im.src=known||'./assets/fighters/'+f.slug+'.png';
 return im;
});
// 20 portraits SNES visibles : Zika sera ajouté ultérieurement comme bonus.
window.ZikaFighterPortraits=Object.freeze({...portraitSources});
window.ZikaFighterLargePortraits=Object.freeze({...largePortraitSources});
function portrait(i){return photos[i]?.complete&&photos[i]?.naturalWidth>0?photos[i].src:null;}
function thumbnail(i){return normalizedThumbnails[i]||portrait(i);}
function initials(name){return name.split(' ').filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}
fighters.forEach((f,i)=>{
 const cell=document.createElement('button');cell.type='button';cell.className='zf-fighter-slot';
 cell.dataset.index=String(i);cell.style.setProperty('--fighter-color',f.color);cell.setAttribute('aria-label',f.name);
 cell.innerHTML='<span class="photo"><span class="initial"></span></span><span class="name"></span>';
 cell.querySelector('.initial').textContent=initials(f.name);
 cell.querySelector('.name').textContent=f.name.toUpperCase();
 cell.addEventListener('click',()=>{if(!opened||window.ZikaFighterScreens?.busy)return;if(pointerCursor[activePlayer]===i)confirm();else choose(i);});
 roster.appendChild(cell);
});
function showPortrait(side,index){
 const panel=root.querySelector('#zf-select-preview-'+side),f=fighters[index],src=portrait(index);
 panel.classList.toggle('has-photo',!!src);
 panel.classList.toggle('zf-bonus-portrait',f.slug==='zika');
 panel.querySelector('strong').textContent=f.name.toUpperCase();
 panel.querySelector('.zf-select-initials').textContent=initials(f.name);
 const previous=panel.querySelector('img');
 if(src){
  const desired=largePortraitSources[f.slug]||src;
  // Conserver le nœud déjà chargé : pas de clignotement à chaque touche.
  if(!previous||previous.src!==desired){
   const im=new Image();im.src=desired;im.alt=f.name;
   if(previous)previous.replaceWith(im);else panel.prepend(im);
  }
 }else if(previous)previous.remove();
}
// Tous les textes sont composés avec l'atlas SNES extrait,
 // jamais avec une fonte HTML ou des pixels génériques 7x9.
let blinkFrame=true;
function drawArcadeSelectionText(){
 const canvas=root.querySelector('#zf-select-type');
 const font=window.ZikaSNESText;if(!canvas||!font?.ready)return;
 const ctx=canvas.getContext('2d');
 ctx.setTransform(1,0,0,1,0,0);
 ctx.clearRect(0,0,320,240);
 ctx.imageSmoothingEnabled=false;
 // Équivalent géométrique d'une image native 320×240 pour le 4:3.
 font.draw(ctx,'PLAYER SELECT',161,8,{align:'center',scale:.55,maxWidth:164});
 font.draw(ctx,'START',282,1,{align:'center',scale:.54,maxWidth:59});
 // Le nom se trouve juste AU-DESSUS du grand portrait.
 // Le seul 1P visible est celui attaché à la vignette active.
 font.draw(ctx,fighters[chosen[0]].name,35,27,
   {align:'center',scale:.72,maxWidth:67,face:'game',tone:'cream'});
 if(count()===2){
   font.draw(ctx,fighters[chosen[1]].name,285,27,
     {align:'center',scale:.72,maxWidth:67,face:'game',tone:'cream'});
 }
 // Curseurs 1P/2P en pixels — pas de filtre sur la photographie.
 const rect=root.querySelector('.zf-select-cabinet')?.getBoundingClientRect();
 if(!opened||!rect?.width)return;
 function marker(index,text,tone){
  const cell=roster.children[index];if(!cell||cell.hidden)return;
  const b=cell.getBoundingClientRect();
  const x=Math.round((b.left-rect.left)*320/rect.width);
  const y=Math.round((b.top-rect.top)*240/rect.height);
  // Les portraits restent immobiles, seul le repère/contour clignote.
  if(blinkFrame)font.draw(ctx,text,x+1,Math.max(24,y-8),{tone,scale:.22,maxWidth:13,face:'game'});
 }
 marker(pointerCursor[0],'1P','cyan');
 if(count()===2)marker(pointerCursor[1],'2P','red');
}
window.ZikaSNESText?.whenReady(drawArcadeSelectionText);
setInterval(()=>{
 if(!opened||window.ZikaFighterScreens?.busy)return;
 blinkFrame=!blinkFrame;drawArcadeSelectionText();
},240);

function render(){
 if(!opened)return;
 for(const cell of roster.children){
  const i=Number(cell.dataset.index),src=portrait(i),picture=cell.querySelector('.photo');
  cell.hidden=i>=visibleCount();
  cell.classList.toggle('zf-bonus-portrait',i===20);
  cell.classList.toggle('p1',i===chosen[0]);
  cell.classList.toggle('p2',count()===2&&i===chosen[1]);
  cell.classList.toggle('focused',i===pointerCursor[activePlayer]);
  cell.classList.toggle('has-photo',!!src);
  const current=picture.querySelector('img'),thumb=thumbnail(i);
  if(src&&!current){const im=new Image();im.alt='';im.src=thumb;picture.prepend(im);}
  else if(src&&current&&current.src!==thumb)current.src=thumb;
  if(!src&&current)current.remove();
 }
 showPortrait(1,chosen[0]);
 showPortrait(2,count()===2?chosen[1]:(chosen[0]+1)%fighters.length);
 const p1Name=root.querySelector('#zf-player-1-name');
 p1Name.textContent=fighters[chosen[0]].name.toUpperCase();
 p1Name.dataset.long=String(fighters[chosen[0]].name.length>7);
 const p2Label=root.querySelector('#zf-select-player-2-label');
 p2Label.hidden=count()!==2;
 // Le portrait droit reste réservé au joueur 2 en mode deux joueurs.
 root.querySelector('#zf-select-preview-2').hidden=count()!==2;
 if(count()===2){const p2Name=root.querySelector('#zf-player-2-name');p2Name.textContent=fighters[chosen[1]].name.toUpperCase();p2Name.dataset.long=String(fighters[chosen[1]].name.length>7);}
 drawArcadeSelectionText();
 root.querySelector('#zf-select-help').textContent=count()===2
  ?(activePlayer===0?'1P : CHOISIR · START CONFIRMER':'2P : CHOISIR · START CONFIRMER')
  :'FLÈCHES : CHOISIR · START : CONFIRMER';
}
function playCursorMoveSound(){
 // Réutiliser LE bruitage de déplacement déjà fourni pour les menus,
 // quel que soit le joueur (1P ou 2P), la souris, le clavier ou la manette.
 if(window.ZikaFighterMenuSfx?.move)window.ZikaFighterMenuSfx.move();
 else window.ZikaArcadeAudio?.playEffect?.('move');
}
function choose(index,player=activePlayer){
 if(!opened||window.ZikaFighterScreens?.busy)return;
 const n=visibleCount();
 const i=((index%n)+n)%n;
 // Un clic sur la même case confirme le personnage; il ne déplace pas le curseur.
 if(i===pointerCursor[player])return;
 chosen[player]=i;pointerCursor[player]=i;
 if(player===0)bridge()?.setFighter?.(fighters[i].slug);
 else bridge()?.setOpponent?.(fighters[i].slug);
 playCursorMoveSound();
 render();
}
function move(dx,dy){
 const current=pointerCursor[activePlayer];
 const row=current<7?0:current<14?1:2;
 const x=current-(row===0?0:row===1?7:14);
 const nextRow=(row+dy+3)%3;
 const sizes=zikaUnlocked()?[7,7,7]:[7,7,6];
 const nextX=Math.min(sizes[nextRow]-1,(x+dx+7)%7);
 const next=(nextRow===0?0:nextRow===1?7:14)+nextX;
 choose(next);
}
function enter(){
 // À chaque retour depuis un combat, réafficher la sélection des portraits.
 window.ZikaFighterStageSelect?.close?.();
 const cabinet=root.querySelector('.zf-select-cabinet');if(cabinet)cabinet.hidden=false;
 opened=true;activePlayer=0;chosen[0]=0;chosen[1]=1;pointerCursor[0]=0;pointerCursor[1]=1;
 bridge()?.setFighter?.(fighters[0].slug);bridge()?.setOpponent?.(fighters[1].slug);
 document.body.classList.add('zf-in-selection');root.hidden=false;
 render();startMusic();roster.children[0]?.focus({preventScroll:true});
}
function finish(){
 if(!opened||window.ZikaFighterScreens?.busy)return;
 const transition=()=>{
  opened=false; // Conserver la musique pendant la transition et le choix de l'arène.
  const player1=fighters[chosen[0]].slug;
  const player2=fighters[count()===2?chosen[1]:(chosen[0]+1)%visibleCount()].slug;
  bridge()?.setFighter?.(player1);
  bridge()?.setOpponent?.(player2);
  // Après la sélection des combattants, ouvrir obligatoirement les arènes.
  // Ne lancer le combat qu'après confirmation du décor ET annonce vocale.
  if(window.ZikaFighterStageSelect?.open){
   if(window.ZikaFighterStageSelect.open({player1,player2,twoPlayers:count()===2}))return;
  }
  document.body.classList.remove('zf-in-selection');
  bridge()?.start?.();
 };
 // Comme sur SFII Turbo SNES : affichage immédiat du choix des arènes.
 // Aucun rideau noir ni fondu à cette étape ; la musique continue.
 transition();
}
function confirm(){
 if(!opened||window.ZikaFighterScreens?.busy)return;
 playCharacterConfirmSound();
 if(count()===2&&activePlayer===0){activePlayer=1;render();}
 else finish();
}
root.querySelector('#zf-select-start-control').addEventListener('click',()=>{if(opened)confirm();});
if(oldStart){oldStart.textContent='GAME START';toolbar.appendChild(oldStart);
 oldStart.addEventListener('click',event=>{if(!opened)return;event.preventDefault();event.stopImmediatePropagation();confirm();},true);
}
let lastRepeatedMove=0;
document.addEventListener('keydown',event=>{
 if(!opened||window.ZikaFighterScreens?.busy)return;
 const code=event.code;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Enter','Space','NumpadEnter'].includes(code))return;
 event.preventDefault();event.stopImmediatePropagation();
 const isMove=!['Enter','Space','NumpadEnter'].includes(code);
 // Une touche maintenue avance régulièrement, avec un son pour chaque case
 // plutôt qu'un seul déplacement suivi d'un silence.
 if(event.repeat){
  if(!isMove)return; // Ne jamais confirmer deux fois sur une touche maintenue.
  const now=performance.now();
  if(now-lastRepeatedMove<90)return;
  lastRepeatedMove=now;
 }
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
 open:enter,playMusic:startMusic,stopMusic,playConfirmSound:playCharacterConfirmSound,
 prewarm:()=>{
   window.ZikaArcadeAudio?.preloadClip?.(confirmSoundFile);
   confirmationFallback.load();
   const m=getMusic();m.volume=0;if(m.paused)void m.play().catch(()=>{});
 },
 getFighters:()=>fighters.map(f=>({...f})),
 getState:()=>({opened,activePlayer,chosen:[...chosen]})
};
})();