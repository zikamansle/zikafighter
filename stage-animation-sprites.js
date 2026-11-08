/*
 * Zika Fighter — animated scenery sprites (first validated artwork series).
 *
 * These frames are cut from THE APPROVED original arena bitmap. No sparks,
 * fake moving particles, additive overlays, or replacement scenery.
 * Static signage and sponsor marks are outside all animated regions.
 *
 * Each region is reassembled into an 8-frame sprite sheet in memory and
 * played at 12 fps. The combat canvas composites it within its exact
 * original bounds. This is the rendering foundation, not yet the final
 * manually authored pixel-animation atlas for every arena.
 */
(()=>{'use strict';
 const FRAMES=8, FPS=12;
 // Coordinates relative to the full, uncropped arena art (0..1).
 // Only regions identified on the supplied original images are enabled.
 const zones=Object.freeze({
   'font-gardoire': [
     {box:[.275,.620,.403,.105],axis:'x',motion:'water',amplitude:3.5},
     {box:[.840,.470,.160,.335],axis:'x',motion:'water',amplitude:4}
   ],
   'hotel-de-ville': [
     {box:[.494,.263,.038,.139],axis:'x',motion:'cloth',amplitude:3},
     {box:[.000,.000,.120,.157],axis:'x',motion:'leaves',amplitude:2},
     {box:[.905,.000,.095,.155],axis:'x',motion:'leaves',amplitude:2}
   ],
   'credit-agricole': [
     {box:[.000,.190,.369,.115],axis:'y',motion:'cloth',amplitude:2},
     {box:[.876,.194,.124,.114],axis:'y',motion:'cloth',amplitude:2}
   ],
   'partenaires': [
     {box:[.293,.111,.067,.096],axis:'x',motion:'cloth',amplitude:2},
     {box:[.642,.113,.064,.092],axis:'x',motion:'cloth',amplitude:2}
   ]
 });
 const perImage=new WeakMap();
 function validRect(img,z){
   const [x,y,w,h]=z.box;
   const sx=Math.round(x*img.naturalWidth),sy=Math.round(y*img.naturalHeight);
   const sw=Math.min(Math.round(w*img.naturalWidth),img.naturalWidth-sx);
   const sh=Math.min(Math.round(h*img.naturalHeight),img.naturalHeight-sy);
   return {sx,sy,sw,sh};
 }
 function build(img,stageId){
   const source=zones[stageId]||[];
   const result=[];
   for(const z of source){
     const b=validRect(img,z);
     if(b.sw<2||b.sh<2)continue;
     const sheet=document.createElement('canvas');
     sheet.width=b.sw*FRAMES;sheet.height=b.sh;
     const sc=sheet.getContext('2d',{alpha:false});
     if(!sc)continue;
     sc.imageSmoothingEnabled=false;
     for(let f=0;f<FRAMES;f++){
       const at=f*b.sw;
       sc.save();sc.beginPath();sc.rect(at,0,b.sw,b.sh);sc.clip();
       // Every frame starts with the same ORIGINAL pixels, then physically
       // displaces rows or columns of that picture, unlike an FX overlay.
       sc.drawImage(img,b.sx,b.sy,b.sw,b.sh,at,0,b.sw,b.sh);
       const chunks=Math.max(8,Math.min(48,Math.round((z.axis==='x'?b.sh:b.sw)/5)));
       for(let j=0;j<chunks;j++){
         const along=z.axis==='x'?b.sh:b.sw;
         const lo=Math.floor(along*j/chunks),hi=Math.ceil(along*(j+1)/chunks);
         const size=Math.max(1,hi-lo);
         const t=2*Math.PI*(f/FRAMES)+j*.62;
         const smooth=z.motion==='water'?Math.sin(t)*.7+Math.sin(t*1.7)*.3:Math.sin(t);
         const offset=Math.round(z.amplitude*smooth);
         if(z.axis==='x'){
           // Sample shifted pixels from the SAME water / foliage / fabric,
           // keeping within the pre-existing crop and preserving its color.
           const x=Math.max(b.sx,Math.min(b.sx+b.sw-1,b.sx+offset));
           const w=Math.min(b.sw,b.sx+b.sw-x);
           sc.drawImage(img,x,b.sy+lo,w,size,at,lo,b.sw,size);
         }else{
           const y=Math.max(b.sy,Math.min(b.sy+b.sh-1,b.sy+offset));
           const h=Math.min(b.sh,b.sy+b.sh-y);
           sc.drawImage(img,b.sx,y,b.sw,h,at,lo,b.sw,size);
         }
       }
       sc.restore();
     }
     result.push({sheet,b});
   }
   return result;
 }
 // Returns true only for an arena with real prepared frame data.
 function paint(ctx,img,stageId,now,geo){
   if(!img||!img.complete||!img.naturalWidth)return false;
   if(!zones[stageId])return false;
   let cache=perImage.get(img);
   if(!cache||cache.stageId!==stageId){
     try{cache={stageId,entries:build(img,stageId)};perImage.set(img,cache)}
     catch(err){console.warn('Zika Fighter stage sprites',stageId,err);return false}
   }
   const {sx,sy,sw,sh,W,H}=geo;
   const frame=Math.floor(now*FPS/1000)%FRAMES;
   ctx.save();ctx.imageSmoothingEnabled=false;
   for(const {sheet,b} of cache.entries){
     // The arena image may be cropped to 4:3. Clip the sprite to the
     // actually visible part of that original image, without stretching.
     const ix=Math.max(sx,b.sx),iy=Math.max(sy,b.sy);
     const ex=Math.min(sx+sw,b.sx+b.sw),ey=Math.min(sy+sh,b.sy+b.sh);
     if(ex<=ix||ey<=iy)continue;
     const dx=(ix-sx)*W/sw,dy=(iy-sy)*H/sh;
     const dw=(ex-ix)*W/sw,dh=(ey-iy)*H/sh;
     ctx.drawImage(sheet,frame*b.sw+(ix-b.sx),iy-b.sy,ex-ix,ey-iy,
       dx,dy,dw,dh);
   }
   ctx.restore();return true;
 }
 window.ZikaStageAnimator=Object.freeze({
   paint,
   preparedStages:()=>Object.keys(zones),
   remainingStages:()=>window.ZikaFighterStages?.all?.()
     .filter(s=>!zones[s.id]).map(s=>s.id)||[]
 });
})();