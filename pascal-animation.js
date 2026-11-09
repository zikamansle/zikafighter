/* Pascal — logique de poses et lecteur de sprites frame par frame.
   Aucune déformation du portrait, et aucun faux sprite généré.
   Les vrais PNG des poses seront installés dans assets/fighters/pascal/.
*/
(()=>{'use strict';
 if(window.ZikaPascalAnimation)return;
 const fps=Object.freeze({
   idle:8,walk:12,jump:10,crouch:8,guard:8,
   punch:14,kick:12,special:12,hit:10,ko:8,victory:8
 });
 const counts=Object.freeze({
   idle:4,walk:6,jump:4,crouch:2,guard:2,
   punch:4,kick:5,special:6,hit:3,ko:5,victory:5
 });
 const once=new Set(['punch','kick','special','hit','ko','victory','jump']);
 const available=Object.create(null);
 const lastPose=new WeakMap();
 const url=(pose,i)=>'./assets/fighters/pascal/'+pose+'/'+String(i+1).padStart(2,'0')+'.png';
 function install(pose,images){
   if(!Object.hasOwn(counts,pose)||!Array.isArray(images)||images.length!==counts[pose])return false;
   if(!images.every(image=>image?.complete&&image.naturalWidth>0))return false;
   available[pose]=images.slice();
   return true;
 }
 function state(f,now){
   let pose='idle';
   if(f.health<=0)pose='ko';
   else if(now<f.stunUntil)pose='hit';
   else if(now<f.actionUntil&&['punch','kick','special'].includes(f.action))pose=f.action;
   else if(f.y<754)pose='jump';
   else if(f.guard)pose='guard';
   else if(Math.abs(f.vx)>8)pose='walk';
   const previous=lastPose.get(f);
   if(!previous||previous.pose!==pose){
     lastPose.set(f,{pose,start:now});
     return {pose,frame:0};
   }
   const elapsed=Math.max(0,now-previous.start);
   const raw=Math.floor(elapsed*fps[pose]/1000);
   return {pose,frame:once.has(pose)?Math.min(counts[pose]-1,raw):raw%counts[pose]};
 }
 function draw(ctx,f,now){
   const {pose,frame}=state(f,now);
   const sprite=available[pose]?.[frame];
   if(!sprite)return false;
   ctx.save();
   ctx.imageSmoothingEnabled=false;
   // Le moteur parent place déjà le personnage à sa position, avec son orientation.
   // Une frame est une vraie image indépendante, jamais un portrait incliné/étiré.
   const height=442,width=sprite.naturalWidth*height/sprite.naturalHeight;
   ctx.drawImage(sprite,-width/2,-height,width,height);
   ctx.restore();
   return true;
 }
 window.ZikaPascalAnimation=Object.freeze({
   counts,fps,url,install,state,draw,ready:()=>Object.keys(available)
 });
})();