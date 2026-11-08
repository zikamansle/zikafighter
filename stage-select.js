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
  '<div class="zf-stage-heroes">',
    '<div class="zf-stage-hero"><b>1P</b><img id="zf-stage-player1" alt=""><span id="zf-stage-name1"></span></div>',
    '<div class="zf-stage-feature"><div class="zf-stage-image" id="zf-stage-image"></div><strong id="zf-stage-title"></strong></div>',
    '<div class="zf-stage-hero zf-stage-hero-right"><b id="zf-stage-player2-label">CPU</b><img id="zf-stage-player2" alt=""><span id="zf-stage-name2"></span></div>',
  '</div>',
  '<div class="zf-stage-grid" id="zf-stage-grid" role="group" aria-label="Arènes disponibles"></div>',
  '<div class="zf-stage-help" id="zf-stage-help" aria-live="polite">FLÈCHES : CHOISIR · START : VALIDER</div>',
  '<div class="zf-stage-flight" id="zf-stage-flight" hidden><span>STAGE APPROACH</span><strong id="zf-stage-flight-name"></strong><div class="zf-stage-airplane" aria-hidden="true">✈</div></div>'
 ].join('');
 root.querySelector('.zf-select-cabinet').appendChild(screen);
 const grid=screen.querySelector('#zf-stage-grid');
 function drawStageTexts(){
   const font=window.ZikaSNESText;if(!font?.ready)return;
   const heading=screen.querySelector('#zf-stage-title-pixels');
   const ctx=heading.getContext('2d');ctx.clearRect(0,0,320,22);
   font.draw(ctx,'STAGE SELECT',160,1,{align:'center',scale:.63,maxWidth:165});
   for(const tile of grid.querySelectorAll('.zf-stage-slot-name-bitmap')){
     const label=tile.dataset.stageName;
     const g=tile.getContext('2d');g.clearRect(0,0,200,36);
     const lines=font.wrap(label,19).slice(0,3);
     const dy=lines.length===1?11:lines.length===2?6:2;
     const lineStep=lines.length===3?12:15;
     for(let i=0;i<lines.length;i++){
       font.draw(g,lines[i],100,dy+i*lineStep,
         {tone:'cream',align:'center',scale:.37,maxWidth:193});
     }
   }
 }
 window.ZikaSNESText?.whenReady(drawStageTexts);

 let active=false,confirming=false,cursor=0,selected=null,lastPadInputAt=0,padConfirmDown=false,stageToken=0;
 const list=()=>catalogue()?.available()||[];
 const get=id=>catalogue()?.get(id)||null;
 const imgPreview=src=>{
   const image=screen.querySelector('#zf-stage-image');
   image.style.backgroundImage=src?'url("'+src.replace(/"/g,'%22')+'")':'none';
   image.classList.toggle('zf-stage-image-missing',!src);
 };
 function draw(){
  const items=list();if(cursor>=items.length)cursor=0;
  const stage=items[cursor];if(!stage)return;
  const title=screen.querySelector('#zf-stage-title');title.textContent=stage.name.toUpperCase();
  screen.querySelector('#zf-stage-flight-name').textContent=stage.name.toUpperCase();
  // Grand décor d'origine chargé au lancement du combat, pas à chaque déplacement.
  for(const node of grid.children)node.classList.toggle('current',Number(node.dataset.pos)===cursor);
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
  catalogue()?.preload(stage.id);
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
   const imageUrl=s.imageUrl||catalogue()?.imageFor?.(s.id);
   art.style.backgroundImage=imageUrl?'url("'+imageUrl.replace(/"/g,'%22')+'")':'none';
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
 function previewHero(selector,nameSelector,sourceSelector,slug){
  const target=screen.querySelector(selector),name=screen.querySelector(nameSelector);
  const portraits=window.ZikaFighterLargePortraits||window.ZikaFighterPortraits||{};
  const src=portraits[slug]||root.querySelector(sourceSelector)?.src;
  if(src)target.src=src;else target.removeAttribute('src');
  name.textContent=(slug||'').toUpperCase().replace(/-/g,' ');
 }
 function open(choice={}){
  if(!catalogue())return false;
  stageToken++;active=true;confirming=false;cursor=0;selected=null;
  // Ne jamais masquer les portraits : personnages en haut, stages en bas.
  previewHero('#zf-stage-player1','#zf-stage-name1','#zf-select-preview-1 img',choice.player1||'pascal');
  previewHero('#zf-stage-player2','#zf-stage-name2','#zf-select-preview-2 img',choice.player2||'micka');
  screen.querySelector('#zf-stage-player2-label').textContent=choice.twoPlayers?'2P':'CPU';
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
  stageToken++;active=false;confirming=false;screen.hidden=false;
  screen.classList.remove('zf-stage-active');
  root.classList.remove('zf-stage-phase');
  screen.querySelector('#zf-stage-flight').hidden=true;
  screen.querySelector('#zf-stage-help').textContent='PERSONNAGES 7–7–6 · PUIS CHOIX DU STAGE';
 }
 async function playAirplane(){
  // Extrait SFII_0~4.WAV fourni par l'utilisateur, converti en OGG rétro
  // et publié dans le dépôt. Lecture sur le même bus S.E. que les voix.
  const path='./assets/audio/zika-plane-transition.ogg';
  const audio=window.ZikaArcadeAudio;
  let duration=2.18;
  if(audio?.preloadClip&&audio?.playSample){
    try{
      const buffer=await audio.preloadClip(path);
      if(buffer){
        duration=buffer.duration||duration;
        audio.playSample(buffer);
        await new Promise(done=>setTimeout(done,Math.min(3000,Math.max(350,duration*1000))));
        return;
      }
    }catch(err){console.warn('Zika Fighter : avion non décodable',err)}
  }
  // Repli lorsque WebAudio ne peut pas décoder la version OGG.
  await new Promise(resolve=>{
    const sound=new Audio(path);sound.preload='auto';
    const volume=Number(window.ZikaFighterSettings?.fxVolume??8);
    sound.volume=Math.max(0,Math.min(1,volume/10));
    let done=false;
    const finish=()=>{if(!done){done=true;resolve()}};
    sound.onended=finish;sound.onerror=finish;
    try{const p=sound.play();if(p?.catch)p.catch(finish)}catch(_){finish()}
    setTimeout(finish,3000);
  });
 }
 async function confirm(){
  if(!active||confirming)return;
  const s=list()[cursor];if(!s)return;
  confirming=true;selected=s.id;
  if(window.ZikaFighterCharacterSelect?.playConfirmSound){
    window.ZikaFighterCharacterSelect.playConfirmSound();
  }else window.ZikaFighterMenuSfx?.confirm?.();
  const ownToken=stageToken;
  window.ZikaFighterCharacterSelect?.stopMusic?.();
  window.ZikaFighterBridge?.setStage?.(s.id);
  const flight=screen.querySelector('#zf-stage-flight');
  flight.hidden=false;
  // Laisser entendre le clic de validation avant le bruit d'avion.
  await new Promise(done=>setTimeout(done,220));
  if(!active||stageToken!==ownToken)return;
  await playAirplane();
  if(!active||stageToken!==ownToken)return;
  await catalogue()?.announce(s.id);
  if(!active||stageToken!==ownToken)return;
  active=false;screen.classList.remove('zf-stage-active');root.classList.remove('zf-stage-phase');
  window.ZikaFighterBridge?.start?.();
 }
 document.addEventListener('keydown',event=>{
  if(!active||confirming||window.ZikaFighterScreens?.busy)return;
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
  if(active&&!confirming){
    try{
      const pad=navigator.getGamepads?.()?.find(Boolean);
      if(pad){
        const pressed=i=>!!pad.buttons?.[i]?.pressed;
        const ax=pad.axes?.[0]||0,ay=pad.axes?.[1]||0;
        const dx=pressed(14)||ax<-.6?-1:pressed(15)||ax>.6?1:0;
        const dy=pressed(12)||ay<-.6?-1:pressed(13)||ay>.6?1:0;
        if((dx||dy)&&time-lastPadInputAt>170){lastPadInputAt=time;move(dx,dy)}
        const down=pressed(9)||pressed(0);
        if(down&&!padConfirmDown)confirm();padConfirmDown=down;
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
   getState:()=>({active,confirming,cursor,selected,available:list().length})};
})();
