/* Intro ZIKACOM : démarrage automatique + animation synchronisée sur le MP3.
   Le son automatique exige un runtime console autorisant l'autoplay;
   sur navigateur verrouillé, l'animation reste automatique et un geste utilisateur déverrouille l'audio. */
(() => {
  'use strict';
  if (document.getElementById('zf-intro')) return;
  const AUDIO_SRC='./assets/zikacom-intro.mp3';
  const NOMINAL_DURATION=5.695; // secondes, source MP3 fournie
  const overlay=document.createElement('div');
  overlay.id='zf-intro';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label','Introduction Zika Fighter');
  overlay.innerHTML=[
    '<div class="zf-screen zf-splash" id="zf-splash">',
      '<div class="zf-publisher">ZIKACOM</div>',
      '<div class="zf-logo-entrance" aria-hidden="true"></div>',
    '</div>',
    '<div class="zf-screen zf-title" id="zf-title" hidden>',
      '<div class="zf-mark" aria-label="Zika Fighter"><span>ZIKA</span><span>FIGHTER</span></div>',
      '<div class="zf-press" aria-hidden="true">PUSH START</div>',
      '<div class="zf-copyright">© 2027 ZIKACOM<br>ALL RIGHTS RESERVED</div>',
      '<div class="zf-credits">CREDIT 00</div>',
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
  const startButton=document.getElementById('zf-start');
  const player=new Audio(AUDIO_SRC);
  player.preload='auto';
  player.volume=1;
  player.loop=false;
  let phase='splash',closed=false,raf=0,startedAt=performance.now(),hasSound=false;
  let duration=NOMINAL_DURATION;
  const music=window.ZikaArcadeAudio;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

  function revealAt(seconds){
    // Fondu CAPCOM : logo invisible au départ, apparition douce sur les notes,
    // maintien net jusqu'à la fin du jingle. Aucun zoom, volet ni balayage.
    const fade=clamp((seconds-0.20)/1.85,0,1);
    const smooth=fade*fade*(3-2*fade);
    overlay.style.setProperty('--zf-logo-opacity',String(smooth));
  }
  function showTitle(){
    if(closed||phase!=='splash')return;
    phase='title';
    cancelAnimationFrame(raf);
    player.pause();
    splash.hidden=true;
    title.hidden=false;
    if(hasSound)music?.startTitle();
    startButton.focus({preventScroll:true});
  }
  function frame(now){
    if(phase!=='splash')return;
    const elapsed=(now-startedAt)/1000;
    // Si le son est autorisé, son temps réel pilote l'animation.
    const position=(hasSound&&!player.paused)?player.currentTime:elapsed;
    revealAt(position);
    // La fin réelle du MP3 est prioritaire; durée connue pour le mode sans son.
    if(!hasSound&&elapsed>=duration) {showTitle();return;}
    if(hasSound&&player.ended){showTitle();return;}
    // Protection contre média qui ne démarre ou ne se termine jamais.
    if(elapsed>Math.max(duration+2,12)){showTitle();return;}
    raf=requestAnimationFrame(frame);
  }
  function tryAudio(){
    if(phase!=='splash'||closed)return;
    try {
      const result=player.play();
      if(result&&typeof result.then==='function'){
        result.then(()=>{hasSound=true;}).catch(()=>{hasSound=false;});
      } else hasSound=!player.paused;
    }catch(_){hasSound=false;}
  }
  player.addEventListener('loadedmetadata',()=>{
    if(Number.isFinite(player.duration)&&player.duration>0&&player.duration<30) duration=player.duration;
  });
  player.addEventListener('ended',showTitle);
  player.addEventListener('error',()=>{hasSound=false;});
  function unlockOnGesture(){
    if(phase==='splash'&&!hasSound&&player.paused){
      // Un navigateur peut exiger ce geste. Sur console configurée, rien à faire.
      const seconds=(performance.now()-startedAt)/1000;
      if(seconds<duration-.15){
        player.currentTime=Math.min(seconds,Math.max(0,(player.duration||duration)-.2));
        tryAudio();
      }
    }
  }
  document.addEventListener('pointerdown',unlockOnGesture,{capture:true});
  document.addEventListener('keydown',unlockOnGesture,{capture:true});
  function launch(){
    if(phase==='splash')return; // l'introduction se termine seule
    if(closed)return;
    closed=true;
    music?.select();
    overlay.classList.add('zf-fade');
    setTimeout(()=>{
      overlay.remove();
      document.querySelector('[data-player]')?.focus({preventScroll:true});
    },390);
  }
  startButton.addEventListener('click',launch);
  document.addEventListener('keydown',event=>{
    if(closed||!overlay.isConnected||phase!=='title')return;
    if(['Enter','Space','NumpadEnter'].includes(event.code)){
      event.preventDefault();event.stopImmediatePropagation();launch();
    }
  },true);
  // Démarrage sans interaction dès le chargement de l'interface.
  startedAt=performance.now();
  revealAt(0);
  raf=requestAnimationFrame(frame);
  tryAudio();
})();