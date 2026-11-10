import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync('pascal-animation.js','utf8');
const manifest=JSON.parse(fs.readFileSync('assets/fighters/pascal/manifest.json'));
const api=new Function('window','document',src+';return window.ZikaPascalAnimation;')({}, {readyState:'loading',addEventListener(){}});
for(const [pose,n] of Object.entries(manifest.counts))api.install(pose,Array.from({length:n},()=>({complete:true,naturalWidth:256})));
const f=()=>({health:100,x:0,y:754,dir:1,vx:0,actionUntil:0,stunUntil:0});
for(const pose of ['saut_neutre','saut_avant','saut_arriere']){
 const fighter={...f(),y:700,jumpPose:pose,jumpStartedAt:100};
 for(let t=100;t<1000;t+=10){const s=api.state(fighter,t);assert.equal(s.pose,pose);assert(s.frame>=1&&s.frame<=4,'Ground crouch shown in flight');}
 fighter.y=754;fighter.landUntil=1150;fighter.landingStartedAt=1000;
 assert.equal(api.state(fighter,1010).pose,'reception');
 assert.equal(api.state(fighter,1160).pose,'retour_debout','Landing jumps directly to standing');
 assert.equal(api.state(fighter,1300).pose,'attente');
}
for(const vx of [-100,0,100]){
 const fighter={...f(),vx};const calls=[];
 const ctx={save(){},restore(){},drawImage(...args){calls.push(args)}};
 for(let t=0;t<1000;t+=25)api.draw(ctx,fighter,t);
 const widths=new Set(calls.map(c=>c[3]));assert.equal(widths.size,1,'Scale changes within walking cycle');
 for(const [,x,y,w,h] of calls){assert.equal(w,h,'Nonuniform sprite stretch');assert(Math.abs(y+227/256*h)<1e-8,'Feet drift off floor');assert(Math.abs(x+128/256*w)<1e-8,'Anchor drifts');}
}
console.log('PASS — stable walk scale, foot anchor, airborne frames, landing transition');
