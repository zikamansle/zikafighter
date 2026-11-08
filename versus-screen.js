/* Zika Fighter — écran VS calé au pixel SNES 320 × 240.
   Source géométrique : capture VS SFII Turbo SNES fournie par l'utilisateur.
   Une seule bande-son : 4-versus.mp3, sans fondu de volume.
*/
(()=>{'use strict';
 if(window.ZikaFighterVersus)return;
 const screen=document.createElement('section');
 screen.id='zf-versus';screen.hidden=true;screen.setAttribute('aria-label','VS — présentation des combattants');
 screen.innerHTML='<canvas id="zf-vs-canvas" width="320" height="240" role="img" aria-label="Portraits des deux combattants, noms et VS"></canvas>';
 document.body.appendChild(screen);
 const canvas=screen.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 const soundtrack=new Audio('./assets/audio/4-versus.mp3');
 soundtrack.preload='auto';soundtrack.loop=false;
 const names={'fabienne-1':'FABIENNE','fabienne-2':'FABIENNE','elo':'ELO','bene':'BENE','kev':'KEV','loic':'LOIC'};
 const niceName=id=>names[id]||String(id||'').replace(/-/g,' ').toUpperCase();
 const portraitSources=()=>window.ZikaFighterFinalHeroes||window.ZikaFighterLargePortraits||window.ZikaFighterPortraits||{};
 let session=0,ended=false,onFinish=null,portraitImages=[];
 let canSkip=false,skipHandler=null,lastPadPressed=false;
 let padRequest=0;
 const labels=['',''];
 // VS pixel sprite from the user-provided SNES screenshot (exact shape and colours).
 const vsSprite=new Image();
 vsSprite.onload=()=>{if(!screen.hidden)draw();};
 vsSprite.src='data:image/png;base64,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';
 const selectedSlugs=['',''];
 // Orientation des illustrations sources : visage tourné vers la gauche
 // de l'image. Toutes les autres sont frontales ou orientées à droite.
 const sourceFacingLeft=new Set(['elo','djo','bene','kev','fabienne-2']);

 function stop(){
  session++;ended=true;
  soundtrack.onended=null;soundtrack.onerror=null;
  soundtrack.pause();try{soundtrack.currentTime=0}catch(_){}
  screen.hidden=true;onFinish=null;portraitImages=[];
  canSkip=false;skipHandler=null;lastPadPressed=false;
  if(padRequest){cancelAnimationFrame(padRequest);padRequest=0;}
 }
 function drawPortrait(image,x,side,slug){
  if(!image?.complete||!image.naturalWidth)return;
  // La gauche regarde vers le centre (droite), la droite vers le centre (gauche).
  // On reflète uniquement l'affichage horizontal, jamais le fichier original.
  const dx=x,dy=37,dw=90,dh=108;
  const ratio=dw/dh,sourceRatio=image.naturalWidth/image.naturalHeight;
  let sx=0,sy=0,sw=image.naturalWidth,sh=image.naturalHeight;
  if(sourceRatio>ratio){sw=image.naturalHeight*ratio;sx=(image.naturalWidth-sw)/2;}
  else{sh=image.naturalWidth/ratio;sy=Math.max(0,(image.naturalHeight-sh)*.12);}
  const originalFacesLeft=sourceFacingLeft.has(slug);
  const wantLeft=side===2;
  const flip=originalFacesLeft!==wantLeft;
  ctx.save();ctx.beginPath();ctx.rect(dx,dy,dw,dh);ctx.clip();
  // Doux redimensionnement des visages UNIQUEMENT sur le VS.
  // Les images d'origine et l'interface pixel-art restent inchangées.
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  if(flip){ctx.translate(dx+dw,0);ctx.scale(-1,1);ctx.drawImage(image,sx,sy,sw,sh,0,dy,dw,dh);}
  else ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
  ctx.restore();
 }
 function draw(){
  if(screen.hidden)return;
  ctx.imageSmoothingEnabled=false;
  // Bleu homogène de la capture ; aucun dégradé et aucune bordure de portrait.
  ctx.fillStyle='#07005f';ctx.fillRect(0,0,320,240);
  drawPortrait(portraitImages[0],29,1,selectedSlugs[0]);
  drawPortrait(portraitImages[1],201,2,selectedSlugs[1]);
  const font=window.ZikaSNESText;
  if(font?.ready){
   font.draw(ctx,'START',288,0,{face:'game',tone:'cream',align:'right',scale:.50,maxWidth:53});
   // Serif condensed gold lettering matching the supplied SFII SNES reference.
   // Strictly limited to each fighter column: no overlap with the central VS.
   ctx.save();ctx.textAlign='center';ctx.textBaseline='top';
   for(const [name,x] of [[labels[0],74],[labels[1],246]]){
    let size=17;
    ctx.font='bold '+size+'px Georgia,serif';
    while(size>10&&ctx.measureText(name).width>89){size--;ctx.font='bold '+size+'px Georgia,serif';}
    ctx.fillStyle='#441028';ctx.fillText(name,x+1,157);
    ctx.fillStyle='#b54b29';ctx.fillText(name,x,154);
    ctx.fillStyle='#fbd57c';ctx.fillText(name,x,153);
   }
   ctx.restore();
  }else{
   ctx.textAlign='center';ctx.fillStyle='#f5c47d';ctx.font='bold 13px monospace';
   ctx.fillText(labels[0],73,165);ctx.fillText(labels[1],245,165);
   ctx.textAlign='right';ctx.fillText('START',289,12);
  }
  // The REAL gold VS + red explosion artwork cropped from the screenshot.
  // Fixed-size SNES pixel art, never enlarged into the fighters' names.
  if(vsSprite.complete&&vsSprite.naturalWidth){
   ctx.save();ctx.imageSmoothingEnabled=false;
   ctx.drawImage(vsSprite,118,145,84,60);
   ctx.restore();
  }

 }
 function loadPortraits(player1,player2,token){
  const srcs=portraitSources();
  portraitImages=[null,null];
  [player1,player2].forEach((id,index)=>{
   const path=srcs[id];if(!path)return;
   const image=new Image();image.decoding='async';
   image.onload=()=>{if(token!==session)return;portraitImages[index]=image;draw();};
   image.onerror=()=>console.warn('Zika Fighter VS : portrait introuvable',id);
   image.src=path;
   if(image.complete&&image.naturalWidth){portraitImages[index]=image;}
  });
 }
 function show({player1,player2,onComplete}={}){
  stop();ended=false;const token=session;
  onFinish=onComplete;labels[0]=niceName(player1);labels[1]=niceName(player2);
  selectedSlugs[0]=player1;selectedSlugs[1]=player2;
  loadPortraits(player1,player2,token);
  const finish=()=>{
   if(ended||token!==session)return;
   ended=true;
   const switchToFight=()=>{
    if(token!==session)return;
    const callback=onFinish;stop();
    if(typeof callback==='function')callback();
   };
   if(window.ZikaFighterScreens?.change)
    window.ZikaFighterScreens.change(switchToFight,{out:220,hold:30,in:220});
   else switchToFight();
  };
  // START/validation pour passer le VS, sans toucher au son de sélection.
  skipHandler=finish;
  const pollPad=()=>{
   if(token!==session||ended){padRequest=0;return;}
   let pressed=false;
   try{
    const pads=navigator.getGamepads?.()||[];
    for(const pad of pads){
     if(!pad)continue;
     if([9,0,1,2,3].some(i=>pad.buttons?.[i]?.pressed)){pressed=true;break;}
    }
   }catch(_){}
   if(canSkip&&pressed&&!lastPadPressed)skipHandler?.();
   lastPadPressed=pressed;
   padRequest=requestAnimationFrame(pollPad);
  };
  const enter=()=>{
   if(token!==session)return;
   screen.hidden=false;draw();
   canSkip=false;lastPadPressed=true;
   requestAnimationFrame(()=>{
    if(token!==session)return;
    // Nécessite le relâchement de START/A pour passer au VS.
    canSkip=true;lastPadPressed=false;
   });
   padRequest=requestAnimationFrame(pollPad);
   // La piste VS joue toute sa durée : SEUL "ended" déclenche la fin.
   // Aucun délai artificiel et aucun fondu d'entrée/sortie audio.
   window.ZikaArcadeAudio?.stop?.();
   window.ZikaFighterCharacterSelect?.stopMusic?.();
   soundtrack.volume=Math.max(0,Math.min(1,Number(window.ZikaFighterSettings?.musicVolume??7)/10))*.85;
   soundtrack.onended=finish;
   soundtrack.onerror=()=>{console.error('Zika Fighter VS : erreur fichier 4-versus.mp3');finish();};
   try{soundtrack.currentTime=0}catch(_){}
   const promise=soundtrack.play();
   if(promise?.catch)promise.catch(error=>{console.error('Zika Fighter VS : lecture audio',error);finish();});
  };
  if(window.ZikaFighterScreens?.change)
   window.ZikaFighterScreens.change(enter,{out:220,hold:30,in:220});
  else enter();
  return true;
 }
 // Capture avant les commandes du combat et du stage. Ne pas prendre un
 // maintien de touche pour un nouvel appui de validation.
 const heldKeys=new Set();
 document.addEventListener('keydown',event=>{
  if(!['Enter','Space','NumpadEnter','KeyZ','KeyX'].includes(event.code))return;
  if(screen.hidden||!canSkip||ended||window.ZikaFighterScreens?.busy)return;
  if(event.repeat||heldKeys.has(event.code))return;
  event.preventDefault();event.stopImmediatePropagation();
  heldKeys.add(event.code);
  skipHandler?.();
 },true);
 document.addEventListener('keyup',event=>{heldKeys.delete(event.code);},true);
 window.addEventListener('blur',()=>heldKeys.clear());
 window.ZikaSNESText?.whenReady(()=>{if(!screen.hidden)draw();});
 window.ZikaFighterVersus=Object.freeze({show,close:stop,stopAudio:()=>{soundtrack.pause();try{soundtrack.currentTime=0;}catch(_){}},getState:()=>({visible:!screen.hidden,audioTime:soundtrack.currentTime,audioDuration:soundtrack.duration})});
})();
