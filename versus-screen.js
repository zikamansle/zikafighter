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
 function stop(){
  session++;ended=true;
  soundtrack.onended=null;soundtrack.onerror=null;
  soundtrack.pause();try{soundtrack.currentTime=0}catch(_){}
  screen.hidden=true;onFinish=null;portraitImages=[];
  canSkip=false;skipHandler=null;lastPadPressed=false;
  if(padRequest){cancelAnimationFrame(padRequest);padRequest=0;}
 }
 function drawBurst(){
  // Silhouette à pointes rouges comme la capture de référence, sans icône moderne.
  const points=[
   [129,162],[118,155],[130,153],[123,144],[139,152],[140,141],
   [148,151],[154,141],[160,151],[168,142],[170,152],[181,146],
   [181,154],[197,151],[188,160],[201,165],[190,170],[204,177],
   [187,179],[193,192],[177,184],[172,197],[163,187],[154,199],
   [150,188],[132,195],[136,182],[119,186],[128,173],[116,167]
  ];
  ctx.fillStyle='#b11227';ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.fill();
  ctx.fillStyle='#d72228';
  ctx.fillRect(140,159,43,24);
 }
 function drawPortrait(image,x){
  if(!image?.complete||!image.naturalWidth)return;
  // L'illustration reste intacte ; cadrage tête/poitrine dans la case SNES.
  const dx=x,dy=37,dw=90,dh=108;
  const ratio=dw/dh,sourceRatio=image.naturalWidth/image.naturalHeight;
  let sx=0,sy=0,sw=image.naturalWidth,sh=image.naturalHeight;
  if(sourceRatio>ratio){sw=image.naturalHeight*ratio;sx=(image.naturalWidth-sw)/2;}
  else{sh=image.naturalWidth/ratio;sy=Math.max(0,(image.naturalHeight-sh)*.12);}
  ctx.save();ctx.beginPath();ctx.rect(dx,dy,dw,dh);ctx.clip();
  ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
  ctx.restore();
 }
 function draw(){
  if(screen.hidden)return;
  ctx.imageSmoothingEnabled=false;
  // Bleu homogène de la capture ; aucun dégradé et aucune bordure de portrait.
  ctx.fillStyle='#07005f';ctx.fillRect(0,0,320,240);
  drawPortrait(portraitImages[0],29);
  drawPortrait(portraitImages[1],201);
  const font=window.ZikaSNESText;
  if(font?.ready){
   font.draw(ctx,'START',288,0,{face:'game',tone:'cream',align:'right',scale:.50,maxWidth:53});
   // Noms dorés et ombre bordeaux, comme sur le VS SNES de référence.
   const nameFont='"ZikaCPS1",Georgia,serif';
   ctx.save();ctx.textAlign='center';ctx.textBaseline='top';
   for(const [name,x] of [[labels[0],73],[labels[1],245]]){
    let size=19;ctx.font='bold '+size+'px '+nameFont;
    while(size>9&&ctx.measureText(name).width>91){size--;ctx.font='bold '+size+'px '+nameFont;}
    ctx.fillStyle='#5c1b30';ctx.fillText(name,x+1,156);
    ctx.fillStyle='#bb6231';ctx.fillText(name,x,154);
    ctx.fillStyle='#f3cc76';ctx.fillText(name,x,153);
   }
   ctx.restore();
  }else{
   ctx.textAlign='center';ctx.fillStyle='#f5c47d';ctx.font='bold 13px monospace';
   ctx.fillText(labels[0],73,165);ctx.fillText(labels[1],245,165);
   ctx.textAlign='right';ctx.fillText('START',289,12);
  }
  drawBurst();
  // Lettrage "VS" or, ombre brune, position identique à la référence.
  ctx.save();ctx.textAlign='center';ctx.textBaseline='top';
  ctx.font='italic 900 48px "ZikaCPS1",Georgia,serif';
  ctx.lineJoin='round';
  ctx.strokeStyle='#741b27';ctx.lineWidth=3;
  ctx.strokeText('VS',162,144);
  ctx.fillStyle='#50102a';ctx.fillText('VS',164,148);
  const gold=ctx.createLinearGradient(0,146,0,187);
  gold.addColorStop(0,'#ffffc7');gold.addColorStop(.52,'#f6ed8e');
  gold.addColorStop(1,'#f4b62e');
  ctx.fillStyle=gold;ctx.fillText('VS',160,144);
  ctx.restore();
  ctx.fillStyle='#243a82';ctx.fillRect(0,204,320,1);
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
 window.ZikaFighterVersus=Object.freeze({show,close:stop,getState:()=>({visible:!screen.hidden,audioTime:soundtrack.currentTime,audioDuration:soundtrack.duration})});
})();
