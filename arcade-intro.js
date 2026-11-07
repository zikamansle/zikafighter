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
      '<div class="zf-zikacom-official" aria-label="ZIKAPCOM"><img id="zf-zikapcom-logo" src="./assets/zikapcom-logo.png" alt="ZIKAPCOM"></div>',
      '<div class="zf-zikacom-shine" aria-hidden="true"><img src="./assets/zikapcom-logo.png" alt=""></div>',
      '<button type="button" class="zf-unlock-sound" id="zf-unlock-sound" hidden>ACTIVER LE SON POUR LANCER LE JEU</button>',
      '<p id="zf-sound-error" class="zf-sound-error" hidden>Jingle introuvable : assets/zikacom-intro.mp3</p>',
    '</div>',
    '<div class="zf-screen zf-cinematic" id="zf-cinematic" hidden aria-label="Animation du titre Zika Fighter">',
      '<canvas id="zf-cinematic-canvas" width="640" height="360" aria-hidden="true"></canvas>',
    '</div>',
    '<div class="zf-screen zf-title" id="zf-title" hidden>',
      '<div class="zf-mark" aria-label="Zika Fighter"><span>ZIKA</span><span>FIGHTER</span></div>',
      '<div class="zf-press" aria-hidden="true">PUSH START</div>',
      '<div class="zf-copyright">© 2027 ZIKAPCOM<br>ALL RIGHTS RESERVED</div>',
      '<div class="zf-credits">CREDIT 00</div>',
      '<div class="zf-title-flash" aria-hidden="true"></div>',
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
  const splash=document.getElementById('zf-splash');
  const title=document.getElementById('zf-title');
  const cinematic=document.getElementById('zf-cinematic');
  let cinematicFrame=null;
  const CINEMATIC_LENGTH=3.62;
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
  // Reconstitution séquencée à partir de la vidéo fournie (30 images/s).
  // Petit titre fixe -> lettrage géant -> titre retourné en perspective et morcelé
  // sur une bande bleue -> stabilisation, sans autre texte ajouté.
  const movie=document.getElementById('zf-cinematic-canvas');
  const mctx=movie.getContext('2d',{alpha:false});
  const titleSprite=new Image();
  let titleSpriteCanvas=null;
  let fighterHalf=null;
  titleSprite.src='./assets/zika-fighter-title.png';
  function prepareTitleSprite(){
    try{
      // Le vrai logo se situe dans la partie HAUTE du PNG.
      // L'ancien découpage englobait PUSH START et enlaidissait la rotation.
      const cw=480,ch=242;
      const src=document.createElement('canvas');
      src.width=cw;src.height=ch;
      const cx=src.getContext('2d',{willReadFrequently:true});
      cx.drawImage(titleSprite,110,32,1200,585,0,0,cw,ch);
      const data=cx.getImageData(0,0,cw,ch);
      for(let p=0;p<data.data.length;p+=4){
        const r=data.data[p],g=data.data[p+1],b=data.data[p+2];
        if(b>70&&b>r*1.28&&b>g*1.22)data.data[p+3]=0;
      }
      cx.putImageData(data,0,0);
      titleSpriteCanvas=src;
      fighterHalf=document.createElement('canvas');
      fighterHalf.width=cw;fighterHalf.height=145;
      fighterHalf.getContext('2d').drawImage(src,0,97,cw,145,0,0,cw,145);
    }catch(_){titleSpriteCanvas=null;fighterHalf=null;}
  }
  if(titleSprite.complete&&titleSprite.naturalWidth)prepareTitleSprite();
  else titleSprite.addEventListener('load',prepareTitleSprite,{once:true});
  const easeOut=x=>1-Math.pow(1-clamp(x,0,1),3);
  const easeInOut=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
  function finishCinematic(){
    if(phase!=='cinematic'||closed)return;
    if(cinematicFrame!==null)cancelAnimationFrame(cinematicFrame);
    cinematic.hidden=true;
    title.hidden=false;
    phase='title';
    startButton.focus({preventScroll:true});
  }
  function renderCinematic(t){
    if(!mctx)return;
    const w=movie.width,h=movie.height,ctx=mctx;
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    const sprite=titleSpriteCanvas;
    if(!sprite){
      ctx.fillStyle='#ffd726';ctx.font='italic bold 38px Impact,sans-serif';
      ctx.textAlign='center';ctx.fillText('ZIKA FIGHTER',w/2,h*.3);return;
    }
    const paint=(image,x,y,ww,hh,rotation=0,flipX=1,alpha=1)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(flipX,1);
      ctx.globalAlpha=alpha;ctx.drawImage(image,-ww/2,-hh/2,ww,hh);ctx.restore();
    };
    if(t<1.37){
      // Identique à l'ouverture vidéo : très petit et au tiers supérieur du noir.
      paint(sprite,w*.5,h*.22,160,80);
      return;
    }
    if(t<2.22){
      // Grand lettrage envahissant l'écran : aucune rotation de l'image entière.
      const p=easeOut((t-1.37)/.85);
      paint(fighterHalf||sprite,w*.5,h*.47,330+1620*p,105+530*p);
      return;
    }
    // Le fond n'est PAS tout bleu : c'est uniquement une bande centrale.
    ctx.fillStyle='#2558b7';
    ctx.fillRect(0,109,w,145);
    if(t<3.37){
      // Effet SNES : rotation Y simulée par écrasement horizontal,
      // mouvement de bascule et séparation temporaire en colonnes.
      const p=easeInOut((t-2.22)/1.15);
      const turn=(1-p)*Math.PI*2.3;
      const y=h*.50+Math.sin(turn)*30*(1-p);
      const size=150+305*p;
      const flip=Math.cos(turn);
      const sx=Math.sign(flip||1)*Math.max(.06,Math.abs(flip));
      const tilt=Math.sin(turn)*.22*(1-p);
      if(p<.56){
        // Éclats colorés organisés selon les morceaux de l'image,
        // et non des rectangles jaunes inventés.
        const columns=10;
        for(let k=0;k<columns;k++){
          const sw=sprite.width/columns;
          const dw=size/columns;
          const offset=Math.sin(k*2.2+turn)*65*(1-p/.56);
          ctx.save();
          ctx.translate(w*.5,y);
          ctx.rotate(tilt);
          ctx.scale(sx,1);
          ctx.drawImage(sprite,k*sw,0,sw,sprite.height,-size/2+k*dw,offset-size*.25,dw+1,size*.5);
          ctx.restore();
        }
      }else{
        paint(sprite,w*.5,y,size,size*.5,tilt,sx);
      }
      return;
    }
    paint(sprite,w*.5,h*.5,455,227);
  }
  function animateCinematic(startedAt){
    // Le temps réel de la musique pilote cette seconde introduction.
    const tick=now=>{
      if(phase!=='cinematic'||closed)return;
      const t=(!titleMusic.paused&&titleMusic.currentTime>0)
        ? titleMusic.currentTime
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