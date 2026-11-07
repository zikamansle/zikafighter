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
      '<canvas id="zf-legal-canvas" width="742" height="378" aria-hidden="true"></canvas>',
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
  const legalCanvas=document.getElementById('zf-legal-canvas');
  const legalCtx=legalCanvas.getContext('2d',{alpha:false});
  const splash=document.getElementById('zf-splash');
  const title=document.getElementById('zf-title');
  const titleCanvas=document.getElementById('zf-title-canvas');
  const titleCtx=titleCanvas.getContext('2d',{alpha:false});
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
      // Menu de vitesse et typographie cuivre/or conformes à la vidéo :
      // 'TURBO ★★★' sur la première rangée, puis 'NORMAL'.
      pixelSerif(ctx,'TURBO ★★★',149,145,98,12,15);
      pixelSerif(ctx,'NORMAL',141,157,66,12,15);
      // Petit curseur blanc pixellisé au niveau NORMAL.
      ctx.fillStyle='#fff8e6';ctx.fillRect(98,159,5,5);
      ctx.fillStyle='#7aa4c7';ctx.fillRect(99,155,4,4);
      ctx.fillStyle='#1b2c52';ctx.fillRect(98,164,5,2);
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
    const left=Math.round(x-w/2);
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.globalAlpha=.9;ctx.drawImage(glyph.dark,left+1,y+1,w,h);
    ctx.globalAlpha=1;ctx.drawImage(glyph.colored,left,y,w,h);
    ctx.restore();
  }
  function drawLegalFrame(t){
    if(!legalCtx)return;
    const ctx=legalCtx;
    ctx.setTransform(2,0,0,2,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle=t<.19?'#1009ac':'#000';
    ctx.fillRect(0,0,371,189);
    if(t<.33)return;
    ctx.globalAlpha=Math.min(1,Math.max(0,(t-.33)/.22),Math.max(0,(5.20-t)/.18));
    // Positions tirées des captures vidéo : rangées 7, 58, 82 et 122.
    pixelSerif(ctx,'HYPER FIGHTING',185.5,7,193,18,19);
    pixelSerif(ctx,'© ZIKAPCOM 2027',185.5,58,264,16,16);
    pixelSerif(ctx,'ZIKAPCOM · MANSLE-LES-FONTAINES · 2027',185.5,82,384,15,16);
    pixelSerif(ctx,'PRÉSENTÉ PAR ZIKAMANSLE',185.5,122,279,21,21);
    ctx.save();
    ctx.beginPath();ctx.rect(187,172,126,17);ctx.clip();
    ctx.font='italic bold 31px Georgia,serif';
    ctx.fillStyle='#d348a5';ctx.strokeStyle='#78265c';
    ctx.lineWidth=2;ctx.translate(206,194);ctx.transform(1,0,-.2,1,0,0);
    ctx.strokeText('ZIKA',0,0);ctx.fillText('ZIKA',0,0);
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