// Zika Fighter — tests de combat sans navigateur ni assets externes.
// Régression : sauts, garde, impact, projectiles, ombre, arène sans ligne.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const pascal=fs.readFileSync('pascal-animation.js','utf8');
const start=html.lastIndexOf('<script>const ASSETS=');
const finish=html.indexOf('</script>',start);
assert(start>=0&&finish>start,'Moteur intégré absent');
new Function(html.slice(start+8,finish));
new Function(pascal);
assert(!html.includes('ctx.fillRect(0,floor,W,3)'),'Ligne artificielle sur le décor');
assert(!html.includes("kind:'ring'"),'Halo parasite dans le combat');
assert(!html.includes("ctx.ellipse(0,0,57,11"),'Ancienne ombre ovale flottante');

function extract(a,b){
 const i=html.indexOf(a),j=html.indexOf(b,i);
 assert(i>=0&&j>i,'Fonctions moteur introuvables : '+a);
 return html.slice(i,j);
}
function fighter(name,x,dir){
 return {name,x,y:754,vx:0,vy:0,dir,health:100,energy:80,guard:false,
  action:'idle',actionUntil:0,nextAttack:0,stunUntil:0,hitDone:false,
  invulnerable:0,hitKind:null,hitAt:0,jumpPose:null,
  jumpStartedAt:0,landUntil:0,landingStartedAt:0};
}
function simulator(){
 const p=fighter('pascal',290,1),e=fighter('micka',470,-1),effects=[];
 const window={ZikaArcadeAudio:{playEffect(){}}};
 const src=extract('function move(f,inp,dt,now){','function ai(now){');
 const fns=new Function('window','p','e','effects','W','floor','gameSettings',
  src+'\nreturn {move,strike,attack,resolveAttack};')(
  window,p,e,effects,1152,754,{turbo:3});
 return {p,e,effects,...fns};
}
let sim=simulator();
const blank={left:false,right:false,jump:false,punch:false,kick:false,special:false,guard:false};
sim.move(sim.p,{...blank,right:true,jump:true},1/60,3000);
assert(sim.p.y<754&&sim.p.jumpPose==='saut_avant','Le saut ne décolle pas');
let timestamp=3000+1000/60;
for(let i=1;i<=60;i++,timestamp+=1000/60)
 sim.move(sim.p,{...blank,...(i<20?{right:true}:{left:true})},1/60,timestamp);
assert.equal(sim.p.y,754,'Le personnage ne rejoint plus le sol');
assert.equal(sim.p.jumpPose,null,'La pose de saut ne se réinitialise pas');
assert(sim.p.landUntil>sim.p.landingStartedAt,'La réception ne se déclenche pas');

sim=simulator();
sim.attack(sim.p,'punch',1000);
assert.equal(sim.e.health,100,'Coup porté avant le contact');
sim.resolveAttack(sim.p,sim.e,1030);
assert.equal(sim.e.health,100,'Coup porté trop tôt');
sim.resolveAttack(sim.p,sim.e,1130);
assert.equal(sim.e.health,91,'Le coup de poing ne touche plus');
sim.resolveAttack(sim.p,sim.e,1140);
assert.equal(sim.e.health,91,'Le même coup frappe deux fois');
sim.attack(sim.e,'special',2000);
assert(!sim.effects.some(f=>f.kind==='projectile'),'Projectile lancé avant le contact');
sim.resolveAttack(sim.e,sim.p,2300);
assert(sim.effects.some(f=>f.kind==='projectile'),'Projectile manquant');
sim.p.y=700;
const beforeEnergy=sim.p.energy;
sim.attack(sim.p,'special',2500);
assert.equal(sim.p.energy,beforeEnergy,'Charge au sol autorisée en plein vol');

const cb=[];
const fakeDocument={readyState:'loading',addEventListener:(n,f)=>cb.push(f)};
const player=new Function('window','document',
 pascal+'\nreturn window.ZikaPascalAnimation;')({},fakeDocument);
const poses=['attente','saut_neutre','saut_avant','saut_arriere','poings_aeriens',
 'pieds_aeriens','reception','charge_francaise','garde_accroupie','garde_debout',
 'marche_avant','marche_arriere','jab','pied_moyen','descente_accroupie','retour_debout'];
for(const pose of poses)
 player.install(pose,Array.from({length:8},()=>({complete:true,naturalWidth:256})));
const f=fighter('pascal',300,1);
f.y=690;f.jumpPose='saut_avant';f.jumpStartedAt=100;
const air=player.state(f,300);
assert.equal(air.pose,'saut_avant');
assert(air.frame>=1&&air.frame<=4,'Pose au sol utilisée en milieu de vol');
f.action='punch';f.actionUntil=500;
assert.equal(player.state(f,310).pose,'poings_aeriens','Coup aérien non animé');
f.action='kick';
assert.equal(player.state(f,320).pose,'pieds_aeriens','Pied aérien non animé');
f.y=754;f.actionUntil=0;f.landingStartedAt=600;f.landUntil=750;
assert.equal(player.state(f,620).pose,'reception','Atterrissage non animé');

// La nouvelle ombre reste sur la ligne du sol, jamais sous un sprite en vol.
const rectangles=[];
const ctx={save(){},restore(){},fillRect(...args){rectangles.push(args)}};
const shadowSrc=extract('function drawFloorShadow(f){','function drawFigure(f,now){');
const drawShadow=new Function('ctx','floor',
 shadowSrc+'\nreturn drawFloorShadow;')(ctx,754);
drawShadow({x:300,y:640});
assert(rectangles.length>=2,'Ombre pixelisée absente');
assert(rectangles.every(r=>r[1]>=750),'L\'ombre flotte sous le personnage');
assert(rectangles.every(r=>r.every(Number.isFinite)),'Ombre à géométrie invalide');

console.log('PASS — Zika Fighter v85 : animations, sauts, impact unique, projectile, ombre, stage.');
