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
      '<div class="zf-zikacom-official" aria-label="ZIKACOM"><img src="./assets/zikacom-pixel-logo.svg?v=2" alt="" width="280" height="50"></div>',
      '<div class="zf-zikacom-shine" aria-hidden="true"><img src="./assets/zikacom-pixel-logo.svg?v=2" alt="" width="280" height="50"></div>',
      '<button type="button" class="zf-unlock-sound" id="zf-unlock-sound" hidden>ACTIVER LE SON POUR LANCER LE JEU</button>',
      '<p id="zf-sound-error" class="zf-sound-error" hidden>Jingle introuvable : assets/zikacom-intro.mp3</p>',
    '</div>',
    '<div class="zf-screen zf-cinematic" id="zf-cinematic" hidden aria-label="Animation Zika Fighter">',
      '<div class="zf-cine-logo" aria-label="Logo officiel Zika Fighter"><svg class="zf-official-logo" viewBox="0 0 1408 605" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><defs><filter id="zf-key-main" x="-5%" y="-7%" width="110%" height="114%"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2 -0.6 -1.2 0 -0.2" result="colorMask"/><feMorphology in="colorMask" operator="dilate" radius="5" result="fullMask"/><feComposite in="SourceGraphic" in2="fullMask" operator="in"/></filter></defs><image href="./assets/zika-fighter-title.png" width="1408" height="1056" filter="url(#zf-key-main)"/></svg></div>',
      '<div class="zf-cine-shine" aria-hidden="true"><svg class="zf-official-logo" viewBox="0 0 1408 605" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><defs><filter id="zf-key-shine" x="-5%" y="-7%" width="110%" height="114%"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2 -0.6 -1.2 0 -0.2" result="colorMask"/><feMorphology in="colorMask" operator="dilate" radius="5" result="fullMask"/><feComposite in="SourceGraphic" in2="fullMask" operator="in"/></filter></defs><image href="./assets/zika-fighter-title.png" width="1408" height="1056" filter="url(#zf-key-shine)"/></svg></div>',
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
  let cinematicFrame=null;
  const CINEMATIC_LENGTH=2.35;
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
  const visualStartedAt=performance.now();
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function fade(seconds){
    // Séquence ZIKACOM sur fond noir : logo fixe, fondu doux, tenue, fondu de sortie.
    // Le temps est celui du MP3 et non une animation CSS indépendante.
    const rise=clamp((seconds-.52)/.88,0,1);
    const enter=rise*rise*(3-2*rise);
    const fall=clamp((5.05-seconds)/.55,0,1);
    const exit=fall*fall*(3-2*fall);
    const opacity=enter*exit;
    overlay.style.setProperty('--zf-logo-opacity',String(opacity));
    const shine=document.querySelector('.zf-zikacom-shine');
    // Éclat final discret, sans balayage traversant tout l'écran.
    const sparkle=clamp((seconds-4.66)/.18,0,1)*clamp((4.98-seconds)/.15,0,1);
    shine.style.opacity=String(Math.min(.24,sparkle*.24));
    shine.style.clipPath='none';
  }
  function finishCinematic(){
    if(phase!=='cinematic'||closed)return;
    if(cinematicFrame!==null)cancelAnimationFrame(cinematicFrame);
    cinematic.hidden=true;
    title.hidden=false;
    phase='title';
    startButton.focus({preventScroll:true});
  }
  function animateCinematic(startedAt){
    const shine=cinematic.querySelector('.zf-cine-shine');
    const run=(now)=>{
      if(phase!=='cinematic'||closed)return;
      // Temps musical réel lorsque le navigateur autorise la lecture.
      const t=(!titleMusic.paused && titleMusic.currentTime>0)
        ? titleMusic.currentTime
        : Math.max(0,(now-startedAt)/1000);
      const entry=clamp((t-.13)/.74,0,1);
      const eased=1-Math.pow(1-entry,3);
      const scale=.20+.23*eased; // petit logo : 20 à 43 % de sa taille de référence
      const alpha=clamp((t-.10)/.20,0,1);
      cinematic.style.setProperty('--zf-cine-size',String(scale));
      cinematic.style.setProperty('--zf-cine-alpha',String(alpha));
      // Reflet argenté : un balayage étroit sur les lettres, sans éclairer le fond noir.
      const sparkle=clamp((t-1.47)/.32,0,1);
      if(t>=1.47&&t<=1.93){
        const x=-18+134*sparkle;
        shine.style.opacity='1';
        shine.style.clipPath='polygon('+x+'% 0%,'+(x+12)+'% 0%,'+(x-6)+'% 100%,'+(x-18)+'% 100%)';
      }else{shine.style.opacity='0';}
      if(t>=CINEMATIC_LENGTH){finishCinematic();return;}
      cinematicFrame=requestAnimationFrame(run);
    };
    cinematicFrame=requestAnimationFrame(run);
  }
  function showTitle(){
    if(phase!=='splash'||closed)return;
    phase='cinematic';
    cancelAnimationFrame(raf);
    unblock.hidden=true;
    audio.pause();
    splash.hidden=true;
    cinematic.hidden=false;
    titleMusic.currentTime=0;
    // On garde le thème fourni par l'utilisateur dès cette première scène.
    playTitleMusic();
    animateCinematic(performance.now());
  }
  function update(){
    if(phase!=='splash')return;
    // Le fondu n'avance que lorsque le MP3 avance réellement.
    if(status==='playing')fade(audio.currentTime);
    else fade(Math.min(3,(performance.now()-visualStartedAt)/1000));
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
    if(cinematicFrame!==null)cancelAnimationFrame(cinematicFrame);
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