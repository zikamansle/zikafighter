/* Zika Fighter - jingle ZIKACOM automatiquement joué si le moteur l'autorise.
   Le fondu suit audio.currentTime. Un navigateur qui bloque autoplay affiche un déblocage explicite,
   au lieu de sauter silencieusement le jingle. */
(() => {
  'use strict';
  if(document.getElementById('zf-intro')) return;
  const overlay=document.createElement('div');
  overlay.id='zf-intro';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label','Introduction Zika Fighter');
  overlay.innerHTML=[
    '<div class="zf-screen zf-splash" id="zf-splash">',
      '<div class="zf-publisher">ZIKACOM</div>',
      '<div class="zf-logo-entrance" aria-hidden="true"></div>',
      '<button type="button" class="zf-unlock-sound" id="zf-unlock-sound" hidden>ACTIVER LE SON POUR LANCER LE JEU</button>',
      '<p id="zf-sound-error" class="zf-sound-error" hidden>Jingle introuvable : assets/zikacom-intro.mp3</p>',
    '</div>',
    '<div class="zf-screen zf-cinematic" id="zf-cinematic" hidden aria-label="Animation Zika Fighter">',
      '<div class="zf-cine-logo" aria-hidden="true"><span>ZIKA</span><span>FIGHTER</span></div>',
      '<div class="zf-blue-band" aria-hidden="true"><div class="zf-pixel-burst"></div></div>',
    '</div>',
    '<div class="zf-screen zf-title" id="zf-title" hidden>',
      '<div class="zf-mark" aria-label="Zika Fighter"><span>ZIKA</span><span>FIGHTER</span></div>',
      '<div class="zf-press" aria-hidden="true">PUSH START</div>',
      '<div class="zf-copyright">© 2027 ZIKACOM<br>ALL RIGHTS RESERVED</div>',
      '<div class="zf-credits">CREDIT 00</div>',
      '<div class="zf-title-flash" aria-hidden="true"></div>',
      '<button type="button" class="zf-start" id="zf-start" aria-label="Commencer Zika Fighter">COMMENCER</button>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);
  for(const [filename,cls] of [['zikacom-splash.png','zf-splash-ready'],['zika-fighter-title.png','zf-title-ready']]){
    const img=new Image();
    img.onload=()=>{if(img.naturalWidth>0)overlay.classList.add(cls);};
    img.src='./assets/'+filename;
  }
  const splash=document.getElementById('zf-splash');
  const title=document.getElementById('zf-title');
  const cinematic=document.getElementById('zf-cinematic');
  let cinematicTimer=null;
  const startButton=document.getElementById('zf-start');
  const unblock=document.getElementById('zf-unlock-sound');
  const errorText=document.getElementById('zf-sound-error');
  const audio=new Audio('./assets/zikacom-intro.mp3');
  audio.preload='auto';
  audio.autoplay=true;
  audio.load();
  audio.volume=1;
  const music=window.ZikaArcadeAudio;
  const titleMusic=new Audio('./assets/zika-title-theme.mp3');
  titleMusic.preload='auto';
  titleMusic.loop=true;
  titleMusic.volume=0.8;
  let titleMusicAvailable=true;
  titleMusic.addEventListener('error',()=>{titleMusicAvailable=false;});
  function playTitleMusic(){
    if(!titleMusicAvailable)return;
    try{const p=titleMusic.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_){}
  }
  let phase='splash',status='pending',closed=false,raf=0;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function fade(seconds){
    const t=clamp((seconds-.2)/1.85,0,1);
    overlay.style.setProperty('--zf-logo-opacity',String(t*t*(3-2*t)));
  }
  function showTitle(){
    if(phase!=='splash'||closed)return;
    phase='cinematic';
    cancelAnimationFrame(raf);
    unblock.hidden=true;
    audio.pause();
    splash.hidden=true;
    cinematic.hidden=false;
    cinematic.classList.add('zf-cinematic-play');
    // Le thème démarre dès l'introduction du logo et se poursuit au titre.
    playTitleMusic();
    cinematicTimer=window.setTimeout(()=>{
      if(phase!=='cinematic'||closed)return;
      cinematic.hidden=true;
      title.hidden=false;
      phase='title';
      startButton.focus({preventScroll:true});
    },4200);
  }
  function update(){
    if(phase!=='splash')return;
    // Le fondu n'avance que lorsque le MP3 avance réellement.
    if(status==='playing')fade(audio.currentTime);
    if(audio.ended){showTitle();return;}
    raf=requestAnimationFrame(update);
  }
  function attemptPlayback(){
    if(phase!=='splash'||status==='playing')return;
    unblock.hidden=true;
    errorText.hidden=true;
    status='pending';
    // Lorsqu'il est autorisé, cette lecture commence automatiquement au démarrage.
    let promise;
    try{promise=audio.play();}
    catch(err){onFailure(err);return;}
    if(promise&&typeof promise.then==='function'){
      promise.then(()=>{
        if(phase!=='splash')return;
        status='playing';
        unblock.hidden=true;
      }).catch(onFailure);
    }else{
      status=audio.paused?'blocked':'playing';
      unblock.hidden=status==='playing';
    }
  }
  function onFailure(err){
    if(phase!=='splash')return;
    if(err?.name==='NotAllowedError'){
      // Un navigateur ordinaire impose une interaction. Un mode console/kiosque permissif ne l'affiche jamais.
      status='blocked';
      unblock.hidden=false;
      unblock.textContent='ACTIVER LE SON POUR LANCER LE JEU';
    }else{
      status='error';
      errorText.hidden=false;
      unblock.hidden=false;
      unblock.textContent='RÉESSAYER LE JINGLE';
    }
  }
  audio.addEventListener('ended',showTitle);
  audio.addEventListener('error',()=>onFailure(new Error('Jingle indisponible')));
  unblock.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();attemptPlayback();});
  document.addEventListener('keydown',event=>{
    if(phase==='splash'&&status==='blocked'&&['Enter','Space','NumpadEnter'].includes(event.code)){
      event.preventDefault();event.stopImmediatePropagation();attemptPlayback();
    }
  },true);
  function launch(){
    if(phase!=='title'||closed)return;
    closed=true;
    if(cinematicTimer!==null)clearTimeout(cinematicTimer);
    titleMusic.pause();
    titleMusic.currentTime=0;
    music?.select();
    overlay.classList.add('zf-fade');
    setTimeout(()=>{
      overlay.remove();
      document.querySelector('[data-player]')?.focus({preventScroll:true});
    },390);
  }
  startButton.addEventListener('click',launch);
  // Si le navigateur avait bloqué le son, une touche ou un clic sur l'écran-titre peut le déverrouiller.
  document.addEventListener('pointerdown',()=>{if(phase==='title'&&titleMusic.paused)playTitleMusic();},{capture:true});
  document.addEventListener('keydown',event=>{
    if(phase!=='title'||closed||!overlay.isConnected)return;
    if(['Enter','Space','NumpadEnter'].includes(event.code)){
      event.preventDefault();event.stopImmediatePropagation();launch();
    }
  },true);
  fade(0);
  raf=requestAnimationFrame(update);
  // Réessayer automatiquement au retour sur l'application (sans remplacer l'interaction exigée par certains navigateurs).
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && phase==='splash' && status==='blocked')attemptPlayback();
  });
  window.addEventListener('pageshow',()=>{
    if(phase==='splash' && status==='blocked')attemptPlayback();
  });
  attemptPlayback();
})();