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
    // Effacer uniquement les anciens libellés "1P KEN", ligne par ligne,
    // en gardant le bleu d'origine (y compris ses variations de pixels).
    try{
      for(let y=94;y<136;y++){
        const color=ctx.getImageData(318,y,1,1).data;
        ctx.fillStyle='rgb('+color[0]+','+color[1]+','+color[2]+')';
        ctx.fillRect(3,y,74,1);
      }
    }catch(_){
      ctx.fillStyle='#040062';ctx.fillRect(3,94,74,42);
    }
    root.querySelector('.zf-select-cabinet').classList.add('reference-ready');
  });
  reference.src='https://static.wixstatic.com/media/685632_0fee1909f2e04b08aa3ede8c582e66f9~mv2.png';

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
// 21 portraits définitifs issus des fichiers nommés reçus (20 humains + Zika bonus).
const portraitSources={
  "pascal": "https://static.wixstatic.com/media/685632_27b48e1f5aca4cf1a2f6a326f7f7c2f9~mv2.png",
  "micka": "https://static.wixstatic.com/media/685632_3fae05bc42924dbb90b816288d77ba4d~mv2.png",
  "emma": "https://static.wixstatic.com/media/685632_a96827ca84094dcb836c973048a56219~mv2.png",
  "julie": "https://static.wixstatic.com/media/685632_eeaa15a02d4d46c7a94d748bc445ed70~mv2.png",
  "antho": "https://static.wixstatic.com/media/685632_9699ed97eec94928a6f47e503afa0059~mv2.png",
  "fabrice": "https://static.wixstatic.com/media/685632_7209f600d76d472d9bdf60ee86106ccf~mv2.png",
  "sandy": "https://static.wixstatic.com/media/685632_168f534e1274455c92dfbb5f76bc9917~mv2.png",
  "fabienne-1": "https://static.wixstatic.com/media/685632_66f635291c39420c8028dee96389f9cb~mv2.png",
  "fabienne-2": "https://static.wixstatic.com/media/685632_d2f2da3a0dac468e8333388335ffc6e8~mv2.png",
  "billy": "https://static.wixstatic.com/media/685632_6fdbaa74a062468a94556f0d24f78ad6~mv2.png",
  "ludo": "https://static.wixstatic.com/media/685632_9305f11d194845fbbd5978262f4b56de~mv2.png",
  "ju": "https://static.wixstatic.com/media/685632_6446fe74a9b2484db5857678ce541eef~mv2.png",
  "bene": "https://static.wixstatic.com/media/685632_7f661c2865284a23b95638de7df0d682~mv2.png",
  "kev": "https://static.wixstatic.com/media/685632_478e8242ddd948089d8a253adec306a1~mv2.png",
  "loic": "https://static.wixstatic.com/media/685632_6e37b180f5ec4be4b2be90891a3d6d02~mv2.png",
  "laura": "https://static.wixstatic.com/media/685632_3bae37b00c654eab8235c4f610babb58~mv2.png",
  "val": "https://static.wixstatic.com/media/685632_5f093e7ba30246fc9cfecec84edb37da~mv2.png",
  "victor": "https://static.wixstatic.com/media/685632_491f046aa6be43f98ccab04ea5d71f1a~mv2.png",
  "elo": "https://static.wixstatic.com/media/685632_3de50e9a3e9a4bf681421b8d7dd32fda~mv2.png",
  "djo": "https://static.wixstatic.com/media/685632_f6c2386a16414c8c9e9a162018fcba18~mv2.png",
  "zika": "https://static.wixstatic.com/media/685632_472063cde71b4616abc6a06b9742fb50~mv2.png"
};
const largePortraitSources={
  "pascal": "https://static.wixstatic.com/media/685632_5ab88476280945c1a523b1d644e25741~mv2.png",
  "micka": "https://static.wixstatic.com/media/685632_ac7af6b2ed37447a93705f8a0cdfd40b~mv2.png",
  "emma": "https://static.wixstatic.com/media/685632_455716b641e94ac8944f249d8fcb0981~mv2.png",
  "julie": "https://static.wixstatic.com/media/685632_c7628c77c9db41ab9b5b1e207e8b783d~mv2.png",
  "antho": "https://static.wixstatic.com/media/685632_67f68b9ea1a04dbe80c099e59f47c1c4~mv2.png",
  "fabrice": "https://static.wixstatic.com/media/685632_088a8aeb820f40be914d7941430a4a11~mv2.png",
  "sandy": "https://static.wixstatic.com/media/685632_afeb5055edde4085a1aff0059129d0fc~mv2.png",
  "fabienne-1": "https://static.wixstatic.com/media/685632_4ccaaf4a29a347b0a32bcf5fa42d422d~mv2.png",
  "fabienne-2": "https://static.wixstatic.com/media/685632_19b89ee31e584d4a8fbb2e111e379240~mv2.png",
  "billy": "https://static.wixstatic.com/media/685632_fd2c14244dd44fa0b8d9a35721696f1e~mv2.png",
  "ludo": "https://static.wixstatic.com/media/685632_e5fe8498ccfb4132a748cb5699dce9b2~mv2.png",
  "ju": "https://static.wixstatic.com/media/685632_eb7949f751c84749956449b68eeca750~mv2.png",
  "bene": "https://static.wixstatic.com/media/685632_a2d744590872434f9e4ff609a835c132~mv2.png",
  "kev": "https://static.wixstatic.com/media/685632_ff59272dd04b40b9b36fab21487ede7b~mv2.png",
  "loic": "https://static.wixstatic.com/media/685632_fde2259c63864bac91d1f554e039f81f~mv2.png",
  "laura": "https://static.wixstatic.com/media/685632_6a17521140d84ccd8e46df395aa43e82~mv2.png",
  "val": "https://static.wixstatic.com/media/685632_9d9393c44e334c29bcb3efdf731a24a4~mv2.png",
  "victor": "https://static.wixstatic.com/media/685632_7baed92eb6764c1ba098e4baae31c7e8~mv2.png",
  "elo": "https://static.wixstatic.com/media/685632_aea68b1e2f444135875223d4d9edbc63~mv2.png",
  "djo": "https://static.wixstatic.com/media/685632_24109ba352ec48ebb153c244cb08283b~mv2.png",
  "zika": "https://static.wixstatic.com/media/685632_45452eed6d9b48fd8fa2d65545c8aea4~mv2.png"
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
// Zika conserve son portrait dans les ressources, mais n'apparaît pas dans les 20 cases.
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
 const previous=panel.querySelector('img');if(previous)previous.remove();
 if(src){const im=new Image();im.src=largePortraitSources[f.slug]||src;im.alt=f.name;panel.prepend(im);}
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
root.querySelector('#zf-select-start-control').addEventListener('click',()=>{if(opened)confirm();});
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