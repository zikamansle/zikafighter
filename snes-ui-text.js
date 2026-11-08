/* Zika Fighter: alphabet 16 bits source-derived for all PLAYER SELECT text.
 * Tiles A,C,E,L,P,R,S,T,Y were lifted pixel by pixel from an actual
 * Street Fighter II Turbo SNES gameplay capture. Missing characters were
 * extended in the same bitmap palette. No installed system fonts are used.
 */
(()=>{'use strict';
  if(window.ZikaSNESText)return;
  const GLYPHS="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .:-!'&/";
  const CW=24,CH=30,advance=21;
  let loaded=false,failed=false;
  const atlas=new Image();atlas.decoding='async';
  const handlers=[];
  function flush(){while(handlers.length){const fn=handlers.shift();try{fn()}catch(e){console.error(e)}}}
  atlas.onload=()=>{
    loaded=atlas.naturalWidth===GLYPHS.length*CW && atlas.naturalHeight===CH*3;
    failed=!loaded;
    flush();
    document.dispatchEvent(new Event('zika:snes-text-ready'));
  };
  atlas.onerror=()=>{failed=true;console.error('Zika Fighter: SNES font atlas missing');flush();};
  atlas.src='./assets/snes-ui-letters.png?v=20261108-authentic-title-v1';
  function normalized(value){
    return String(value??'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function measure(value,scale=1){
    return Math.max(0,normalized(value).length*advance-3)*scale;
  }
  function draw(ctx,value,x,y,opts={}){
    if(!loaded||!ctx)return 0;
    const text=normalized(value);
    const desiredScale=Number(opts.scale)||1;
    const maximum=Number(opts.maxWidth)||Infinity;
    const scale=Math.min(desiredScale,maximum/Math.max(1,measure(text,1)));
    const width=measure(text,scale);
    const position=opts.align||'left';
    const begin=x-(position==='center'?width/2:position==='right'?width:0);
    const tone=opts.tone==='blue'||opts.tone==='cyan'?1:opts.tone==='cream'?2:0;
    const oldSmooth=ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled=false;
    for(let i=0;i<text.length;i++){
      const glyph=GLYPHS.indexOf(text[i]);
      if(glyph<0)continue;
      const left=Math.round(begin+i*advance*scale);
      const top=Math.round(y);
      ctx.drawImage(atlas,glyph*CW,tone*CH,CW,CH,
        left,top,Math.max(1,Math.round(CW*scale)),Math.max(1,Math.round(CH*scale)));
    }
    ctx.imageSmoothingEnabled=oldSmooth;
    return width;
  }
  function wrap(text,maxLetters=19){
    const words=normalized(text).split(/\s+/).filter(Boolean);
    const lines=[];let line='';
    for(const word of words){
      if(line && line.length+word.length+1>maxLetters){lines.push(line);line=word;}
      else line+=(line?' ':'')+word;
    }
    if(line)lines.push(line);
    return lines;
  }
  window.ZikaSNESText=Object.freeze({
    draw,measure,wrap,whenReady(fn){if(loaded||failed)fn();else handlers.push(fn)},
    get ready(){return loaded;},
    get failed(){return failed;}
  });
})();