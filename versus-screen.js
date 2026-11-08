/* Zika Fighter — VS 16-bit layout matching the supplied SNES reference. */
(()=>{'use strict';
 if(window.ZikaFighterVersus)return;
 const screen=document.createElement('section');
 screen.id='zf-versus';screen.hidden=true;screen.setAttribute('aria-label','Écran VS');
 screen.innerHTML=[
  '<div class="zf-vs-picture">',
  ' <canvas class="zf-vs-start" width="80" height="18" aria-hidden="true"></canvas>',
  ' <div class="zf-vs-player zf-vs-left"><div class="zf-vs-portrait"><img id="zf-vs-img1" alt=""></div><canvas id="zf-vs-name1" class="zf-vs-name" width="150" height="33"></canvas></div>',
  ' <div class="zf-vs-player zf-vs-right"><div class="zf-vs-portrait"><img id="zf-vs-img2" alt=""></div><canvas id="zf-vs-name2" class="zf-vs-name" width="150" height="33"></canvas></div>',
  ' <div class="zf-vs-burst" aria-hidden="true"></div><div class="zf-vs-emblem" aria-label="VS">VS</div>',
  '</div>'
 ].join('');
 document.body.appendChild(screen);
 const track=new Audio('./assets/audio/4-versus.mp3');
 track.preload='auto';track.loop=false;
 const displayName=slug=>({'fabienne-1':'FABIENNE','fabienne-2':'FABIENNE','elo':'ELO','bene':'BENE','kev':'KEV','loic':'LOIC'}[slug]||String(slug||'').replace(/-/g,' ').toUpperCase());
 let generation=0,timeout=null,finished=false;
 function drawText(){
  if(screen.hidden||!window.ZikaSNESText?.ready)return;
  const font=window.ZikaSNESText;
  const start=screen.querySelector('.zf-vs-start');const c=start.getContext('2d');
  c.clearRect(0,0,start.width,start.height);
  font.draw(c,'START',75,0,{align:'right',face:'game',scale:.59,maxWidth:74,tone:'cream'});
  for(const i of [1,2]){
   const canvas=screen.querySelector('#zf-vs-name'+i),ctx=canvas.getContext('2d');
   ctx.clearRect(0,0,canvas.width,canvas.height);
   font.draw(ctx,canvas.dataset.name||'',75,1,{align:'center',face:'game',scale:1.12,maxWidth:146,tone:'gold'});
  }
 }
 window.ZikaSNESText?.whenReady(drawText);
 function stop(){
  generation++;
  if(timeout!==null){clearTimeout(timeout);timeout=null;}
  track.onended=null;track.onerror=null;track.pause();
  try{track.currentTime=0;}catch(_){}
  screen.hidden=true;
 }
 function show({player1,player2,onComplete}={}){
  stop();finished=false;
  const token=generation;
  const portraits=window.ZikaFighterFinalHeroes||window.ZikaFighterLargePortraits||window.ZikaFighterPortraits||{};
  for(const [number,slug] of [[1,player1],[2,player2]]){
   const image=screen.querySelector('#zf-vs-img'+number),src=portraits[slug];
   if(src){image.src=src;image.hidden=false;}else{image.removeAttribute('src');image.hidden=true;}
   image.alt=displayName(slug);
   screen.querySelector('#zf-vs-name'+number).dataset.name=displayName(slug);
  }
  const leave=()=>{
   if(token!==generation||finished)return;
   finished=true;
   const switchScreen=()=>{
    if(token!==generation)return;
    stop();
    if(typeof onComplete==='function')onComplete();
   };
   if(window.ZikaFighterScreens?.change)
    window.ZikaFighterScreens.change(switchScreen,{out:290,hold:40,in:290});
   else switchScreen();
  };
  const enter=()=>{
   if(token!==generation)return;
   screen.hidden=false;
   drawText();
   // Aucun autre fond musical pendant le VS ; les bruitages de sélection
   // ont fini et la piste VS est la seule musique active.
   window.ZikaArcadeAudio?.stop?.();
   window.ZikaFighterCharacterSelect?.stopMusic?.();
   // Original VS track starts immediately at normal level. No audio fade.
   track.volume=Math.min(1,Math.max(0,Number(window.ZikaFighterSettings?.musicVolume??7)/10))*.85;
   try{track.currentTime=0;}catch(_){}
   track.onended=leave;
   track.onerror=()=>{console.warn('Zika Fighter: piste VS introuvable');leave();};
   // Use the ACTUAL file ending. Only fall back if ended never fires.
   const startPlayback=()=>{
    const duration=Number.isFinite(track.duration)&&track.duration>0?track.duration:7.915;
    timeout=setTimeout(leave,(duration+1.2)*1000);
    const promise=track.play();
    if(promise?.catch)promise.catch(err=>{console.warn('Zika Fighter: son VS bloqué',err);leave();});
   };
   try{startPlayback();}catch(err){console.warn(err);leave();}
  };
  // A fade before VS and another after, but NO fade between character/stage choice.
  if(window.ZikaFighterScreens?.change)
   window.ZikaFighterScreens.change(enter,{out:290,hold:40,in:290});
  else enter();
  return true;
 }
 window.ZikaFighterVersus=Object.freeze({show,close:stop});
})();
