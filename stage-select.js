/* Zika Fighter : choix d'arène APRÈS la validation des combattants. */
(()=>{'use strict';
 const root=document.getElementById('select');
 if(!root||root.querySelector('#zf-stage-screen'))return;
 const catalogue=()=>window.ZikaFighterStages;
 const screen=document.createElement('section');
 screen.id='zf-stage-screen';screen.hidden=false;
 screen.setAttribute('aria-label',"Choix de l'arène");
 screen.innerHTML=[
  '<h2 class="zf-stage-heading" aria-label="STAGE SELECT"><canvas id="zf-stage-title-pixels" width="320" height="22" aria-hidden="true"></canvas></h2>',
  '<div class="zf-stage-grid" id="zf-stage-grid" role="group" aria-label="Arènes disponibles"></div>',
  '<div class="zf-stage-help" id="zf-stage-help" aria-live="polite">FLÈCHES : CHOISIR · START : VALIDER</div>',
  '<div class="zf-stage-flight" id="zf-stage-flight" hidden><strong id="zf-stage-flight-name"><canvas id="zf-flight-stage" width="320" height="36" aria-hidden="true"></canvas></strong><div id="zf-stage-confirm-card" class="zf-stage-confirm-card"><div class="zf-stage-confirm-art"><img id="zf-stage-confirm-image" alt="" decoding="async"><span id="zf-stage-image-error" hidden>IMAGE INDISPONIBLE</span></div><span class="zf-stage-confirm-random">?</span></div></div>'
 ].join('');
 root.querySelector('.zf-select-cabinet').appendChild(screen);
 const grid=screen.querySelector('#zf-stage-grid');
 function drawStageTexts(){
   const font=window.ZikaSNESText;if(!font?.ready)return;
   const heading=screen.querySelector('#zf-stage-title-pixels');
   const ctx=heading.getContext('2d');ctx.clearRect(0,0,320,22);
   font.draw(ctx,'STAGE SELECT',160,1,{align:'center',scale:.63,maxWidth:165});
   const flightStage=screen.querySelector('#zf-flight-stage');
   const fs=flightStage.getContext('2d');
   fs.clearRect(0,0,flightStage.width,flightStage.height);
   const stageName=screen.querySelector('#zf-stage-flight-name').dataset.stageName||'';
   // Une seule ligne, centrée ; le moteur bitmap ajuste les très longs noms.
   if(stageName)font.draw(fs,stageName,160,2,
      {align:'center',scale:1.02,maxWidth:308,face:'game',tone:'cream'});
   for(const tile of grid.querySelectorAll('.zf-stage-slot-name-bitmap')){
     const label=tile.dataset.stageName;
     const g=tile.getContext('2d');g.clearRect(0,0,200,36);
     const lines=font.wrap(label,18).slice(0,3);
     const dy=lines.length===1?8:lines.length===2?3:1;
     const lineStep=lines.length===3?12:16;
     const size=lines.length===3?.43:lines.length===2?.60:.72;
     for(let i=0;i<lines.length;i++){
       font.draw(g,lines[i],100,dy+i*lineStep,
         {tone:'cream',align:'center',scale:size,maxWidth:194,face:'game'});
     }
   }
 }
 window.ZikaSNESText?.whenReady(drawStageTexts);

 let active=false,confirming=false,cursor=0,selected=null,lastPadInputAt=0,padConfirmDown=false,stageToken=0;
 const randomOption={id:'random-stage',name:'ALÉATOIRE',random:true};
 const actualStages=()=>catalogue()?.available()||[];
 const list=()=>[randomOption,...actualStages()];
 const get=id=>catalogue()?.get(id)||null;
 function draw(){
  const items=list();if(cursor>=items.length)cursor=0;
  const stage=items[cursor];if(!stage)return;
  screen.querySelector('#zf-stage-flight-name').dataset.stageName=stage.name.toUpperCase();
  drawStageTexts();
  // Grand décor d'origine chargé au lancement du combat, pas à chaque déplacement.
  for(const node of grid.children){
    const selected=active&&Number(node.dataset.pos)===cursor;
    node.classList.toggle('current',selected);
    node.setAttribute('aria-pressed',String(selected));
  }
  // Le curseur d'arène affiche son repère 1P avec le même alphabet SNES.
  const font=window.ZikaSNESText;
  for(const tile of grid.children){
    const bm=tile.querySelector('.zf-stage-p1-cursor');
    if(!bm)continue;
    const ctx=bm.getContext('2d');
    ctx.clearRect(0,0,bm.width,bm.height);
    if(active&&Number(tile.dataset.pos)===cursor&&font?.ready)
      font.draw(ctx,'1P',1,1,{tone:'cyan',scale:.51,maxWidth:30});
  }
  const selectedTile=grid.children[cursor];
  if(active&&selectedTile)selectedTile.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
  screen.querySelector('#zf-stage-help').textContent=active
    ?'◀ ▶ '+stage.name.toUpperCase()+' · START : VALIDER'
    :'PERSONNAGES 7–7–6 · PUIS CHOIX DU STAGE';
  if(!stage.random)catalogue()?.preload(stage.id);
 }
 function fillGrid(){
  grid.replaceChildren();
  list().forEach((s,index)=>{
   const button=document.createElement('button');button.type='button';
   button.className='zf-stage-slot';button.dataset.pos=String(index);
   const title=document.createElement('span');title.className='zf-stage-slot-title';
   const labelBitmap=document.createElement('canvas');
   labelBitmap.className='zf-stage-slot-name-bitmap';
   labelBitmap.width=200;labelBitmap.height=36;
   labelBitmap.dataset.stageName=s.name;
   labelBitmap.setAttribute('aria-hidden','true');
   button.setAttribute('aria-label',s.name);
   title.appendChild(labelBitmap);
   // 21 miniatures originales regroupées dans un SEUL bandeau horizontal.
   // Royaume de Zika n'est affiché que lorsque son déblocage est validé.
   const art=document.createElement('div');
   art.className='zf-stage-thumb';
   art.setAttribute('aria-hidden','true');
   // Chaque vignette réutilise le décor ORIGINAL de cette arène,
   // jamais une case d'un montage compressé ou une illustration inventée.
   // L'image reste entière dans une zone 16:9, sans étirement.
   const imageUrl=s.random?null:(s.imageUrl||catalogue()?.imageFor?.(s.id));
   art.style.backgroundImage=imageUrl?'url("'+imageUrl.replace(/"/g,'%22')+'")':'none';
   if(s.random){
     button.classList.add('zf-stage-random');
     const mark=document.createElement('span');
     mark.className='zf-stage-random-symbol';mark.textContent='?';
     art.appendChild(mark);
   }
   art.style.backgroundSize='contain';
   art.style.backgroundRepeat='no-repeat';
   art.style.backgroundPosition='center center';
   const cursorBitmap=document.createElement('canvas');
   cursorBitmap.className='zf-stage-p1-cursor';
   cursorBitmap.width=48;cursorBitmap.height=30;
   cursorBitmap.setAttribute('aria-hidden','true');
   button.append(art,title,cursorBitmap);
   button.addEventListener('click',()=>{
    if(!active||confirming)return;
    if(index===cursor)confirm();
    else choose(index);
   });
   grid.appendChild(button);
  });
  drawStageTexts();
 }
 function cursorSound(){
  if(window.ZikaFighterMenuSfx?.move)window.ZikaFighterMenuSfx.move();
  else window.ZikaArcadeAudio?.playEffect?.('move');
 }
 function choose(index){
  if(!active||confirming)return;
  const n=list().length;if(!n)return;
  const next=(index+n)%n;
  if(next===cursor)return;
  cursor=next;cursorSound();draw();
 }
 function move(dx,dy){
  // Bandeau horizontal : droite/gauche ou haut/bas = vignette précédente/suivante.
  const direction=dx||dy;
  if(direction)choose(cursor+(direction>0?1:-1));
 }
 function open(choice={}){
  if(!catalogue())return false;
  stageToken++;active=true;confirming=false;skipRequested=false;cursor=0;selected=null;
  planeFinish?.();
  if(planeAudio){planeAudio.pause();planeAudio=null;}
  window.ZikaArcadeAudio?.stopStageVoice?.();
  screen.classList.remove('zf-stage-confirming');
  root.classList.remove('zf-stage-confirm-view');
  // Même piste audio, même position de lecture : aucun redémarrage ni silence.
  window.ZikaFighterCharacterSelect?.ensureMusic?.();
  // Les portraits validés restent dans l'écran supérieur de PLAYER SELECT.
  screen.querySelector('#zf-stage-flight').hidden=true;
  screen.hidden=false;root.hidden=false;
  root.classList.add('zf-stage-phase');
  screen.classList.add('zf-stage-active');
  fillGrid();draw();
  window.ZikaArcadeAudio?.preloadClip?.('./assets/audio/zika-plane-transition.ogg');
  grid.children[0]?.focus({preventScroll:true});
  return true;
 }
 function close(){
  stageToken++;active=false;confirming=false;skipRequested=false;screen.hidden=false;
  planeFinish?.();
  if(planeAudio){planeAudio.pause();planeAudio=null;}
  window.ZikaArcadeAudio?.stopStageVoice?.();
  screen.classList.remove('zf-stage-active','zf-stage-confirming');
  root.classList.remove('zf-stage-phase','zf-stage-confirm-view');
  screen.querySelector('#zf-stage-flight').hidden=true;
  screen.querySelector('#zf-stage-help').textContent='PERSONNAGES 7–7–6 · PUIS CHOIX DU STAGE';
 }
 let stageSkipResolve=null,planeAudio=null,planeFinish=null,skipRequested=false;
 function waitOrSkip(ms){
  if(skipRequested)return Promise.resolve();
  return new Promise(resolve=>{
   let done=false;
   const timer=setTimeout(doneWait,ms);
   function doneWait(){
    if(done)return;
    done=true;clearTimeout(timer);
    if(stageSkipResolve===doneWait)stageSkipResolve=null;
    resolve();
   }
   stageSkipResolve=doneWait;
  });
 }
 function skipAnnouncement(){
  if(!active||!confirming||skipRequested)return false;
  skipRequested=true;
  if(planeAudio){planeAudio.pause();planeAudio.currentTime=0;}
  planeFinish?.();
  window.ZikaArcadeAudio?.stopStageVoice?.();
  stageSkipResolve?.();
  return true;
 }
 async function playAirplane(){
  if(skipRequested)return;
  const path='./assets/audio/zika-plane-transition.ogg';
  await new Promise(resolve=>{
   const sound=new Audio(path);
   planeAudio=sound;sound.preload='auto';
   sound.volume=Math.max(0,Math.min(1,Number(window.ZikaFighterSettings?.fxVolume??8)/10));
   let done=false;
   const timeout=setTimeout(finish,1100);
   planeFinish=finish;
   function finish(){
    if(done)return;done=true;clearTimeout(timeout);
    sound.pause();if(planeAudio===sound)planeAudio=null;
    if(planeFinish===finish)planeFinish=null;
    resolve();
   }
   sound.onended=finish;sound.onerror=finish;
   try{const p=sound.play();if(p?.catch)p.catch(finish);}catch(_){finish();}
  });
 }
 async function confirm(){
  if(!active||confirming)return;
  const chosen=list()[cursor];if(!chosen)return;
  // ALÉATOIRE tire un stage accessible, mais ne joue QUE l'avion :
  // aucun son de validation ni annonce vocale du décor tiré.
  const available=actualStages();
  const s=chosen.random?available[Math.floor(Math.random()*available.length)]:chosen;
  if(!s)return;
  confirming=true;skipRequested=false;selected=s.id;
  if(!chosen.random){
    if(window.ZikaFighterCharacterSelect?.playConfirmSound){
      window.ZikaFighterCharacterSelect.playConfirmSound();
    }else window.ZikaFighterMenuSfx?.confirm?.();
  }
  const ownToken=stageToken;
  // La musique de PLAYER SELECT reste continue pendant l'annonce du stage.
  window.ZikaFighterBridge?.setStage?.(s.id);
  // Afficher le stage sélectionné centré sous son titre. Aucun avion dessiné.
  const preview=screen.querySelector('#zf-stage-flight');
  const art=preview.querySelector('.zf-stage-confirm-art');
  const randomMark=preview.querySelector('.zf-stage-confirm-random');
  const picture=art.querySelector('#zf-stage-confirm-image');
  const error=art.querySelector('#zf-stage-image-error');
  art.hidden=!!chosen.random;
  randomMark.hidden=!chosen.random;
  // Double sécurité contre les anciennes règles CSS : jamais ? et photo ensemble.
  randomMark.style.display=chosen.random?'':'none';
  art.style.display=chosen.random?'none':'';
  picture.removeAttribute('src');
  picture.hidden=!!chosen.random;
  error.hidden=true;
  if(!chosen.random){
    // Source officielle en priorité, puis copie locale : ne jamais substituer
    // par erreur le décor d'une autre arène.
    const options=[s.imageUrl||catalogue()?.imageFor?.(s.id),s.image?'./assets/stages/'+encodeURIComponent(s.image):null].filter(Boolean);
    let attempt=0;
    picture.alt=s.name;
    picture.onerror=()=>{
      attempt++;
      if(attempt<options.length)picture.src=options[attempt];
      else{picture.hidden=true;error.hidden=false;console.warn('Décor indisponible :',s.id);}
    };
    if(options.length)picture.src=options[0];
    else{picture.hidden=true;error.hidden=false;}
  }
  preview.querySelector('#zf-stage-flight-name').dataset.stageName=chosen.random?'ALÉATOIRE':s.name.toUpperCase();
  drawStageTexts();
  preview.hidden=false;
  screen.classList.add('zf-stage-confirming');
  root.classList.add('zf-stage-confirm-view');
  // Laisser entendre le clic de validation avant le bruit d'avion.
  await waitOrSkip(90);
  if(!active||stageToken!==ownToken)return;
  await playAirplane();
  if(!active||stageToken!==ownToken)return;
  if(!chosen.random&&!skipRequested){
    // L'annonce reste audible, mais ne retarde pas indéfiniment l'écran VS.
    const voicePromise=catalogue()?.announce(s.id);
    await Promise.race([voicePromise,waitOrSkip(1450)]);
    window.ZikaArcadeAudio?.stopStageVoice?.();
  }
  if(!active||stageToken!==ownToken)return;
  active=false;screen.classList.remove('zf-stage-active','zf-stage-confirming');root.classList.remove('zf-stage-phase','zf-stage-confirm-view');
  const player1=window.ZikaFighterBridge?.getMatchSelection?.()?.player||'pascal';
  const player2=window.ZikaFighterBridge?.getMatchSelection?.()?.opponent||'micka';
  // Fondre uniquement la musique PLAYER SELECT pendant l'entrée sur VS.
  // La musique VS démarre à son volume normal, sans fondu audio.
  if(window.ZikaFighterCharacterSelect?.fadeOutMusic)
    await window.ZikaFighterCharacterSelect.fadeOutMusic(260);
  else window.ZikaFighterCharacterSelect?.stopMusic?.();
  if(stageToken!==ownToken)return;
  const launch=()=>window.ZikaFighterBridge?.start?.();
  if(window.ZikaFighterVersus?.show){
    window.ZikaFighterVersus.show({player1,player2,onComplete:launch});
  }else{
    window.ZikaFighterCharacterSelect?.stopMusic?.();
    launch();
  }
 }
 document.addEventListener('keydown',event=>{
  if(!active||window.ZikaFighterScreens?.busy)return;
  if(confirming){
   if(['Enter','Space','NumpadEnter','KeyZ','KeyX','Escape'].includes(event.code)&&!event.repeat){
    event.preventDefault();event.stopImmediatePropagation();skipAnnouncement();
   }
   return;
  }
  const code=event.code;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Enter','Space','NumpadEnter','Escape'].includes(code))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.repeat&&['Enter','Space','NumpadEnter','Escape'].includes(code))return;
  if(code==='ArrowLeft'||code==='KeyA')move(-1,0);
  else if(code==='ArrowRight'||code==='KeyD')move(1,0);
  else if(code==='ArrowUp'||code==='KeyW')move(0,-1);
  else if(code==='ArrowDown'||code==='KeyS')move(0,1);
  else if(code==='Escape'){close();window.ZikaFighterCharacterSelect?.open?.()}
  else confirm();
 },true);
 function pollPad(time){
  if(active){
    try{
      const pad=navigator.getGamepads?.()?.find(Boolean);
      if(pad){
        const pressed=i=>!!pad.buttons?.[i]?.pressed;
        const ax=pad.axes?.[0]||0,ay=pad.axes?.[1]||0;
        const dx=pressed(14)||ax<-.6?-1:pressed(15)||ax>.6?1:0;
        const dy=pressed(12)||ay<-.6?-1:pressed(13)||ay>.6?1:0;
        if(!confirming&&(dx||dy)&&time-lastPadInputAt>170){lastPadInputAt=time;move(dx,dy)}
        const down=pressed(9)||pressed(0);
        if(down&&!padConfirmDown){if(confirming)skipAnnouncement();else confirm();}
        padConfirmDown=down;
      }
    }catch(_){}
  }else padConfirmDown=false;
  requestAnimationFrame(pollPad);
 }
 requestAnimationFrame(pollPad);
 // Les arènes sont visibles dès l'écran de sélection, mais pas sélectionnables
 // tant que les joueurs n'ont pas confirmé leurs combattants.
 fillGrid();draw();
 window.ZikaFighterStageSelect={open,close,move,choose,confirm,
   skipAnnouncement,
   getState:()=>({active,confirming,cursor,selected,available:list().length})};
})();
