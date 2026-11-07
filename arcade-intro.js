/* Zika Fighter - intro ZIKACOM synchronisée avec le son fourni par l'utilisateur. */
(() => {
  'use strict';
  if (document.getElementById('zf-intro')) return;
  const INTRO_AUDIO = './assets/zikacom-intro.mp3';
  const FALLBACK_MS = 5695;
  const overlay = document.createElement('div');
  overlay.id = 'zf-intro';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label','Introduction Zika Fighter');
  overlay.innerHTML = [
    '<div class="zf-screen zf-splash" id="zf-splash">',
    '<div class="zf-publisher">ZIKACOM</div>',
    '<div class="zf-play-prompt" id="zf-play-prompt">APPUYEZ SUR START POUR ÉCOUTER LE JINGLE</div>',
    '</div>',
    '<div class="zf-screen zf-title" id="zf-title" hidden>',
    '<div class="zf-mark" aria-label="Zika Fighter"><span>ZIKA</span><span>FIGHTER</span></div>',
    '<div class="zf-press" aria-hidden="true">PUSH START</div>',
    '<div class="zf-copyright">© 2027 ZIKACOM<br>ALL RIGHTS RESERVED</div>',
    '<div class="zf-credits">CREDIT 00</div>',
    '<button type="button" id="zf-audio" aria-label="Activer la musique arcade" style="position:absolute;bottom:10%;right:3%;z-index:3;background:#09135a;color:white;border:2px solid #fff;padding:8px 12px;font:700 12px monospace;cursor:pointer">♪ ACTIVER LE SON</button>',
    '<button type="button" id="zf-start" class="zf-start" aria-label="Commencer Zika Fighter et choisir son personnage">COMMENCER</button>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);
  for (const [filename,readyClass] of [
    ['zika-fighter-title.png','zf-title-ready'],
    ['zikacom-splash.png','zf-splash-ready']
  ]) {
    const img = new Image();
    img.onload=()=>{if(img.naturalWidth>0)overlay.classList.add(readyClass);};
    img.src='./assets/'+filename;
  }

  const splash=document.getElementById('zf-splash');
  const title=document.getElementById('zf-title');
  const prompt=document.getElementById('zf-play-prompt');
  const startButton=document.getElementById('zf-start');
  const soundButton=document.getElementById('zf-audio');
  const music=window.ZikaArcadeAudio;
  const intro=new Audio(INTRO_AUDIO);
  intro.preload='auto';
  intro.volume=0.9;
  let phase='ready', closed=false, fallbackTimer=null;
  function clearFallback(){if(fallbackTimer!==null){clearTimeout(fallbackTimer);fallbackTimer=null;}}
  function titleScreen(){
    if(closed || phase==='title')return;
    clearFallback();
    phase='title';
    intro.pause();
    splash.hidden=true;title.hidden=false;
    if(music?.startTitle())soundButton.textContent='♪ SON ACTIVÉ';
    startButton.focus({preventScroll:true});
  }
  intro.addEventListener('ended',titleScreen);
  intro.addEventListener('error',()=>{
    if(phase==='playing'){prompt.textContent='SON INDISPONIBLE — PASSAGE AU TITRE';clearFallback();fallbackTimer=setTimeout(titleScreen,500);}
  });
  function begin(){
    if(closed || phase!=='ready')return;
    phase='playing';
    prompt.textContent='ZIKACOM';
    music?.stop();
    // Le lancement dans un événement utilisateur autorise la lecture sur mobile/PC.
    try{
      const playback=intro.play();
      if(playback&&typeof playback.then==='function'){
        playback.catch(()=>{if(phase==='playing'){prompt.textContent='SON BLOQUÉ — CONTINUER';clearFallback();fallbackTimer=setTimeout(titleScreen,900);}});
      }
    }catch(_){fallbackTimer=setTimeout(titleScreen,900);}
    // Sécurité : si l'événement ended n'arrive pas, on ne bloque pas l'interface.
    fallbackTimer=setTimeout(titleScreen,FALLBACK_MS+1500);
  }
  function launch(){
    if(closed)return;
    if(phase==='ready'){begin();return;}
    if(phase==='playing')return; // Laisser jouer le jingle entièrement.
    closed=true;
    music?.select();
    overlay.classList.add('zf-fade');
    setTimeout(()=>{
      overlay.remove();
      const first=document.querySelector('[data-player]');
      if(first)first.focus({preventScroll:true});
    },390);
  }
  soundButton.addEventListener('click',event=>{
    event.stopPropagation();
    if(music?.startTitle())soundButton.textContent='♪ SON ACTIVÉ';
    else soundButton.textContent='AUDIO NON PRIS EN CHARGE';
  });
  splash.addEventListener('click',begin);
  startButton.addEventListener('click',launch);
  document.addEventListener('keydown',event=>{
    if(closed || !overlay.isConnected || !['Enter','Space','NumpadEnter'].includes(event.code))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(phase==='ready')begin();
    else if(phase==='title')launch();
  },true);
})();