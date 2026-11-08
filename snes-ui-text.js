/* Zika Fighter — renderer commun aux écrans 16 bits.
 * Police des titres : CPS-1 Fighter / Omegaville (CC BY-SA).
 * Police des textes en jeu : Street Fighter II (Large) / Patrick H. Lauke (CC BY).
 * Références et crédits : docs/FONT_CREDITS.md.
 * Aucun alphabet inventé en mosaïque ou re-échantillonné ici.
 */
(()=>{'use strict';
 if(window.ZikaSNESText)return;
 const callbacks=[];
 const FACES={title:'ZikaCPS1',game:'ZikaSFII'};
 let ready=false,failed=false;
 function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
 function measure(s,scale=1){return norm(s).length*20*scale;}
 function finish(ok){
   ready=ok;failed=!ok;
   while(callbacks.length){try{callbacks.shift()()}catch(e){console.error(e)}}
   document.dispatchEvent(new Event('zika:snes-text-ready'));
 }
 if(document.fonts?.load){
   Promise.all([
    document.fonts.load('18px "ZikaCPS1"','PLAYER SELECT STAGE'),
    document.fonts.load('18px "ZikaSFII"','PASCAL STAGE SELECT')
   ]).then(()=>finish(true),err=>{console.warn('SFII font loading',err);finish(false)});
 }else finish(false);
 function draw(ctx,content,x,y,opts={}){
   if(!ctx||!ready)return 0;
   const text=norm(content);if(!text)return 0;
   const title=opts.face==='game'?false:(opts.face==='title'||opts.variant==='title'||opts.tone==='gold');
   const family=FACES[title?'title':'game'];
   const base=Math.max(5,Math.round(30*(Number(opts.scale)||1)));
   const max=Number(opts.maxWidth)||Infinity;
   ctx.save();
   ctx.imageSmoothingEnabled=false;
   let size=base;
   ctx.font=size+'px "'+family+'"';
   while(size>5 && ctx.measureText(text).width>max){
     size--;ctx.font=size+'px "'+family+'"';
   }
   const width=ctx.measureText(text).width;
   const anchor=opts.align==='center'?'center':opts.align==='right'?'right':'left';
   const color=opts.tone==='cyan'||opts.tone==='blue'?'#58ccff':
       opts.tone==='red'?'#ff6269':
       opts.tone==='cream'?'#f5f4e8':'#ffc17b';
   ctx.textAlign=anchor;ctx.textBaseline='top';
   ctx.lineJoin='miter';ctx.miterLimit=2;
   ctx.strokeStyle=opts.tone==='cyan'?'#071c6b':opts.tone==='red'?'#640b24':'#31152f';
   ctx.lineWidth=Math.max(.6,size/15);
   ctx.strokeText(text,Math.round(x),Math.round(y));
   ctx.fillStyle=color;
   ctx.fillText(text,Math.round(x),Math.round(y));
   ctx.restore();
   return width;
 }
 function wrap(text,maxChars=18){
   const words=norm(text).split(/\s+/).filter(Boolean);
   const out=[];let line='';
   for(const word of words){
     if(line && line.length+word.length+1>maxChars){out.push(line);line=word;}
     else line+=(line?' ':'')+word;
   }
   if(line)out.push(line);
   return out;
 }
 window.ZikaSNESText=Object.freeze({
   draw,wrap,measure,whenReady(fn){if(ready||failed)fn();else callbacks.push(fn)},
   get ready(){return ready},get failed(){return failed}
 });
})();