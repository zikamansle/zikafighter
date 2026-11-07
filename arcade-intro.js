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
    '<div class="zf-screen zf-legal" id="zf-legal" aria-label="Crédits de lancement ZIKAPCOM">',
      '<canvas id="zf-legal-canvas" width="1280" height="960" aria-hidden="true"></canvas>',
    '</div>',
    '<div class="zf-screen zf-splash" id="zf-splash" hidden>',
      '<div class="zf-zikacom-official" aria-label="ZIKAPCOM"><img id="zf-zikapcom-logo" src="./assets/zikapcom-logo.png" alt="ZIKAPCOM"></div>',
      '<div class="zf-zikacom-shine" aria-hidden="true"><img src="./assets/zikapcom-logo.png" alt=""></div>',
      '<button type="button" class="zf-unlock-sound" id="zf-unlock-sound" hidden>ACTIVER LE SON POUR LANCER LE JEU</button>',
      '<p id="zf-sound-error" class="zf-sound-error" hidden>Jingle introuvable : assets/zikacom-intro.mp3</p>',
    '</div>',
    '<div class="zf-screen zf-cinematic" id="zf-cinematic" hidden aria-label="Animation du titre Zika Fighter">',
      '<canvas id="zf-cinematic-canvas" width="640" height="360" aria-hidden="true"></canvas>',
    '</div>',
    '<div class="zf-screen zf-title" id="zf-title" hidden>',
      '<canvas id="zf-title-canvas" width="640" height="360" aria-hidden="true"></canvas>',
      '<button type="button" class="zf-start" id="zf-start" aria-label="Menu du jeu">MENU</button>',
    '</div>',
    '<div class="zf-screen zf-options" id="zf-options" hidden aria-label="Option Mode">',
      '<canvas id="zf-options-canvas" width="1280" height="960" aria-label="Options de Zika Fighter"></canvas>',
      '<button type="button" class="zf-options-back" id="zf-options-back" aria-label="Retour aux titres">RETOUR</button>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);
  const zikapcomLogo=document.getElementById('zf-zikapcom-logo');
  zikapcomLogo.addEventListener('error',()=>{
    // Text fallback until approved PNG is added to assets.
    overlay.classList.add('zf-zikapcom-fallback');
  });
  for(const [filename,cls] of [['zikacom-splash.png','zf-splash-ready'],['zika-fighter-title.png','zf-title-ready']]){
    const img=new Image();
    img.onload=()=>{if(img.naturalWidth>0)overlay.classList.add(cls);};
    img.src='./assets/'+filename;
  }
  // Animation par palette de pixels : seuls les tons or changent, pas les contours bleus.
  const logoImage=document.getElementById('zf-zikapcom-logo');
  let paletteCanvas=null,paletteCtx=null,paletteBase=null,paletteRendered=false;
  function preparePalette(){
    try{
      const source=document.createElement('canvas');
      const scale=Math.min(1,700/logoImage.naturalWidth);
      source.width=Math.max(1,Math.round(logoImage.naturalWidth*scale));
      source.height=Math.max(1,Math.round(logoImage.naturalHeight*scale));
      const ctx=source.getContext('2d',{willReadFrequently:true});
      if(!ctx)return;
      ctx.drawImage(logoImage,0,0,source.width,source.height);
      const raw=ctx.getImageData(0,0,source.width,source.height);
      // Recadrage du logo sur ses pixels colorés pour éviter les grandes marges noires du PNG.
      let x0=source.width,y0=source.height,x1=0,y1=0;
      for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
        const p=(y*source.width+x)*4;
        if(raw.data[p+3]>90&&Math.max(raw.data[p],raw.data[p+1],raw.data[p+2])>75){
          x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        }
      }
      if(x1<=x0||y1<=y0)return;
      const pad=5,w=x1-x0+1+pad*2,h=y1-y0+1+pad*2;
      paletteCanvas=document.createElement('canvas');
      paletteCanvas.width=w;paletteCanvas.height=h;
      paletteCanvas.className='zf-palette-canvas';
      paletteCtx=paletteCanvas.getContext('2d',{willReadFrequently:true});
      if(!paletteCtx){paletteCanvas=null;return;}
      paletteCtx.drawImage(source,x0-pad,y0-pad,w,h,0,0,w,h);
      paletteBase=paletteCtx.getImageData(0,0,w,h);
      // Supprimer seulement les pixels noirs du fond. Garder les contours bleus.
      for(let p=0;p<paletteBase.data.length;p+=4){
        const r=paletteBase.data[p],g=paletteBase.data[p+1],b=paletteBase.data[p+2];
        if(Math.max(r,g,b)<25)paletteBase.data[p+3]=0;
      }
      paletteCtx.putImageData(paletteBase,0,0);
      logoImage.hidden=true;
      logoImage.parentElement.appendChild(paletteCanvas);
      document.querySelector('.zf-zikacom-shine').style.display='none';
      overlay.classList.add('zf-palette-ready');
    }catch(err){paletteCanvas=null;paletteCtx=null;paletteBase=null;}
  }
  if(logoImage.complete&&logoImage.naturalWidth)preparePalette();
  else logoImage.addEventListener('load',preparePalette,{once:true});
  function renderPalette(t){
    if(!paletteCtx||!paletteBase)return;
    const active=t>=2.46&&t<=3.03;
    if(!active&&paletteRendered===false)return;
    paletteRendered=active;
    const out=new ImageData(new Uint8ClampedArray(paletteBase.data),paletteBase.width,paletteBase.height);
    if(active){
      const progress=(t-2.46)/.57;
      const travel=progress<.5?progress*2:(1-progress)*2;
      const eased=travel*travel*(3-2*travel);
      const center=.93-.86*eased;
      for(let y=0;y<out.height;y++){
        const distance=Math.abs((y+.5)/out.height-center);
        const stripe=Math.exp(-Math.pow(distance/.20,2));
        for(let x=0;x<out.width;x++){
          const p=(y*out.width+x)*4;
          const r=paletteBase.data[p],g=paletteBase.data[p+1],b=paletteBase.data[p+2];
          if(r>95&&g>60&&r>b*1.45&&g>b*1.3){
            const a=stripe*.90;
            const targetR=255,targetG=248,targetB=185;
            out.data[p]=r+(targetR-r)*a;
            out.data[p+1]=g+(targetG-g)*a;
            out.data[p+2]=b+(targetB-b)*a;
          }
        }
      }
    }
    paletteCtx.putImageData(out,0,0);
  }
  const legal=document.getElementById('zf-legal');
  const legalCanvas=document.getElementById('zf-legal-canvas');
  const legalCtx=legalCanvas.getContext('2d',{alpha:false});
  const approvedLegal=new Image();
  approvedLegal.src='./assets/approved-legal.svg?v=1';
  approvedLegal.addEventListener('load',()=>{if(phase==='legal')drawLegalFrame((performance.now()-legalStartedAt)/1000);});
  const splash=document.getElementById('zf-splash');
  const title=document.getElementById('zf-title');
  const optionsScreen=document.getElementById('zf-options');
  const optionsCanvas=document.getElementById('zf-options-canvas');
  const optionsCtx=optionsCanvas.getContext('2d',{alpha:false});
  const approvedOptions=new Image();
  approvedOptions.src='./assets/approved-options.svg?v=1';
  approvedOptions.addEventListener('load',()=>{if(phase==='options')renderOptions();});
  const optionsBack=document.getElementById('zf-options-back');
  const titleCanvas=document.getElementById('zf-title-canvas');
  const titleCtx=titleCanvas.getContext('2d',{alpha:false});
  const OPTIONS_STORAGE_KEY='zikafighter-options-v2';
  const defaultSettings={difficulty:4,timeLimit:true,players:1,controlPreset:0,stereo:true,musicTest:10,seTest:0,musicVolume:7,fxVolume:8,turbo:3};
  let settings={...defaultSettings};
  try{
    const saved=JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY)||'null');
    if(saved&&typeof saved==='object'){
      for(const key of Object.keys(defaultSettings)){
        if(typeof saved[key]===typeof defaultSettings[key])settings[key]=saved[key];
      }
    }
  }catch(_){}
  const persistSettings=()=>{
    try{localStorage.setItem(OPTIONS_STORAGE_KEY,JSON.stringify(settings));}catch(_){}
    window.ZikaFighterSettings={...settings};
    window.dispatchEvent(new CustomEvent('zika:settings-changed',{detail:{...settings}}));
  };
  persistSettings();
  let titleSelection=0,optionSelection=0,optionsFrame=0;
  let musicTestAudio=null;

  let titleFrame=0;
  const cinematic=document.getElementById('zf-cinematic');
  let cinematicFrame=null;
  let titleVisualStartedAt=0;
  const CINEMATIC_LENGTH=3.49;
  const startButton=document.getElementById('zf-start');
  const unblock=document.getElementById('zf-unlock-sound');
  const errorText=document.getElementById('zf-sound-error');
  const audio=new Audio('./assets/zikacom-intro.mp3');
  audio.preload='auto';
  audio.load();
  audio.volume=.95*Math.max(0,Math.min(10,settings.musicVolume))/10;
  window.addEventListener('zika:settings-changed',event=>{
    audio.volume=.95*Math.max(0,Math.min(10,event.detail.musicVolume))/10;
  });
  const music=window.ZikaArcadeAudio;
  // Déplacement : bruitage WAV fourni par l'utilisateur, compressé en MP3 pour le web.
  const cursorMoveSound=new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYxLjcuMTAzAAAAAAAAAAAAAAD/81jAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAFxAArKysrKzg4ODg4OEREREREUVFRUVFRXV1dXV1qampqamp2dnZ2doODg4ODg4+Pj4+PnJycnJycqKioqKiotbW1tbXBwcHBwcHOzs7Oztra2tra2ufn5+fn8/Pz8/Pz//////8AAAAATGF2YzYxLjE5AAAAAAAAAAAAAAAAJAP3AAAAAAAABcRZB7PMAAAAAAAAAAAAAAD/8yjEAAo4BeIWAEYAZBUogTRgW84kvKEzFqnBg+soMOH9/Hvz//OJR//3nP//9JD9+cP6ZBYEgLGEEPaiIK7ZC1ePvp6im1//8yjEEgnIAgFMCEQA5DFmuT9SPp/7f/+kPIf9rHD63izlVRU5EWXHiiirJ19s7nbavjHCjXlJAXsDQtZK9db21foFhOinuT//8yjEJQvQBgFFQBAAs/2q2ue98IIJBVXwAkBu7sG+Ke6AOwA3+Wi8QQPTAICACifJxFMrgepcDUGIwEBvsm9xnSHDNE6Xv3v/8yjEMBbSXpgBjaAA8fRFSsRInSJ/6kDTkkPAYrBEEK5o3//6aHN1LR////UtFInD+3//yjRVRNVxytgOMIaXgAJEeKLJPRT/8yjEDxDq+tpfzWgCVIospKijWj6yVBMkq30f62f+Owoo////RE1Fqj///+S5Cd////ULIt////iAHUf///ojFPJBxxAOKEX/8yjEBg3a9tZeUNoykoAKf8IqEsUcm5Z1CEB9+6HTs67pfyc3tt9f/zAo///9fK3////kmUv///5s////85VS22AWuiiwABD/8yjECQ6pStpeQwR0PD1aso1HieZabWRPLU20fUjcgwX76nULjj1bKR2cyp8EL6Klmqln/8WNY7///1k//0KBgQEAQuAAyGr/8yjECQ8C+qkemCgSWpeo6DWqCJMXUuktSCaH/+bDF////TFmiaf///WoO8V7///+sXaH///5wN0V0v///yBqAEggCyAHd4D/8yjECA6q+rZeoA+gKj/3QXV3NOtAzBoxFGRfrf6zNJatD5Hkl////FoHl+jckMr1f//+MFv///4LyX///8stAPACqgGL4Az/8yjECA2S9rG+oA+gH/6qrJ9egZggSjQfVR76SC6SF/j+bft6//1CnL7fEJyt///8Vf///41b//9fx5UEAiCiATF//X2fWtH/8yjEDAzCjpz0oAWgUaF8BzUHGDZFWzrUnqZrqr+Rrf/v/9AV4b//Vv///4sf///+C//rBAcACmgAYKm//r2qzVwKRB2TYur/8yjEFAyKjpz+mAug2dJa7aCkKnv8xPf///eOsemf+IN////CP///+Dj0qgA2C5ahtgA3//rSd3IQhO+9un27LJA+OnI90+3/8yjEHAwijsm+UA+i/8R37LZYmf//v288JBad///7KBFqcE26/vAA7///KYwiUICij6GWtJUMrqyOtAoMXdW3te3/UIjtHWn/8yjEJgyqjqx+K0rgT//3f///+Ev///8QLQA4BdvhdgAN2RjjzbqwVgOtfOU1WOmo6sbf4lEqOrHTUZJt1+yOawkApd/9f///8yjELgxhSqW+EBQMD//5ZQULRdvAB0GAaGN/6CCCDf0Cp////0A+EBBm9NBBBBBBv9BBH/6aaaaf00000xBTQEHf+tUJQUn/8yjENwzSIsB+AprGAAJ/n/W1rWjPnymEmOEFQVBUFQafiYGg7+z/BkNAqCrvg0DWWBoGg75YS5Y9//IqKEH/////xUWaaWL/8yjEPgyYcnw+CB5En/8V////+LC7DISFhURmRguIRUVEdUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8yjERggYASQMAES4VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');
  cursorMoveSound.preload='auto';
  cursorMoveSound.volume=1;
  cursorMoveSound.load();
  // Validation fournie par l'utilisateur (WAV original converti en MP3 compact).
  const cursorConfirmSound=new Audio('data:audio/mpeg;base64,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');
  cursorConfirmSound.preload='auto';
  cursorConfirmSound.volume=1;
  cursorConfirmSound.load();
  // Soundbank decoded before any interaction. At key/button press we resume
  // the WebAudio context and trigger an AudioBufferSourceNode immediately.
  // This avoids HTMLAudioElement .play() races and hidden media-element gains.
  const MenuAC=window.AudioContext||window.webkitAudioContext;
  let menuContext=null;
  const menuBuffers={move:null,confirm:null};
  const menuPending={move:null,confirm:null};
  const menuMedia={move:cursorMoveSound,confirm:cursorConfirmSound};
  window.ZikaMenuAudioState={movePlays:0,confirmPlays:0,lastError:null,moveReady:false,confirmReady:false};
  function prepareMenuSfx(){
    if(!MenuAC)return;
    if(!menuContext){
      try{
        menuContext=new MenuAC();
        for(const kind of ['move','confirm']){
          const url=menuMedia[kind].src;
          const encoded=url.split(',')[1];
          const binary=atob(encoded);
          const data=new Uint8Array(binary.length);
          for(let i=0;i<binary.length;i++)data[i]=binary.charCodeAt(i);
          menuPending[kind]=menuContext.decodeAudioData(data.buffer).then(buffer=>{
            menuBuffers[kind]=buffer;
            window.ZikaMenuAudioState[kind+'Ready']=true;
            return buffer;
          }).catch(err=>{
            window.ZikaMenuAudioState.lastError=String(err);
            console.warn('Zika Fighter : décodage du WAV du menu',kind,err);
            return null;
          });
        }
      }catch(err){window.ZikaMenuAudioState.lastError=String(err);}
    }
    if(menuContext&&menuContext.state==='suspended'){
      const p=menuContext.resume();
      if(p&&p.catch)p.catch(err=>{window.ZikaMenuAudioState.lastError=String(err);});
    }
  }
  function playMenuSfx(kind){
    prepareMenuSfx();
    window.ZikaMenuAudioState[kind+'Plays']++;
    const context=menuContext;
    const playBuffer=(buffer)=>{
      if(!context||!buffer)return;
      try{
        const source=context.createBufferSource();
        const gain=context.createGain();
        source.buffer=buffer;
        gain.gain.value=(kind==='move'?9:6.5)*(Math.max(0,Math.min(10,settings.fxVolume))/10);
        source.connect(gain);gain.connect(context.destination);
        source.start(context.currentTime);
      }catch(err){
        window.ZikaMenuAudioState.lastError=String(err);
        console.warn('Zika Fighter : lecture audio du menu',kind,err);
      }
    };
    if(context){
      const decoded=menuBuffers[kind] ? Promise.resolve(menuBuffers[kind]) : menuPending[kind];
      const resumed=context.state==='running'?Promise.resolve():context.resume();
      Promise.all([decoded,resumed]).then(([buffer])=>{
        if(buffer&&context.state==='running')playBuffer(buffer);
        else window.ZikaMenuAudioState.lastError='Contexte audio non activé';
      }).catch(err=>{
        window.ZikaMenuAudioState.lastError=String(err);
        console.warn('Zika Fighter : impossible d’activer le son',err);
      });
    }else{
      // Fallback direct if WebAudio is unavailable.
      const el=menuMedia[kind];
      try{el.currentTime=0;const p=el.play();
        if(p&&p.catch)p.catch(e=>{window.ZikaMenuAudioState.lastError=String(e);});
      }catch(e){window.ZikaMenuAudioState.lastError=String(e);}
    }
  }
  let cursorSoundAt=0;
  function cursorMove(){
    const now=performance.now();
    if(now-cursorSoundAt<65)return;
    cursorSoundAt=now;
    playMenuSfx('move');
  }
  function cursorConfirm(){playMenuSfx('confirm');}
  // Pre-decode on load; playback only starts on user menu input.
  prepareMenuSfx();
  let lastTitleNav=null,lastOptionsNav=null;
  const titleMusic=new Audio('./assets/zika-title-theme.mp3');
  titleMusic.preload='auto';
  titleMusic.loop=true;
  titleMusic.volume=.70*Math.max(0,Math.min(10,settings.musicVolume))/10;
  window.addEventListener('zika:settings-changed',event=>{
    titleMusic.volume=.70*Math.max(0,Math.min(10,event.detail.musicVolume))/10;
    if(musicTestAudio)musicTestAudio.volume=.70*Math.max(0,Math.min(10,event.detail.musicVolume))/10;
  });
  // Décalage établi par comparaison spectrale avec la vidéo de référence :
  // le thème MP3 est avancé de 0.64 s par rapport aux images du titre.
  const TITLE_MUSIC_OFFSET=0.64;
  let titleMusicAvailable=true;
  titleMusic.addEventListener('error',()=>{titleMusicAvailable=false;});
  function playTitleMusic(){
    if(!titleMusicAvailable)return;
    try{const p=titleMusic.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_){}
  }
  let phase='legal',status='pending',closed=false,raf=0;
  let visualStartedAt=0;
  const legalStartedAt=performance.now();
  let legalFrame=0;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function fade(seconds){
    const smooth=n=>{const t=clamp(n,0,1);return t*t*(3-2*t)};
    const entrance=smooth((seconds-.45)/.9);
    const departure=1-smooth((seconds-3.15)/.67);
    overlay.style.setProperty('--zf-logo-opacity',String(entrance*departure));
    // Palette métallique réelle : or -> jaune clair -> or, par hauteur des pixels.
    renderPalette(seconds);
    const shine=document.querySelector('.zf-zikacom-shine');
    shine.style.opacity='0';
    overlay.style.setProperty('--zf-palette-pulse','0');
  }
  // Séquence observée à 30 fps dans la vidéo fournie :
  // 0-1.2 petit logo ; 1.25-2.16 très grand lettrage rouge/or/ivoire défilant ;
  // 2.3-3.16 pixels jaune/rose tournant sur une bande bleue ;
  // 3.28-3.62 titre stabilisé et sous-titre rouge.
  // Le rendu de l'introduction ZIKAPCOM précédente reste entièrement indépendant.
  const movie=document.getElementById('zf-cinematic-canvas');
  const mctx=movie.getContext('2d',{alpha:false});
  const titleSprite=new Image();
  titleSprite.src='./assets/zika-fighter-title.png';
  let titleSpriteCanvas=null, mosaic=null, giantLetters=null, coarseSprites=[], legalPinkSprite=null;
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  function prepareTitleSprite(){
    try{
      const src=makeCanvas(480,240),cx=src.getContext('2d',{willReadFrequently:true});
      // Ne découper QUE les deux lignes du vrai logo (sans PUSH START).
      cx.imageSmoothingQuality='high';
      cx.drawImage(titleSprite,125,40,1200,570,0,0,480,240);
      const pixels=cx.getImageData(0,0,480,240);
      for(let p=0;p<pixels.data.length;p+=4){
        const r=pixels.data[p],g=pixels.data[p+1],b=pixels.data[p+2];
        const isBlue=(b>45&&b>r*1.25&&b>g*1.22);
        if(isBlue)pixels.data[p+3]=0;
      }
      // Référence SNES : les zones rouges du logo tirent vers le rose-magenta.
      // On conserve l'or, le jaune, les contours noirs et le logo validé d'origine.
      for(let p=0;p<pixels.data.length;p+=4){
        const r=pixels.data[p],g=pixels.data[p+1],b=pixels.data[p+2];
        if(pixels.data[p+3]<40)continue;
        const redness=r-g;
        if(r>110&&redness>48&&r>b*1.3){
          const transition=Math.min(1,Math.max(0,(redness-48)/125));
          pixels.data[p]=Math.min(255,r+6*transition);
          pixels.data[p+1]=g*(1-.32*transition)+43*transition;
          pixels.data[p+2]=b+(166-b)*transition;
        }
      }
      cx.putImageData(pixels,0,0);titleSpriteCanvas=src;
      // Version magenta du logo officiel pour l'apparition PARTIELLE en bas
      // de l'écran de crédits SNES, sans police de substitution.
      legalPinkSprite=makeCanvas(480,240);
      const pc=legalPinkSprite.getContext('2d');
      pc.drawImage(src,0,0);
      pc.globalCompositeOperation='source-in';
      pc.fillStyle='#d64aa7';
      pc.fillRect(0,0,480,240);
      pc.globalCompositeOperation='source-over';
      if(phase==='options')renderOptions();
      if(phase==='legal-preview')drawLegalFrame(1.5);
      const sm=makeCanvas(144,72),sc=sm.getContext('2d',{willReadFrequently:true});
      sc.imageSmoothingEnabled=true;sc.imageSmoothingQuality='high';
      sc.drawImage(src,0,0,144,72);
      mosaic=sc.getImageData(0,0,144,72);
      // Résolutions successives observées : quelques gros blocs,
      // puis un logo de plus en plus détaillé durant la rotation.
      coarseSprites=[[8,5],[14,7],[24,12],[48,24],[96,48]].map(([ww,hh])=>{
        const layer=makeCanvas(ww,hh),layerCtx=layer.getContext('2d');
        layerCtx.imageSmoothingEnabled=true;
        layerCtx.imageSmoothingQuality='high';
        layerCtx.drawImage(src,0,0,ww,hh);
        return layer;
      });
      // La séquence TURBO d'origine affiche de très grandes lettres sans contour,
      // en dégradé rouge -> orange -> jaune -> ivoire.
      giantLetters=makeCanvas(850,150);
      const gc=giantLetters.getContext('2d');
      const gr=gc.createLinearGradient(0,0,0,150);
      gr.addColorStop(0,'#ee1b22');gr.addColorStop(.28,'#fa3e26');
      gr.addColorStop(.55,'#ff9b35');gr.addColorStop(.82,'#ffe75c');gr.addColorStop(1,'#fffbd5');
      gc.font='900 148px Impact,"Arial Black",sans-serif';gc.textBaseline='top';
      gc.fillStyle=gr;gc.fillText('ZIKA',5,-7);
    }catch(_){titleSpriteCanvas=null;mosaic=null;}
  }
  if(titleSprite.complete&&titleSprite.naturalWidth)prepareTitleSprite();
  else titleSprite.addEventListener('load',prepareTitleSprite,{once:true});
  const ease=x=>{const p=clamp(x,0,1);return p*p*(3-2*p);};
  function finishCinematic(){
    if(phase!=='cinematic'||closed)return;
    if(cinematicFrame!==null)cancelAnimationFrame(cinematicFrame);
    cinematic.hidden=true;
    title.hidden=false;
    phase='title';
    titleFrame=requestAnimationFrame(drawTitleFrame);
    startButton.focus({preventScroll:true});
  }
  // L'écran-titre continue au même temps musical ; le thème n'est pas relancé.
  // On reconstruit le fond noir/bande bleue de la capture, et non le PNG entier
  // qui contenait encore ZIKACOM et une inscription PUSH START permanente.
  // Scène titre aux mêmes coordonnées que la fin de la cinématique.
  // Fond : bleu jusqu'à 6.56, éclair vert 6.56–6.92, puis noir.
  // Les mentions du menu n'apparaissent qu'après le logo (vers 6.30).
  function renderTitleFrame(t){
    if(!titleCtx)return;
    const ctx=titleCtx,w=320,h=180;
    ctx.setTransform(2,0,0,2,0,0);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    let band=t<6.55?'#225ab4':t<6.93?'#66c83e':'#000';
    ctx.fillStyle=band;ctx.fillRect(15,15,290,89);
    if(titleSpriteCanvas){
      ctx.drawImage(titleSpriteCanvas,42,6,236,110);
    }else{
      ctx.textAlign='center';ctx.fillStyle='#ffe62a';
      ctx.font='italic bold 34px Impact,sans-serif';ctx.fillText('ZIKA FIGHTER',160,85);
    }
    // Le sous-titre reste au même endroit que sur les captures.
    pixelSerif(ctx,'HYPER FIGHTING',160,122,132,13,17);
    ctx.font='bold 6px "Courier New",monospace';
    ctx.fillStyle='#d99a70';ctx.fillText('© ZIKAPCOM 2027',160,178);
    if(t>=6.28){
      const rows=[145,157,169];
      menuText(ctx,'TURBO '+('★'.repeat(settings.turbo)),150,rows[0],10,titleSelection===0?'#b9b33d':'#aeb0b2');
      menuText(ctx,'NORMAL',150,rows[1],10,titleSelection===1?'#b9b33d':'#b7b7b7');
      menuText(ctx,'OPTIONS',150,rows[2],10,titleSelection===2?'#b9b33d':'#b7b7b7');
      drawZCursor(ctx,116,rows[titleSelection]);
    }
    // Les éclairs sont des changements du FOND, pas des flashes blancs.
    const flicker=(t>=5.82&&t<6.13)?Math.sin(Math.PI*(t-5.82)/.31)*.72:0;
    if(flicker>0){ctx.fillStyle='rgba(0,0,0,'+flicker+')';ctx.fillRect(0,0,w,h);}
    // Le fondu vers le menu/options est déclenché uniquement par START,
    // comme sur la console : il ne doit jamais se produire tout seul.
  }
  function drawTitleFrame(){
    if(phase!=='title'||closed)return;
    // Horloge visuelle continue même lorsque le fichier MP3 boucle.
    // La lecture musicale reste continue, sans relancer le titre.
    const elapsed=Math.max(0,(performance.now()-titleVisualStartedAt)/1000);
    renderTitleFrame(elapsed);
    titleFrame=requestAnimationFrame(drawTitleFrame);
  }

  // Curseur : le Z découpé du lettrage officiel ZIKA, avec ses couleurs.
  function drawZCursor(ctx,x,y){
    if(titleSpriteCanvas){
      ctx.save();ctx.imageSmoothingEnabled=false;
      ctx.drawImage(titleSpriteCanvas,0,0,204,153,x,y-13,18,16);
      ctx.restore();
    }else{
      ctx.font='italic bold 15px Georgia,serif';
      ctx.fillStyle='#ffbc21';ctx.fillText('Z',x,y);
    }
  }
  function menuText(ctx,text,x,y,size=10,color='#b9b9b9',align='left'){
    ctx.save();
    ctx.textAlign=align;
    ctx.font='bold '+size+'px Georgia,"Times New Roman",serif';
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='#17161a';ctx.fillText(text,x+1,y+1);
    ctx.fillStyle=color;ctx.fillText(text,x,y);
    ctx.restore();
  }
  // High-resolution native Canvas: no 260x195 raster stretched to full-screen.
  // Pixel-era serif styling, precise positions and fully dynamic values.
  const optionRows=[52,73,94,114,184,197,210,224,237];
  const musicChoices=[0,1,10]; // only existing recordings
  const effectChoices=['move','confirm','punch','kick','hit','special','ko'];
  function renderOptions(){
    if(!optionsCtx)return;
    const ctx=optionsCtx;
    ctx.setTransform(4,0,0,4,0,0);
    ctx.clearRect(0,0,320,240);
    ctx.fillStyle='#000';ctx.fillRect(0,0,320,240);
    ctx.textBaseline='alphabetic';
    // Only the existing Zika Fighter logotype, dimmed in grayscale.
    if(titleSpriteCanvas){
      ctx.save();
      ctx.globalAlpha=.32;
      ctx.filter='grayscale(1) brightness(.64)';
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(titleSpriteCanvas,35,34,250,140);
      ctx.restore();
    }
    const txt=(value,x,y,size=11,color='#f0f0ef',align='left')=>{
      ctx.save();ctx.font='900 '+size+'px Georgia,"Times New Roman",serif';
      ctx.textAlign=align;ctx.lineJoin='round';ctx.lineWidth=.55;
      ctx.strokeStyle='#211722';ctx.strokeText(value,x+.5,y+.5);
      ctx.fillStyle=color;ctx.fillText(value,x,y);ctx.restore();
    };
    // Small isolated Z, rather than the whole ZikaTeam wordmark.
    const z=(x,y)=>{
      ctx.save();ctx.translate(x,y);
      ctx.beginPath();
      ctx.moveTo(1,1);ctx.bezierCurveTo(5,0,17,-2,19,-4);
      ctx.lineTo(13,1);ctx.lineTo(7,10);
      ctx.bezierCurveTo(12,8,16,9,19,7);
      ctx.lineTo(16,12);ctx.bezierCurveTo(10,17,3,15,-1,18);
      ctx.lineTo(5,13);ctx.lineTo(13,3);
      ctx.bezierCurveTo(8,4,4,6,-1,6);ctx.closePath();
      ctx.strokeStyle='#83418b';ctx.lineWidth=2.1;ctx.lineJoin='round';
      ctx.stroke();ctx.fillStyle='#fff';ctx.fill();ctx.restore();
    };
    const coloredLabel=(label,idx,y,size=11)=>txt(label,25,y,size,optionSelection===idx?'#e44b58':'#f1f0f1');
    txt('OPTION MODE',160,24,20,'#729fee','center');
    txt('EASY',143,40,11);
    txt('HARD',288,40,11,'#f0f0f1','right');
    coloredLabel('DIFFICULTY',0,52,11);
    for(let i=0;i<8;i++)txt('★',157+i*15,54,13,i<settings.difficulty?'#f0e82e':'#64656b','center');
    coloredLabel('TIME LIMIT',1,73);
    txt('YES',164,73,11,settings.timeLimit?'#f0e62a':'#eee','center');
    txt('NO',264,73,11,!settings.timeLimit?'#f0e62a':'#eee','center');
    coloredLabel('CONFIG.',2,94);
    txt('1PLAYER',160,94,11,settings.players===1?'#f0e62a':'#eee','center');
    txt('2PLAYER',264,94,11,settings.players===2?'#f0e62a':'#eee','center');
    coloredLabel('CPS FIGHTER',3,114);
    txt('SET',164,114,11,'#f0e62a','center');txt('SET',267,114,11,'#f0e62a','center');
    const mapping=['Y','X','L','B','A','R'];
    ['L. PUNCH','M. PUNCH','H. PUNCH','L. KICK','M. KICK','H. KICK'].forEach((label,i)=>{
      const y=125+i*9;
      txt(label,45,y,9);
      txt(mapping[(i+settings.controlPreset*2)%6],165,y,10,'#eee','center');
      txt(mapping[i],267,y,10,'#eee','center');
    });
    coloredLabel('STEREO',4,184);
    txt('STEREO',176,184,11,settings.stereo?'#f0e62a':'#eee','center');
    txt('MONAURAL',294,184,11,!settings.stereo?'#f0e62a':'#eee','right');
    coloredLabel('MUSIC VOL',5,197,10);
    coloredLabel('SFX VOL',6,210,10);
    const drawLevel=(val,y)=>{
      for(let i=0;i<10;i++){
        ctx.fillStyle=i<val?'#e9db2c':'#3a3641';
        ctx.fillRect(147+i*10,y-8,8,6);
      }
      txt(String(val).padStart(2,'0'),278,y,10,'#f1e731','center');
    };
    drawLevel(settings.musicVolume,197);
    drawLevel(settings.fxVolume,210);
    coloredLabel('MUSIC TEST',7,224,11);
    txt(String(settings.musicTest).padStart(2,'0'),157,224,12,'#f0e62a','center');
    txt(settings.musicTest===1?'JINGLE':settings.musicTest===10?'TITRE':'STOP',229,224,9,'#ddd','center');
    coloredLabel('S.E. TEST',8,237,11);
    txt(String(settings.seTest).padStart(2,'0'),157,237,12,'#f0e62a','center');
    txt(effectChoices[settings.seTest]?.toUpperCase()||'—',237,237,9,'#ddd','center');
    z(5,optionRows[optionSelection]-15);
  }
  // Test only real tracks and the exact supplied sounds plus implemented game FX.
  function playMusicTest(){
    if(musicTestAudio){musicTestAudio.pause();musicTestAudio.currentTime=0;musicTestAudio=null;}
    if(settings.musicTest===0){if(phase==='options')playTitleMusic();return;}
    const src=settings.musicTest===1?'./assets/zikacom-intro.mp3':
      settings.musicTest===10?'./assets/zika-title-theme.mp3':null;
    if(!src)return;
    titleMusic.pause();
    musicTestAudio=new Audio(src);
    musicTestAudio.volume=.70*Math.max(0,Math.min(10,settings.musicVolume))/10;
    musicTestAudio.addEventListener('ended',()=>{
      musicTestAudio=null;
      if(phase==='options')playTitleMusic();
    },{once:true});
    const p=musicTestAudio.play();
    if(p&&p.catch)p.catch(e=>console.warn('Zika Fighter : MUSIC TEST',e));
  }
  function playSfxTest(){
    const type=effectChoices[settings.seTest];
    if(!type)return;
    if(type==='move')playMenuSfx('move');
    else if(type==='confirm')playMenuSfx('confirm');
    else window.ZikaArcadeAudio?.playEffect(type);
  }
  function adjustOption(direction){
    const before=JSON.stringify(settings);
    const d=direction<0?-1:1;
    switch(optionSelection){
      case 0:settings.difficulty=clamp(settings.difficulty+d,1,8);break;
      case 1:settings.timeLimit=!settings.timeLimit;break;
      case 2:settings.players=settings.players===1?2:1;break;
      case 3:settings.controlPreset=(settings.controlPreset+d+3)%3;break;
      case 4:settings.stereo=!settings.stereo;break;
      case 5:settings.musicVolume=clamp(settings.musicVolume+d,0,10);break;
      case 6:settings.fxVolume=clamp(settings.fxVolume+d,0,10);break;
      case 7:{
        const i=Math.max(0,musicChoices.indexOf(settings.musicTest));
        settings.musicTest=musicChoices[(i+d+musicChoices.length)%musicChoices.length];
        break;
      }
      case 8:settings.seTest=(settings.seTest+d+effectChoices.length)%effectChoices.length;break;
    }
    if(before!==JSON.stringify(settings))cursorMove();
    persistSettings();renderOptions();
  }
  function openOptions(){
    if(phase!=='title')return;
    if(titleFrame)cancelAnimationFrame(titleFrame);
    phase='options';
    title.hidden=true;optionsScreen.hidden=false;
    optionSelection=0;optionsBack.focus({preventScroll:true});
    renderOptions();
  }
  function closeOptions(){
    if(phase!=='options')return;
    if(musicTestAudio){musicTestAudio.pause();musicTestAudio=null;}
    optionsScreen.hidden=true;title.hidden=false;phase='title';
    if(titleMusic.paused)playTitleMusic();
    // Le titre reprend sur son menu stable, pas au début de la rotation.
    titleVisualStartedAt=performance.now()-7000;
    titleFrame=requestAnimationFrame(drawTitleFrame);
    startButton.focus({preventScroll:true});
  }
  function activateTitleSelection(){
    if(phase!=='title')return;
    cursorConfirm();
    if(titleSelection===2){openOptions();return;}
    if(titleSelection===0){settings.turbo=clamp(settings.turbo,0,8);persistSettings();}
    if(titleSelection===1){settings.turbo=0;persistSettings();}
    launch();
  }
  // Frises et positions relevées sur la capture 1311-30 (320x180 virtuels).
  // Aucune interpolation temporelle entre frames SNES de 1/30 s.
  function renderCinematic(seconds){
    if(!mctx)return;
    const ctx=mctx,w=320,h=180;
    ctx.setTransform(2,0,0,2,0,0);
    const t=Math.floor(Math.max(0,seconds)*30)/30;
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    const sprite=titleSpriteCanvas;
    if(!sprite)return;
    const paint=(img,x,y,ww,hh,angle=0,sx=1)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(sx,1);
      ctx.drawImage(img,-ww/2,-hh/2,ww,hh);ctx.restore();
    };
    // 0.00–1.23 : titre petit, haut de l'écran sur noir intégral.
    if(t<1.24){paint(sprite,160,43,84,42);return;}
    // 1.24–2.18 : très grandes lettres en dégradé rouge->jaune->blanc,
    // mouvement DROITE vers GAUCHE, visible seulement par morceaux.
    if(t<2.19){
      const p=Math.min(1,(t-1.24)/.95);
      const x=32-670*p;
      if(giantLetters)ctx.drawImage(giantLetters,0,0,345,150,x,16,960,146);
      else paint(sprite,160,90,900,450);
      return;
    }
    // 2.19–2.34 : le petit titre réapparaît, incliné, sur fond NOIR.
    if(t<2.35){
      const p=Math.max(0,(t-2.19)/.16);
      paint(sprite,160,59,93,46,-.25-p*.63);
      return;
    }
    // 2.35 : bande bleue très large, au tiers SUPÉRIEUR de l'image.
    const bandColor='#225ab4';
    ctx.fillStyle=bandColor;ctx.fillRect(15,15,290,89);
    // 2.35–3.20 : mosaïque jaune/rose qui tourne et devient progressivement
    // plus détaillée. La durée de forte pixellisation reste courte.
    if(t<3.22){
      const raw=Math.max(0,Math.min(1,(t-2.35)/.87));
      const p=ease(raw);
      const lod=p<.26?0:p<.43?1:p<.61?2:p<.76?3:4;
      const image=coarseSprites[lod]||sprite;
      const spin=Math.PI*2.47*(1-p);
      const scaleX=Math.cos(spin);
      const flip=Math.sign(scaleX||1)*Math.max(.06,Math.abs(scaleX));
      const tilt=-.79*(1-p);
      const ww=66+166*p,hh=ww*.49;
      const bob=12*Math.sin(spin)*(1-p);
      paint(image,160,67+bob,ww,hh,tilt,flip);
      return;
    }
    // 3.22–3.48 : stabilisation progressive du logo, toujours sur bande bleue.
    const p=ease((t-3.22)/.26);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    paint(sprite,160,61,222+14*p,100+10*p,-.19*(1-p),.8+.2*p);
    if(t>=3.30){
      ctx.textAlign='center';ctx.fillStyle='#f0a45b';
      pixelSerif(ctx,'HYPER FIGHTING',160,122,132,13,17);
      ctx.font='bold 6px "Courier New",monospace';ctx.fillStyle='#ca8655';
      ctx.fillText('© ZIKAPCOM 2027',160,178);
    }
  }
  function animateCinematic(startedAt){
    const tick=now=>{
      if(phase!=='cinematic'||closed)return;
      const t=(!titleMusic.paused && titleMusic.currentTime>=TITLE_MUSIC_OFFSET)
        ? titleMusic.currentTime-TITLE_MUSIC_OFFSET
        : Math.max(0,(now-startedAt)/1000);
      renderCinematic(t);
      if(t>=CINEMATIC_LENGTH){finishCinematic();return;}
      cinematicFrame=requestAnimationFrame(tick);
    };
    cinematicFrame=requestAnimationFrame(tick);
  }
  function showTitle(){
    if(phase!=='splash'||closed)return;
    phase='cinematic';
    cancelAnimationFrame(raf);
    unblock.hidden=true;
    audio.pause();
    splash.hidden=true;
    cinematic.hidden=false;
    titleMusic.currentTime=TITLE_MUSIC_OFFSET;
    titleVisualStartedAt=performance.now();
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
  // La vidéo utilisateur commence par une page de crédits SANS musique.
  // Corrélation spectrale avec la vidéo de référence : début du MP3 à 5.20s.
  // Le MP3 commence par un court silence ; la première note est donc plus tardive.

  // Crédits reproduits en 371x189 pixels natifs, agrandis x2 comme sur SNES.
  // Les noms de l'éditeur et du festival remplacent les fausses licences.
  const creditGlyphs=new Map();
  function pixelSerif(ctx,text,x,y,w,h,size){
    const key=text+':'+size;
    let glyph=creditGlyphs.get(key);
    if(!glyph){
      const mask=document.createElement('canvas');
      const m=mask.getContext('2d');
      m.font='bold '+size+'px Georgia,serif';
      mask.width=Math.ceil(m.measureText(text).width)+12;
      mask.height=size+10;
      m.font='bold '+size+'px Georgia,serif';
      m.fillStyle='#fff';
      m.textBaseline='alphabetic';
      m.fillText(text,6,size+1);
      const dark=document.createElement('canvas');
      dark.width=mask.width;dark.height=mask.height;
      const dc=dark.getContext('2d');
      dc.fillStyle='#502531';dc.fillRect(0,0,dark.width,dark.height);
      dc.globalCompositeOperation='destination-in';dc.drawImage(mask,0,0);
      const colored=document.createElement('canvas');
      colored.width=mask.width;colored.height=mask.height;
      const c=colored.getContext('2d');
      const gr=c.createLinearGradient(0,0,0,colored.height);
      gr.addColorStop(0,'#ffe7a0');gr.addColorStop(.2,'#f0b36b');
      gr.addColorStop(.5,'#a8503a');gr.addColorStop(.7,'#eba15b');
      gr.addColorStop(1,'#602c3a');
      c.fillStyle=gr;c.fillRect(0,0,colored.width,colored.height);
      c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);
      glyph={mask,colored,dark};creditGlyphs.set(key,glyph);
    }
    // Éviter d'étirer artificiellement les mentions plus courtes que CAPCOM :
    // préserver les proportions des empattements de la police 16 bits.
    const glyphWidth=Math.min(w,Math.round(glyph.mask.width*1.13));
    const left=Math.round(x-glyphWidth/2);
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.globalAlpha=.9;ctx.drawImage(glyph.dark,left+1,y+1,glyphWidth,h);
    ctx.globalAlpha=1;ctx.drawImage(glyph.colored,left,y,glyphWidth,h);
    ctx.restore();
  }
  // Crisp vector text at 1280x960, in the same 4:3 frame as the reference.
  // 4:3 SNES credits: rows and relative sizes measured against the reference.
  // Render the actual lettering sharply, never a tiny screenshot enlarged.
  function drawLegalFrame(t){
    if(!legalCtx)return;
    const ctx=legalCtx;
    ctx.setTransform(4,0,0,4,0,0);
    ctx.clearRect(0,0,320,240);
    ctx.fillStyle=t<.19?'#120b98':'#000';
    ctx.fillRect(0,0,320,240);
    if(t<.33)return;
    const opacity=Math.min(1,Math.max(0,(t-.33)/.22),Math.max(0,(5.2-t)/.18));
    ctx.globalAlpha=opacity;
    const write=(value,y,size)=>{
      ctx.save();
      ctx.font='900 '+size+'px Georgia,"Times New Roman",serif';
      ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
      const gradient=ctx.createLinearGradient(0,y-size,0,y+1);
      gradient.addColorStop(0,'#f6d16d');
      gradient.addColorStop(.35,'#d99452');
      gradient.addColorStop(.65,'#9e5038');
      gradient.addColorStop(1,'#eda850');
      ctx.strokeStyle='#3d1930';ctx.lineWidth=.8;
      ctx.strokeText(value,160,y+.7);
      ctx.fillStyle=gradient;ctx.fillText(value,160,y);
      ctx.restore();
    };
    write('ZIKA FIGHTER TURBO',30,16);
    write('HYPER FIGHTING',57,12);
    write('© ZIKAPCOM 2027',91,12);
    write('© ZIKAPCOM - MANSLE-LES-FONTAINES - 2027',107,9);
    write('PRÉSENTÉ PAR ZIKAMANSLE',144,15);
    ctx.save();
    ctx.beginPath();ctx.rect(174,162,146,78);ctx.clip();
    const logo=legalPinkSprite||titleSpriteCanvas;
    if(logo){
      ctx.shadowColor='#270e29';ctx.shadowBlur=1.5;
      ctx.drawImage(logo,180,163,155,78);
    }else{
      ctx.textAlign='center';ctx.translate(248,216);ctx.rotate(-.10);
      ctx.font='italic 900 37px Impact,"Arial Black",sans-serif';
      ctx.fillStyle='#e84fb1';ctx.fillText('ZIKA',0,-13);
      ctx.fillText('FIGHTER',0,24);
    }
    ctx.restore();
    ctx.globalAlpha=1;
  }
  function legalTick(now){
    if(phase!=='legal')return;
    const t=Math.max(0,(now-legalStartedAt)/1000);
    drawLegalFrame(t);
    if(t>=5.20){
      cancelAnimationFrame(legalFrame);
      legal.hidden=true;splash.hidden=false;phase='splash';
      visualStartedAt=performance.now();
      raf=requestAnimationFrame(update);
      attemptPlayback();return;
    }
    legalFrame=requestAnimationFrame(legalTick);
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
    if(titleFrame)cancelAnimationFrame(titleFrame);
    titleMusic.pause();
    titleMusic.currentTime=0;
    // Le vrai WAV de confirmation est joué par activateTitleSelection().
    // Ne pas superposer le vieux bruitage synthétique.
    overlay.classList.add('zf-fade');
    setTimeout(()=>{
      overlay.remove();
      // The selection scene takes over the shared BGM, with the global music level.
      window.ZikaArcadeAudio?.startTitle();
      document.querySelector('[data-player]')?.focus({preventScroll:true});
    },390);
  }
  // Navigation arcade, utilisable au clavier, à la manette mappée en touches,
  // et au clic sur l'écran. Aucun passage automatique au combat.
  startButton.addEventListener('click',event=>{
    if(phase!=='title')return;
    const rect=titleCanvas.getBoundingClientRect();
    const y=(event.clientY-rect.top)/Math.max(1,rect.height)*180;
    // Un clic sur le logo n'envoie pas directement au combat :
    // il faut sélectionner l'une des trois lignes du menu.
    if(y<136||y>178)return;
    if(y>=136&&y<=178){
      const rows=[145,157,169];
      const beforeSelection=titleSelection;
      titleSelection=rows.reduce((best,v,i)=>Math.abs(v-y)<Math.abs(rows[best]-y)?i:best,0);
      if(beforeSelection!==titleSelection)cursorMove();
      if(titleSelection===0&&event.clientX>rect.left+rect.width*.63){
        const previous=settings.turbo;
        settings.turbo=clamp(settings.turbo+1,0,8);persistSettings();
        if(previous!==settings.turbo)cursorMove();
        return;
      }
    }
    activateTitleSelection();
  });
  optionsBack.addEventListener('click',event=>{
    if(phase!=='options')return;
    const rect=optionsCanvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)/Math.max(1,rect.width)*320;
    const y=(event.clientY-rect.top)/Math.max(1,rect.height)*240;
    if(y<15||x>300&&y>222){closeOptions();return;}
    const beforeSelection=optionSelection;
    optionSelection=optionRows.reduce((best,v,i)=>Math.abs(v-y)<Math.abs(optionRows[best]-y)?i:best,0);
    if(beforeSelection!==optionSelection)cursorMove();
    if((optionSelection===5||optionSelection===6)&&x>=145&&x<=248){
      const key=optionSelection===5?'musicVolume':'fxVolume';
      const next=clamp(Math.floor((x-145)/10)+1,0,10);
      if(settings[key]!==next){
        settings[key]=next;persistSettings();renderOptions();cursorMove();
      }
      return;
    }
    if(optionSelection===7&&x>205){cursorConfirm();playMusicTest();return;}
    if(optionSelection===8&&x>205){playSfxTest();return;}
    adjustOption(x<154?-1:1);
  });
  document.addEventListener('keydown',event=>{
    if(closed||!overlay.isConnected)return;
    if(phase==='title'){
      const oldSelection=titleSelection,oldTurbo=settings.turbo;
      if(['ArrowUp','KeyW','KeyZ'].includes(event.code)){
        titleSelection=(titleSelection+2)%3;
      }else if(['ArrowDown','KeyS'].includes(event.code)){
        titleSelection=(titleSelection+1)%3;
      }else if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)){
        if(titleSelection===0){
          settings.turbo=clamp(settings.turbo+(['ArrowLeft','KeyA'].includes(event.code)?-1:1),0,8);
          persistSettings();
        }
      }else if(['Enter','Space','NumpadEnter'].includes(event.code)){
        activateTitleSelection();
      }else return;
      if(oldSelection!==titleSelection||oldTurbo!==settings.turbo)cursorMove();
      event.preventDefault();event.stopImmediatePropagation();
    }else if(phase==='options'){
      const oldSelection=optionSelection;
      if(['Escape','Backspace','KeyB'].includes(event.code)){
        closeOptions();
      }else if(['ArrowUp','KeyW','KeyZ'].includes(event.code)){
        optionSelection=(optionSelection+8)%9;renderOptions();
      }else if(['ArrowDown','KeyS'].includes(event.code)){
        optionSelection=(optionSelection+1)%9;renderOptions();
      }else if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)){
        adjustOption(['ArrowLeft','KeyA'].includes(event.code)?-1:1);
      }else if(['Enter','Space','NumpadEnter'].includes(event.code)){
        if(optionSelection===8)playSfxTest();
        else {
          cursorConfirm();
          if(optionSelection===7)playMusicTest();
          else adjustOption(1);
        }
      }else return;
      if(oldSelection!==optionSelection)cursorMove();
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  // Réactivation du son sur geste explicite, en respectant les règles du navigateur.
  document.addEventListener('pointerdown',()=>{
    if(phase==='title'||phase==='options'){
      prepareMenuSfx();
      if(titleMusic.paused)playTitleMusic();
    }
  },{capture:true});
  // Prise en charge des manettes du navigateur : croix, sticks, A et B.
  // Le futur portage émulateur natif sera traité séparément.
  let padHeld='',padLastActionAt=0;
  function pollArcadePad(now){
    if(closed||!overlay.isConnected)return;
    let pads=[];
    try{pads=navigator.getGamepads?Array.from(navigator.getGamepads()):[];}catch(_){}
    const pad=pads.find(Boolean);
    let action='';
    if(pad&&(phase==='title'||phase==='options')){
      const pressed=n=>Boolean(pad.buttons&&pad.buttons[n]&&pad.buttons[n].pressed);
      const ax=pad.axes&&pad.axes[0]||0,ay=pad.axes&&pad.axes[1]||0;
      if(pressed(12)||ay<-.6)action='up';
      else if(pressed(13)||ay>.6)action='down';
      else if(pressed(14)||ax<-.6)action='left';
      else if(pressed(15)||ax>.6)action='right';
      else if(pressed(1)||pressed(8))action='back';
      else if(pressed(0)||pressed(9))action='select';
      if(action&&(action!==padHeld||now-padLastActionAt>230)){
        padLastActionAt=now;
        if(phase==='title'){
          const priorSelection=titleSelection, priorTurbo=settings.turbo;
          if(action==='up')titleSelection=(titleSelection+2)%3;
          else if(action==='down')titleSelection=(titleSelection+1)%3;
          else if(action==='left'&&titleSelection===0){settings.turbo=clamp(settings.turbo-1,0,8);persistSettings();}
          else if(action==='right'&&titleSelection===0){settings.turbo=clamp(settings.turbo+1,0,8);persistSettings();}
          else if(action==='select')activateTitleSelection();
          if(priorSelection!==titleSelection||priorTurbo!==settings.turbo)cursorMove();
        }else if(phase==='options'){
          if(action==='up'){optionSelection=(optionSelection+8)%9;renderOptions();cursorMove();}
          else if(action==='down'){optionSelection=(optionSelection+1)%9;renderOptions();cursorMove();}
          else if(action==='left')adjustOption(-1);
          else if(action==='right')adjustOption(1);
          else if(action==='back')closeOptions();
          else if(action==='select'){if(optionSelection===8)playSfxTest();else{cursorConfirm();if(optionSelection===7)playMusicTest();else adjustOption(1);}}
        }
      }
    }
    padHeld=action;
    requestAnimationFrame(pollArcadePad);
  }
  requestAnimationFrame(pollArcadePad);
  fade(0);
  // Paramètres de prévisualisation destinés aux tests graphiques uniquement.
  // Sans paramètre, l'introduction complète démarre normalement.
  const previewScreen=new URLSearchParams(location.search).get('screen');
  if(previewScreen==='legal'){
    // Static inspection of the first 4:3 credits screen without timed transition.
    phase='legal-preview';
    drawLegalFrame(1.5);
  }else if(previewScreen==='options'){
    legal.hidden=true;optionsScreen.hidden=false;phase='options';
    renderOptions();
  }else if(previewScreen==='title'){
    legal.hidden=true;title.hidden=false;phase='title';
    titleVisualStartedAt=performance.now()-7000;
    titleFrame=requestAnimationFrame(drawTitleFrame);
  }else{
    legalFrame=requestAnimationFrame(legalTick);
  }
  // Réessayer automatiquement au retour sur l'application (sans remplacer l'interaction exigée par certains navigateurs).
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && phase==='splash' && status==='blocked')attemptPlayback();
  });
  window.addEventListener('pageshow',()=>{
    if(phase==='splash' && status==='blocked')attemptPlayback();
  });
  // Lancement du jingle déclenché à la fin de l'écran de crédits.
})();