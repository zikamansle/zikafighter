/* Zika Fighter : choix d'arène APRÈS la validation des combattants. */
(()=>{'use strict';
 const root=document.getElementById('select');
 if(!root||root.querySelector('#zf-stage-screen'))return;
 const catalogue=()=>window.ZikaFighterStages;
 const screen=document.createElement('section');
 screen.id='zf-stage-screen';screen.hidden=true;
 screen.setAttribute('aria-label',"Choix de l'arène");
 screen.innerHTML=[
  '<h2 class="zf-stage-heading">STAGE SELECT</h2>',
  '<div class="zf-stage-heroes">',
    '<div class="zf-stage-hero"><b>1P</b><img id="zf-stage-player1" alt=""><span id="zf-stage-name1"></span></div>',
    '<div class="zf-stage-feature"><div class="zf-stage-image" id="zf-stage-image"></div><strong id="zf-stage-title"></strong></div>',
    '<div class="zf-stage-hero zf-stage-hero-right"><b id="zf-stage-player2-label">CPU</b><img id="zf-stage-player2" alt=""><span id="zf-stage-name2"></span></div>',
  '</div>',
  '<div class="zf-stage-grid" id="zf-stage-grid" role="group" aria-label="Arènes disponibles"></div>',
  '<div class="zf-stage-help" id="zf-stage-help">FLÈCHES : CHOISIR · START : VALIDER</div>',
  '<div class="zf-stage-flight" id="zf-stage-flight" hidden><span>STAGE APPROACH</span><strong id="zf-stage-flight-name"></strong><div class="zf-stage-airplane" aria-hidden="true">✈</div></div>'
 ].join('');
 root.appendChild(screen);
 const grid=screen.querySelector('#zf-stage-grid');
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
  imgPreview(catalogue()?.imageFor(stage.id));
  for(const node of grid.children)node.classList.toggle('current',Number(node.dataset.pos)===cursor);
  catalogue()?.preload(stage.id);
 }
 function fillGrid(){
  grid.replaceChildren();
  list().forEach((s,index)=>{
   const button=document.createElement('button');button.type='button';
   button.className='zf-stage-slot';button.dataset.pos=String(index);
   const title=document.createElement('span');title.className='zf-stage-slot-title';title.textContent=s.name;
   const art=document.createElement('img');
   art.alt='';art.loading='lazy';
   art.src=catalogue().imageFor(s.id);
   art.onerror=()=>{art.remove();button.classList.add('no-art')};
   button.append(art,title);
   button.addEventListener('click',()=>{
    if(!active||confirming)return;
    if(index===cursor)confirm();
    else choose(index);
   });
   grid.appendChild(button);
  });
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
  const n=list().length;if(!n)return;
  const col=5,row=Math.floor(cursor/col),x=cursor%col;
  let next=((row+dy+Math.ceil(n/col))%Math.ceil(n/col))*col+(x+dx+col)%col;
  if(next>=n)next=n-1;
  choose(next);
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
  const gridSource=root.querySelector('.zf-select-cabinet');if(gridSource)gridSource.hidden=true;
  previewHero('#zf-stage-player1','#zf-stage-name1','#zf-select-preview-1 img',choice.player1||'pascal');
  previewHero('#zf-stage-player2','#zf-stage-name2','#zf-select-preview-2 img',choice.player2||'micka');
  screen.querySelector('#zf-stage-player2-label').textContent=choice.twoPlayers?'2P':'CPU';
  screen.querySelector('#zf-stage-flight').hidden=true;
  screen.hidden=false;root.hidden=false;
  root.classList.add('zf-stage-phase');
  fillGrid();draw();
  grid.children[0]?.focus({preventScroll:true});
  return true;
 }
 function close(){
  stageToken++;active=false;confirming=false;screen.hidden=true;
  root.classList.remove('zf-stage-phase');
  const gridSource=root.querySelector('.zf-select-cabinet');if(gridSource)gridSource.hidden=false;
 }
 function playAirplane(){
  // Réutilise le WAV d'avion lorsque le fichier est présent dans assets/audio.
  // Le bruitage est distinct de la voix, et suit le même réglage S.E.
  return new Promise(resolve=>{
    const sound=new Audio('./assets/audio/SFII_0~4.WAV');
    sound.preload='auto';
    const volume=Number(window.ZikaFighterSettings?.fxVolume??8);
    sound.volume=Math.max(0,Math.min(1,volume/10));
    let settled=false;
    const done=()=>{if(!settled){settled=true;resolve()}};
    sound.onended=done;sound.onerror=done;
    try{const p=sound.play();if(p?.catch)p.catch(done)}catch(_){done()}
    // L'annonce ne doit pas rester bloquée en cas d'absence de média.
    setTimeout(done,3000);
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
  await playAirplane();
  if(!active||stageToken!==ownToken)return;
  await catalogue()?.announce(s.id);
  if(!active||stageToken!==ownToken)return;
  active=false;screen.hidden=true;root.classList.remove('zf-stage-phase');
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
 window.ZikaFighterStageSelect={open,close,move,choose,confirm,
   getState:()=>({active,confirming,cursor,selected,available:list().length})};
})();
