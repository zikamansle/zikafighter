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
    '<div class="zf-screen zf-legal" id="zf-legal" aria-label="Crédits de lancement">',
      '<div class="zf-legal-content">',
        '<div class="zf-legal-head">HYPER FIGHTING</div>',
        '<div class="zf-legal-rights">© ZIKAPCOM 2027</div>',
        '<div class="zf-legal-studio">ZIKAMANSLE · 2027</div>',
        '<div class="zf-legal-license">PRÉSENTÉ PAR ZIKAMANSLE</div>',
        '<div class="zf-legal-mark" aria-hidden="true">ZIKA FIGHTER</div>',
      '</div>',
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
      '<button type="button" class="zf-start" id="zf-start" aria-label="Commencer Zika Fighter">COMMENCER</button>',
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
  const splash=document.getElementById('zf-splash');
  const title=document.getElementById('zf-title');
  const titleCanvas=document.getElementById('zf-title-canvas');
  const titleCtx=titleCanvas.getContext('2d',{alpha:false});
  let titleFrame=0;
  const cinematic=document.getElementById('zf-cinematic');
  let cinematicFrame=null;
  const CINEMATIC_LENGTH=3.62;
  const startButton=document.getElementById('zf-start');
  const unblock=document.getElementById('zf-unlock-sound');
  const errorText=document.getElementById('zf-sound-error');
  const audio=new Audio('./assets/zikacom-intro.mp3');
  audio.preload='auto';
  audio.load();
  audio.volume=1;
  const music=window.ZikaArcadeAudio;
  const titleMusic=new Audio('./assets/zika-title-theme.mp3');
  titleMusic.preload='auto';
  titleMusic.loop=true;
  titleMusic.volume=0.8;
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
  let titleSpriteCanvas=null, mosaic=null, giantLetters=null, coarseSprites=[];
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
      cx.putImageData(pixels,0,0);titleSpriteCanvas=src;
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
      gc.fillStyle=gr;gc.fillText('FIGHTER',5,-7);
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
  function renderTitleFrame(t){
    if(!titleCtx)return;
    const ctx=titleCtx,w=320,h=180;
    ctx.setTransform(2,0,0,2,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    let band='#2157b4';
    if(t>=6.55 && t<6.84)band='#67c93d';
    if(t>=6.84 && t<7.72)band='#000';
    ctx.fillStyle=band;ctx.fillRect(0,52,w,79);
    // Titre approuvé, découpé du PNG sans ses crédits ni la marque périmée.
    if(titleSpriteCanvas)ctx.drawImage(titleSpriteCanvas,39,23,242,119);
    else{
      ctx.fillStyle='#f2d534';ctx.font='italic bold 34px Impact,sans-serif';
      ctx.textAlign='center';ctx.fillText('ZIKA FIGHTER',160,89);
    }
    ctx.textAlign='center';
    ctx.fillStyle='#e99062';
    ctx.font='bold 9px "Courier New",monospace';
    ctx.fillText('HYPER FIGHTING',160,154);
    ctx.font='bold 7px "Courier New",monospace';
    ctx.fillStyle='#e8ab99';
    ctx.fillText('© ZIKAPCOM 2027',160,172);
    // "PUSH START" n'appartient plus au PNG : il clignote vraiment.
    if((t%1.1)<.63){
      ctx.font='bold 9px "Courier New",monospace';
      ctx.fillStyle='#fff4e7';ctx.fillText('PUSH START',160,145);
    }
    // Très bref assombrissement du logo et de la bande dans la référence.
    let shade=0;
    if(t>=5.73&&t<6.10)shade=.85*Math.sin(Math.PI*(t-5.73)/.37);
    if(t>=7.65&&t<8.04)shade=.80*Math.sin(Math.PI*(t-7.65)/.39);
    if(shade>0){ctx.fillStyle='rgba(0,0,0,'+shade+')';ctx.fillRect(0,0,w,h);}
  }
  function drawTitleFrame(){
    if(phase!=='title'||closed)return;
    renderTitleFrame(Math.max(0,(titleMusic.currentTime||0)-TITLE_MUSIC_OFFSET));
    titleFrame=requestAnimationFrame(drawTitleFrame);
  }
  function renderCinematic(seconds){
    if(!mctx)return;
    const ctx=mctx,w=320,h=180;
    // Dessiner à 2x pour garder l'esthétique arcade sans énormes carrés.
    ctx.setTransform(2,0,0,2,0,0);
    // Cadence SNES : 30 images effectives/s, sans interpolation moderne.
    const t=Math.floor(Math.max(0,seconds)*30)/30;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    const sprite=titleSpriteCanvas;
    if(!sprite)return;
    const drawLogo=(x,y,ww,hh)=>ctx.drawImage(sprite,x-ww/2,y-hh/2,ww,hh);
    if(t<1.2){
      drawLogo(w/2,43,82,42);return;
    }
    if(t<2.2){
      // Défilement horizontal géant, lettres rouges en haut, ivoire en bas.
      // On ne reprend pas le mot TURBO : ZIKA FIGHTER conserve son propre nom.
      const p=clamp((t-1.2)/1.0,0,1);
      const x=80-880*p;
      if(giantLetters)ctx.drawImage(giantLetters,x,17,1200,145);
      else drawLogo(w/2,90,800,400);
      return;
    }
    // La bande bleue est limitée au tiers central, comme dans la vidéo.
    ctx.fillStyle='#1852ae';ctx.fillRect(0,54,320,72);
    if(t<2.31){
      // Très court retour du petit logo, visible sur fond noir juste avant le ruban.
      drawLogo(160,43,82,42);
      return;
    }
    if(t<3.30){
      const p=ease((t-2.31)/.99);
      // La référence va de gros blocs très rares (2.3-2.7)
      // à une image tournée détaillée (2.9-3.2), puis frontale (3.3).
      const lod=p<.29?0:p<.46?1:p<.62?2:p<.76?3:4;
      const image=coarseSprites[lod]||sprite;
      const turn=(1-p)*Math.PI*2.52;
      const flip=Math.cos(turn);
      const sx=Math.sign(flip||1)*Math.max(.055,Math.abs(flip));
      const roll=-.8*(1-p)+.09*Math.sin(p*Math.PI*5)*(1-p);
      const ww=62+192*p;
      const hh=ww*.48;
      const bob=Math.sin(turn)*22*(1-p);
      ctx.save();
      ctx.translate(160,90+bob);
      ctx.rotate(roll);
      ctx.scale(sx,1);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,-ww/2,-hh/2,ww,hh);
      ctx.restore();
      return;
    }
    drawLogo(160,90,247,123);
    ctx.textAlign='center';ctx.fillStyle='#e96338';
    ctx.font='bold 9px Georgia,serif';ctx.letterSpacing='1px';
    ctx.fillText('HYPER FIGHTING',160,153);
    ctx.font='7px monospace';ctx.fillStyle='#e9a5a3';
    ctx.fillText('© ZIKAPCOM 2027',160,173);
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
  function legalTick(now){
    if(phase!=='legal')return;
    const t=Math.max(0,(now-legalStartedAt)/1000);
    const smooth=p=>{p=clamp(p,0,1);return p*p*(3-2*p);};
    legal.style.setProperty('--zf-legal-opacity',
      String(smooth((t-.42)/.50)*(1-smooth((t-4.73)/.47))));
    legal.style.setProperty('--zf-legal-blue',
      String(1-smooth((t-.06)/.22)));
    if(t>=5.20){
      cancelAnimationFrame(legalFrame);
      legal.hidden=true;
      splash.hidden=false;
      phase='splash';
      visualStartedAt=performance.now();
      raf=requestAnimationFrame(update);
      attemptPlayback();
      return;
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
  legalFrame=requestAnimationFrame(legalTick);
  // Réessayer automatiquement au retour sur l'application (sans remplacer l'interaction exigée par certains navigateurs).
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && phase==='splash' && status==='blocked')attemptPlayback();
  });
  window.addEventListener('pageshow',()=>{
    if(phase==='splash' && status==='blocked')attemptPlayback();
  });
  // Lancement du jingle déclenché à la fin de l'écran de crédits.
})();