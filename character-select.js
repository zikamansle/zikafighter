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
// Les 20 personnages humains seulement. Zika est réservé à une future option bonus.
const bridge=()=>window.ZikaFighterBridge;
const oldStage=document.getElementById('stage'),oldStart=document.getElementById('start');
root.classList.add('zf-select-screen');
root.innerHTML=[
'<div class="zf-select-cabinet" role="group" aria-label="Sélection des vingt combattants">',
'<canvas id="zf-select-reference" width="320" height="240" aria-hidden="true"></canvas>',
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

  // Carte, typographie PLAYER SELECT et START repris de la capture fournie.
  // L'intégralité des anciens portraits du jeu d'origine reste hors du recadrage.
  const reference=new Image();
  reference.crossOrigin='anonymous';
  reference.decoding='async';
  reference.addEventListener('load',()=>{
    const canvas=root.querySelector('#zf-select-reference');
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#040062';ctx.fillRect(0,0,320,240);
    // Le CDN peut redimensionner la référence : recadrer en coordonnées relatives.
    const scaleX=reference.naturalWidth/1582;
    const scaleY=reference.naturalHeight/893;
    ctx.drawImage(reference,140*scaleX,0,1230*scaleX,490*scaleY,0,0,320,136);
    // La capture contient un véritable « 1P » bleu à conserver.
    // Seul le nom KEN est incrusté dans le décor : le nettoyer
    // sur les lignes 120–135 (coordonnées du canevas 320×240).
    // Le vieux nettoyage y=94..135 effaçait aussi le 1P original.
    try{
      for(let y=120;y<136;y++){
        const background=ctx.getImageData(12,y,1,1).data;
        ctx.fillStyle='rgb('+background[0]+','+background[1]+','+background[2]+')';
        ctx.fillRect(22,y,76,1);
      }
    }catch(_){
      ctx.fillStyle='#050062';ctx.fillRect(22,120,76,16);
    }
    root.querySelector('.zf-select-cabinet').classList.add('reference-ready');
    // Le 1P bleu de la capture est maintenant visible : ne pas le redessiner.
    drawArcadeSelectionText();
  });
  reference.src='https://static.wixstatic.com/media/685632_0fee1909f2e04b08aa3ede8c582e66f9~mv2.png';

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
const confirmVoices=[new Audio(confirmSoundFile),new Audio(confirmSoundFile)];
let confirmVoiceIndex=0;
let activeConfirmationDucks=0;
for(const sound of confirmVoices){
 sound.preload='auto';
 sound.loop=false;
}
function playCharacterConfirmSound(){
 const raw=Number(window.ZikaFighterSettings?.fxVolume??8);
 const fx=Number.isFinite(raw)?Math.max(0,Math.min(10,raw)):8;
 const sound=confirmVoices[confirmVoiceIndex++%confirmVoices.length];
 let handledFailure=false;
 let restored=false;
 let ducked=false;
 const restoreMusic=()=>{
  if(restored)return;
  restored=true;
  sound.removeEventListener('ended',restoreMusic);
  sound.removeEventListener('error',onError);
  if(ducked){
   activeConfirmationDucks=Math.max(0,activeConfirmationDucks-1);
   if(activeConfirmationDucks===0)changeVolume();
  }
 };
 const onError=(err)=>{
  if(handledFailure)return;
  handledFailure=true;
  console.warn('Zika Fighter : confirmation sonore indisponible, bruitage de secours',err);
  restoreMusic();
  if(fx>0){
   if(window.ZikaFighterMenuSfx?.confirm)window.ZikaFighterMenuSfx.confirm();
   else window.ZikaArcadeAudio?.playEffect?.('confirm');
  }
 };
 try{
  sound.pause();
  sound.currentTime=0;
  sound.muted=false;
  sound.volume=fx/10;
  sound.addEventListener('ended',restoreMusic,{once:true});
  sound.addEventListener('error',onError,{once:true});
  if(music&&!music.paused&&fx>0){
   ducked=true;
   if(activeConfirmationDucks===0)music.volume*=.16;
   activeConfirmationDucks++;
  }
  // L'élément audio reste référencé pendant la transition et le combat.
  const result=sound.play();
  if(result&&typeof result.catch==='function')result.catch(onError);
  // Précaution : aucune panne réseau ne doit laisser la musique réduite.
  setTimeout(restoreMusic,2500);
 }catch(err){onError(err);}
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
const portraitSources={
  "pascal": "https://static.wixstatic.com/media/685632_538d4c78182f48eab9e4acbd0a107386~mv2.png",
  "micka": "https://static.wixstatic.com/media/685632_d74893355591477e96cc39c13ab10c77~mv2.png",
  "emma": "https://static.wixstatic.com/media/685632_473654c3d0714511a482903c5ee1efce~mv2.png",
  "julie": "https://static.wixstatic.com/media/685632_510eac7d2edf47c2b035f45c381ca484~mv2.png",
  "antho": "https://static.wixstatic.com/media/685632_47af7c83bf6c4322bfdd227c402edc87~mv2.png",
  "fabrice": "https://static.wixstatic.com/media/685632_046807549f4d44498f7f035db42f4354~mv2.png",
  "sandy": "https://static.wixstatic.com/media/685632_92d7c46fffbe4ef498317ee0e7b1cd77~mv2.png",
  "fabienne-1": "https://static.wixstatic.com/media/685632_b39e89f637684257a9ec74912ad7ddae~mv2.png",
  "fabienne-2": "https://static.wixstatic.com/media/685632_07b9438834a14539a53cc34b0e232d0d~mv2.png",
  "billy": "https://static.wixstatic.com/media/685632_7f56755777ae49deaac30919fd53a29e~mv2.png",
  "ludo": "https://static.wixstatic.com/media/685632_d4b0c33b9bb642bb89df6a5fc506ccca~mv2.png",
  "ju": "https://static.wixstatic.com/media/685632_ea3ce72023a14c59b670cad94290cb85~mv2.png",
  "bene": "https://static.wixstatic.com/media/685632_24dd526ddb2a419ea88e031b13449c73~mv2.png",
  "kev": "https://static.wixstatic.com/media/685632_875015401b6242f8a519d01369ae1a20~mv2.png",
  "loic": "https://static.wixstatic.com/media/685632_8f2bfc4b4a57470e9f32298c321e49c0~mv2.png",
  "laura": "https://static.wixstatic.com/media/685632_500c4dbc8cf64968bd2cd129de63f76e~mv2.png",
  "val": "https://static.wixstatic.com/media/685632_d27eb1d91a8c41db90b7aa2f05ca191e~mv2.png",
  "victor": "https://static.wixstatic.com/media/685632_71880e23c288475180a70f2ffe75f22e~mv2.png",
  "elo": "https://static.wixstatic.com/media/685632_fdfdc42cd3ac4133bdae171f0eb4dce7~mv2.png",
  "djo": "https://static.wixstatic.com/media/685632_8ae74e2a234240049eb1b2195d6513f5~mv2.png"
};
const largePortraitSources={
  "pascal": "https://static.wixstatic.com/media/685632_0c58ab0ac7c54593bb95c53419c1f585~mv2.png",
  "micka": "https://static.wixstatic.com/media/685632_cada7561c9874737b3534b9e78032cb5~mv2.png",
  "emma": "https://static.wixstatic.com/media/685632_282d1d4dcc9d4e6f9453df70f4ec0784~mv2.png",
  "julie": "https://static.wixstatic.com/media/685632_72e5f8b195b24d6192caf7e42fa7c29b~mv2.png",
  "antho": "https://static.wixstatic.com/media/685632_6c7ae13b22e84dd28d63496c5da30865~mv2.png",
  "fabrice": "https://static.wixstatic.com/media/685632_6d87a929c292488097b1e3b5e121a3b2~mv2.png",
  "sandy": "https://static.wixstatic.com/media/685632_907431d49e1a4231b6de1fb9d4021b77~mv2.png",
  "fabienne-1": "https://static.wixstatic.com/media/685632_49dbdff30e924d3e8771f2e281285c44~mv2.png",
  "fabienne-2": "https://static.wixstatic.com/media/685632_c31733a23f604cbca6fa4ddd90fc39ed~mv2.png",
  "billy": "https://static.wixstatic.com/media/685632_ada8e583f1b74b8295c89579aa162bed~mv2.png",
  "ludo": "https://static.wixstatic.com/media/685632_5b4c5a111ec64b3083d1ccbb5c642976~mv2.png",
  "ju": "https://static.wixstatic.com/media/685632_2fc6c115599c448d9d3d00277c1bc4de~mv2.png",
  "bene": "https://static.wixstatic.com/media/685632_f5a2847727594c76a44c8db606e255f5~mv2.png",
  "kev": "https://static.wixstatic.com/media/685632_98152c0e647d4adc9ef817b9714dfbbc~mv2.png",
  "loic": "https://static.wixstatic.com/media/685632_025ff17e508e477c9c91f2d8b935b13c~mv2.png",
  "laura": "https://static.wixstatic.com/media/685632_1c3e820304dc40f0a8b3958962bf852a~mv2.png",
  "val": "https://static.wixstatic.com/media/685632_645ba6ac522c44ab90a77c82bb6c1aa6~mv2.png",
  "victor": "https://static.wixstatic.com/media/685632_4e2b537bb08c49e8b3c84e9028660e74~mv2.png",
  "elo": "https://static.wixstatic.com/media/685632_13a06465092d45df954746771e6b9732~mv2.png",
  "djo": "https://static.wixstatic.com/media/685632_36e9aa82e3d14451b470c0294e5880b2~mv2.png"
};
const photos=fighters.map(f=>{
 const im=new Image();
 im.decoding='async';
 im.onload=()=>{if(opened)render();};
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
// Véritable alphabet bitmap arcade : 7×9 pixels par caractère. Aucune police
// système, aucune interpolation et aucun changement aux portraits approuvés.
// Les caractères accentués conservent leur accent sur la plaque du nom.
const zfNameGlyphs={
 A:["0011100","0110110","1100011","1100011","1111111","1100011","1100011","1100011","1100011"],
 B:["1111100","1100110","1100011","1100110","1111100","1100110","1100011","1100110","1111100"],
 C:["0011111","0110000","1100000","1100000","1100000","1100000","1100000","0110000","0011111"],
 D:["1111100","1100110","1100011","1100011","1100011","1100011","1100011","1100110","1111100"],
 E:["1111111","1100000","1100000","1100000","1111100","1100000","1100000","1100000","1111111"],
 F:["1111111","1100000","1100000","1100000","1111100","1100000","1100000","1100000","1100000"],
 G:["0011111","0110000","1100000","1100000","1101111","1100011","1100011","0110011","0011110"],
 H:["1100011","1100011","1100011","1100011","1111111","1100011","1100011","1100011","1100011"],
 I:["1111111","0011100","0011100","0011100","0011100","0011100","0011100","0011100","1111111"],
 J:["0001111","0000110","0000110","0000110","0000110","1100110","1100110","0111100","0011000"],
 K:["1100011","1100110","1101100","1111000","1110000","1111000","1101100","1100110","1100011"],
 L:["1100000","1100000","1100000","1100000","1100000","1100000","1100000","1100000","1111111"],
 M:["1100011","1110111","1111111","1101011","1100011","1100011","1100011","1100011","1100011"],
 N:["1100011","1110011","1111011","1101111","1100111","1100011","1100011","1100011","1100011"],
 O:["0011100","0110110","1100011","1100011","1100011","1100011","1100011","0110110","0011100"],
 P:["1111100","1100110","1100011","1100011","1111110","1100000","1100000","1100000","1100000"],
 R:["1111100","1100110","1100011","1100110","1111100","1101100","1100110","1100011","1100011"],
 S:["0111111","1100000","1100000","0111000","0011110","0000011","0000011","1100110","1111100"],
 T:["1111111","0011100","0011100","0011100","0011100","0011100","0011100","0011100","0011100"],
 U:["1100011","1100011","1100011","1100011","1100011","1100011","1100011","0110110","0011100"],
 V:["1100011","1100011","1100011","1100011","1100011","0110110","0110110","0011100","0011100"],
 Y:["1100011","1100011","0110110","0011100","0011100","0011100","0011100","0011100","0011100"],
 "1":["0001100","0011100","0111100","0001100","0001100","0001100","0001100","0001100","0111110"],
 "2":["0111110","1100011","0000011","0000110","0001100","0011000","0110000","1100000","1111111"],
 " ":["0000000","0000000","0000000","0000000","0000000","0000000","0000000","0000000","0000000"]
};
function arcadeName(ctx,text,x,y,maxWidth){
 const chars=Array.from(text.toUpperCase());
 const width=Math.max(1,chars.length*8-1);
 const sx=Math.min(1.55,maxWidth/width);
 const sy=1.35;
 ctx.save();
 ctx.translate(x,y);
 ctx.scale(sx,sy);
 for(let i=0;i<chars.length;i++){
   const original=chars[i];
   const letter=original.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   const glyph=zfNameGlyphs[letter]||zfNameGlyphs[" "];
   const gx=i*8;
   for(let row=0;row<glyph.length;row++){
     for(let col=0;col<7;col++){
       if(glyph[row][col]!=="1")continue;
       // Relief brun sombre, tranche cuivrée puis éclairage orangé SNES.
       ctx.fillStyle="#130b2c";ctx.fillRect(gx+col+2,row+2,1,1);
       ctx.fillStyle="#71364c";ctx.fillRect(gx+col+1,row+1,1,1);
       ctx.fillStyle=row<3?"#ffe0a1":row<6?"#f6bc77":"#d98e60";
       ctx.fillRect(gx+col,row,1,1);
     }
   }
   if(original==="É"||original==="È"||original==="Ê"){
     ctx.fillStyle="#f9d08e";
     ctx.fillRect(gx+3,-2,2,1);
     ctx.fillRect(gx+(original==="È"?2:4),-3,1,1);
   }else if(original==="Ï"){
     ctx.fillStyle="#f9d08e";
     ctx.fillRect(gx+2,-2,1,1);ctx.fillRect(gx+5,-2,1,1);
   }
 }
 ctx.restore();
}

function drawArcadeSelectionText(){
 const c=root.querySelector('#zf-select-type');
 if(!c)return;
 const ctx=c.getContext('2d');
 ctx.setTransform(1,0,0,1,0,0);
 ctx.clearRect(0,0,320,240);ctx.imageSmoothingEnabled=false;
 const first=fighters[chosen[0]];
 if(!root.querySelector('.zf-select-cabinet').classList.contains('reference-ready')){
   // Secours lorsque la capture du fond ne peut pas être chargée.
   ctx.font='bold 15px monospace';ctx.fillStyle='#4dc8ff';ctx.fillText('1P',31,116);
 }
 arcadeName(ctx,first.name.toUpperCase(),27,121,97);
 if(count()===2){
   ctx.font='bold 16px monospace';
   ctx.fillStyle='#13235a';ctx.fillText('2P',248,119);
   ctx.fillStyle='#85e1ff';ctx.fillText('2P',247,118);
   arcadeName(ctx,fighters[chosen[1]].name.toUpperCase(),219,123,94);
 }
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
 showPortrait(1,chosen[0]);
 showPortrait(2,count()===2?chosen[1]:(chosen[0]+1)%fighters.length);
 const p1Name=root.querySelector('#zf-player-1-name');
 p1Name.textContent=fighters[chosen[0]].name.toUpperCase();
 p1Name.dataset.long=String(fighters[chosen[0]].name.length>7);
 const p2Label=root.querySelector('#zf-select-player-2-label');
 p2Label.hidden=count()!==2;
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
 const i=(index+fighters.length)%fighters.length;
 // Un clic sur la même case confirme le personnage; il ne déplace pas le curseur.
 if(i===pointerCursor[player])return;
 chosen[player]=i;pointerCursor[player]=i;
 if(player===0)bridge()?.setFighter?.(fighters[i].slug);
 else bridge()?.setOpponent?.(fighters[i].slug);
 playCursorMoveSound();
 render();
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
 open:enter,playMusic:startMusic,stopMusic,
 prewarm:()=>{
   for(const sound of confirmVoices)sound.load();
   const m=getMusic();m.volume=0;if(m.paused)void m.play().catch(()=>{});
 },
 getFighters:()=>fighters.map(f=>({...f})),
 getState:()=>({opened,activePlayer,chosen:[...chosen]})
};
})();