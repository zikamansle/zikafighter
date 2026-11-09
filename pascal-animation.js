/* Pascal — lecteur d'animations 2D. Test local du pack PNG individuel.
   Ne modifie jamais les portraits validés et ne reconstruit pas les sprites.
   Le pack de test est conservé dans IndexedDB sur le navigateur de l'utilisateur. */
(()=>{'use strict';
if(window.ZikaPascalAnimation)return;
const categoryLabels={
 attente:'Attente',marche_avant:'Marche avant',marche_arriere:'Marche arrière',
 descente_accroupie:'Descente accroupie',garde_accroupie:'Garde accroupie',
 retour_debout:'Retour debout',garde_debout:'Garde debout',
 saut_neutre:'Saut neutre',saut_avant:'Saut avant',saut_arriere:'Saut arrière',
 reception:'Réception',etourdi:'Étourdi',releve:'Relevé',
 jab:'Jab',direct:'Direct',crochet:'Crochet',uppercut:'Uppercut',
 pied_bas:'Pied bas',pied_moyen:'Pied moyen',pied_haut:'Pied haut',balayage:'Balayage',
 poing_leger_accroupi:'Poing léger accroupi',poing_moyen_accroupi:'Poing moyen accroupi',
 poing_fort_accroupi:'Poing fort accroupi',pied_leger_accroupi:'Pied léger accroupi',
 pied_moyen_accroupi:'Pied moyen accroupi',pied_fort_accroupi:'Pied fort accroupi',
 poings_aeriens:'Poings aériens',pieds_aeriens:'Pieds aériens',
 touche_leger:'Touché léger',touche_moyen:'Touché moyen',touche_fort:'Touché fort',
 touche_accroupi:'Touché accroupi',vague_de_paume:'Vague de paume',
 charge_francaise:'Charge française',coup_de_boule:'Coup de boule',
 prise_du_bricoleur:'Prise du bricoleur',chute_arriere:'Chute arrière',
 chute_avant:'Chute avant',etat_au_sol:'État au sol',ko:'K.O.',
 releve_apres_ko:'Relevé après K.O.',victoire:'Victoire',victoire_alternative:'Victoire alternative'
};
const available=Object.create(null), objectUrls=[];
const essentialPoses=Object.freeze([
 'attente','marche_avant','marche_arriere','saut_neutre','saut_avant','saut_arriere',
 'garde_debout','jab','pied_moyen','charge_francaise','touche_moyen','ko'
]);
const readyListeners=new Set();
let essentialReady=false;
let idleReady=false;
const allEssentialsLoaded=()=>essentialPoses.every(p=>available[p]?.length>0);
const lastPose=new WeakMap();
const oneShot=new Set(['descente_accroupie','retour_debout','reception','releve',
 'jab','direct','crochet','uppercut','pied_bas','pied_moyen','pied_haut','balayage',
 'poings_aeriens','pieds_aeriens','charge_francaise','vague_de_paume','coup_de_boule',
 'prise_du_bricoleur','touche_leger','touche_moyen','touche_fort',
 'touche_accroupi','chute_arriere','chute_avant','ko','releve_apres_ko','victoire','victoire_alternative']);
const speedFor=pose=>/marche/.test(pose)?12:/jab|direct|crochet|pied_|poing_|uppercut|balayage/.test(pose)?14:/charge|vague|boule|bricoleur/.test(pose)?12:9;
const counts=Object.create(null),fps=Object.create(null);
Object.keys(categoryLabels).forEach(k=>{counts[k]=0;fps[k]=speedFor(k);});
const url=(pose,i)=>'./assets/fighters/pascal/original/'+pose+'/'+String(i+1).padStart(2,'0')+'.png';
function install(pose,images){
 if(!categoryLabels[pose]||!Array.isArray(images)||images.length<1||
    !images.every(im=>im&&im.complete&&im.naturalWidth>0))return false;
 available[pose]=images.slice();counts[pose]=images.length;
 if(pose==='attente'&&images.length){
   idleReady=true;
   for(const callback of readyListeners){callback(true);}
   readyListeners.clear();
 }
 return true;
}
function poseFor(f,now){
 if(f.health<=0)return 'ko';
 if(now<f.stunUntil)return 'touche_moyen';
 if(now<f.actionUntil){
  if(f.action==='special')return 'charge_francaise';
  if(f.action==='kick')return 'pied_moyen';
  if(f.action==='punch')return 'jab';
 }
 if(f.y<754){
  const advance=(f.vx||0)*(f.dir||1);
  return Math.abs(advance)<20?'saut_neutre':advance>0?'saut_avant':'saut_arriere';
 }
 if(f.guard)return 'garde_debout';
 if(Math.abs(f.vx||0)>8)return (f.vx||0)*(f.dir||1)>=0?'marche_avant':'marche_arriere';
 return 'attente';
}
function state(f,now){
 const pose=poseFor(f,now),list=available[pose];
 const old=lastPose.get(f);
 if(!old||old.pose!==pose){lastPose.set(f,{pose,start:now});return {pose,frame:0};}
 const count=list?.length||1;
 const current=Math.floor(Math.max(0,now-old.start)*speedFor(pose)/1000);
 return {pose,frame:oneShot.has(pose)?Math.min(count-1,current):current%count};
}
function waitForIdle(timeoutMs=14000){
 if(available.attente?.length)return Promise.resolve(true);
 return new Promise(resolve=>{
   let done=false;
   function finish(ok){
     if(done)return;
     done=true;readyListeners.delete(finish);clearTimeout(timer);resolve(!!ok);
   }
   const timer=setTimeout(()=>finish(false),timeoutMs);
   readyListeners.add(finish);
 });
}
function draw(ctx,f,now){
 // Un seul atlas de personnage : jamais d'ancien portrait, jamais de changement d'échelle.
 const {pose,frame}=state(f,now);
 const seq=available[pose]||available.attente;
 const sprite=seq?.[Math.min(frame,seq.length-1)]||available.attente?.[0];
 if(!sprite)return false;
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 // Même échelle visuelle et même ancrage sur toute l'animation.
 const scale=442/105;
 ctx.drawImage(sprite,-128*scale,-226*scale,256*scale,256*scale);
 ctx.restore();
 return true;
}
function readZip(buffer){
 const v=new DataView(buffer),len=buffer.byteLength;
 let end=-1;
 for(let i=len-22;i>=Math.max(0,len-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Archive ZIP invalide.');
 const n=v.getUint16(end+10,true),offset=v.getUint32(end+16,true),out=[];
 let p=offset;
 for(let j=0;j<n;j++){
  if(p+46>len||v.getUint32(p,true)!==0x02014b50)throw Error('Répertoire ZIP invalide.');
  const method=v.getUint16(p+10,true),size=v.getUint32(p+20,true),original=v.getUint32(p+24,true);
  const nameLen=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true);
  const local=v.getUint32(p+42,true);
  const name=new TextDecoder().decode(new Uint8Array(buffer,p+46,nameLen));
  p+=46+nameLen+extra+comment;
  const m=/\/sprites\/original\/([a-z0-9_]+)\/(\d{2})\.png$/i.exec(name);
  if(!m||!(m[1] in categoryLabels))continue;
  if(local+30>len||v.getUint32(local,true)!==0x04034b50)continue;
  const pos=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);
  if(size>3000000||original>4000000||pos+size>len)continue;
  out.push({pose:m[1],index:Number(m[2]),method,
   bytes:new Uint8Array(buffer,pos,size),original});
 }
 if(!out.length)throw Error('Aucun PNG Pascal original trouvé dans le ZIP.');
 return out;
}
async function inflate(entry){
 if(entry.method===0)return entry.bytes;
 if(entry.method!==8||typeof DecompressionStream==='undefined')
  throw Error('Décompression ZIP non prise en charge par ce navigateur.');
 const raw=new Blob([entry.bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 return new Uint8Array(await new Response(raw).arrayBuffer());
}
async function loadPack(blob,report){
 if(blob.size>120000000)throw Error('ZIP trop volumineux.');
 const entries=readZip(await blob.arrayBuffer());
 const groups=Object.create(null),loaded=[];
 for(const entry of entries){
  try{
   const b=await inflate(entry);
   if(b[0]!==137||b[1]!==80||b[2]!==78||b[3]!==71)continue;
   const objectUrl=URL.createObjectURL(new Blob([b],{type:'image/png'}));
   const im=new Image();im.src=objectUrl;await im.decode();
   if(!groups[entry.pose])groups[entry.pose]=[];
   groups[entry.pose].push([entry.index,im]);
   loaded.push(objectUrl);
  }catch(err){console.warn('Pascal: image ignorée',entry.pose,entry.index,err);}
 }
 let accepted=0,frames=0;
 for(const [pose,group] of Object.entries(groups)){
  group.sort((a,b)=>a[0]-b[0]);
  const consecutive=group.every(([num],i)=>num===i+1);
  if(!consecutive)continue;
  if(install(pose,group.map(x=>x[1]))){accepted++;frames+=group.length;}
 }
 if(!accepted){loaded.forEach(URL.revokeObjectURL);throw Error('Aucune animation exploitable.');}
 essentialReady=allEssentialsLoaded();
 objectUrls.splice(0).forEach(URL.revokeObjectURL);
 objectUrls.push(...loaded);
 if(report)report(accepted+' animations et '+frames+' PNG chargés pour Pascal.');
 window.dispatchEvent(new CustomEvent('zika:pascal-sprites-loaded',{detail:{accepted,frames}}));
 return {accepted,frames};
}
function database(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(Error('Stockage indisponible.'));
  const r=indexedDB.open('zikafighter-pascal-test-pack',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('assets');
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function cachedPack(){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('assets','readonly'),req=tx.objectStore('assets').get('current');
  req.onsuccess=()=>{resolve(req.result);db.close();};
  req.onerror=()=>{reject(req.error);db.close();};
 });
}
async function savePack(blob){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put(blob,'current');
  tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};
 });
}
function mountControls(){
 const host=document.getElementById('fight');
 if(!host)return;
 const panel=document.createElement('details');panel.id='pascal-sprite-test';
 panel.style.cssText='margin:10px auto;max-width:450px;padding:8px 12px;border:1px solid #8086af;background:#090c28;color:#fff;font:12px Arial,sans-serif;text-align:left';
 const summary=document.createElement('summary');
 summary.textContent='PASCAL — TEST DES SPRITES PNG';summary.style.cursor='pointer';
 panel.appendChild(summary);
 const message=document.createElement('p');message.textContent='Choisir le ZIP Pascal pour afficher ses animations dans le combat. Le navigateur le conserve pour les prochaines parties.';panel.appendChild(message);
 const input=document.createElement('input');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','Charger les sprites ZIP de Pascal');panel.appendChild(input);
 const status=document.createElement('p');status.style.color='#e7dd9d';status.textContent='Aucun ZIP chargé.';panel.appendChild(status);
 const select=document.createElement('select');select.setAttribute('aria-label','Animation de Pascal');
 select.style.cssText='display:block;max-width:100%;margin:8px 0;color:#111;background:white;padding:4px';
 panel.appendChild(select);
 const preview=document.createElement('canvas');preview.width=240;preview.height=240;
 preview.style.cssText='display:block;max-width:100%;background:#101c36;border:1px solid #61719a;image-rendering:pixelated';
 panel.appendChild(preview);
 host.appendChild(panel);
 const announce=s=>{status.textContent=s;updateList();};
 function updateList(){
  const current=select.value;
  select.replaceChildren();
  Object.keys(available).sort((a,b)=>categoryLabels[a].localeCompare(categoryLabels[b],'fr')).forEach(k=>{
   const option=document.createElement('option');option.value=k;
   option.textContent=categoryLabels[k]+' ('+available[k].length+' images)';
   select.appendChild(option);
  });
  if(available[current])select.value=current;
 }
 input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;
  status.textContent='Chargement des PNG...';input.disabled=true;
  try{await loadPack(file,announce);await savePack(file);}
  catch(err){status.textContent='Erreur : '+(err?.message||err);console.error(err);}
  finally{input.disabled=false;}
 };
 let previewStart=performance.now(),lastChoice='';
 function tick(now){
  if(panel.open&&select.value&&available[select.value]?.length){
   if(select.value!==lastChoice){previewStart=now;lastChoice=select.value;}
   const seq=available[select.value],index=Math.floor((now-previewStart)*speedFor(select.value)/1000)%seq.length;
   const ctx=preview.getContext('2d');ctx.clearRect(0,0,240,240);
   ctx.imageSmoothingEnabled=false;ctx.drawImage(seq[index],120-128*1.9,215-227*1.9,256*1.9,256*1.9);
  }
  requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
 // Le pack hébergé sur GitHub est prioritaire ; le chargement ZIP reste manuel.
}

/* Les vrais PNG sont chargés automatiquement depuis le dépôt (pas de ZIP à choisir). */
let hostedStatus='pending';
async function preloadHostedSprites(){
 if(hostedStatus==='loading'||hostedStatus==='done')return;
 hostedStatus='loading';
 const status=document.querySelector('#pascal-sprite-test p:last-of-type');
 try{
  const res=await fetch('./assets/fighters/pascal/manifest.json?v=zf-20261109-pascal-realtime-v70',{cache:'no-store'});
  if(!res.ok)throw Error('Manifeste non publié (HTTP '+res.status+').');
  const manifest=await res.json();
  if(manifest.character!=='Pascal'||!manifest.counts||manifest.normalized!==true)throw Error('Manifeste Pascal normalisé absent.');
  const primary=essentialPoses;
  const poses=Object.keys(manifest.counts).filter(k=>k in categoryLabels);
  const order=[...primary.filter(k=>poses.includes(k)),...poses.filter(k=>!primary.includes(k))];
  let groups=0,frames=0;
  for(const pose of order){
   const n=Number(manifest.counts[pose]);
   if(!Number.isInteger(n)||n<1||n>50)continue;
   const images=await Promise.all(Array.from({length:n},(_,i)=>new Promise(resolve=>{
    const im=new Image();im.decoding='async';
    im.onload=()=>resolve(im);im.onerror=()=>resolve(null);
    im.src=url(pose,i)+'?v=zf-20261109-pascal-normalized-v68';
   })));
   if(images.every(im=>im&&im.naturalWidth>0)&&install(pose,images)){
    groups++;frames+=n;
    if(status)status.textContent='Pascal : '+groups+' animations chargées automatiquement ('+frames+' images).';
   }
  }
  if(!allEssentialsLoaded())throw Error('Animations principales incomplètes : impossible d’éviter le changement d’échelle.');
  essentialReady=true;
  hostedStatus='done';
  const zipInput=document.querySelector('#pascal-sprite-test input[type=file]');
  if(zipInput)zipInput.disabled=true;
  window.dispatchEvent(new CustomEvent('zika:pascal-sprites-loaded',{detail:{accepted:groups,frames,source:'github'}}));
  if(status)status.textContent='Pascal animé : '+groups+' animations et '+frames+' PNG. Taille de rendu fixe, aucun mélange avec l’ancien portrait.';
 }catch(err){
  hostedStatus='failed';console.warn('Pascal : téléchargement automatique',err);
  if(status)status.textContent='Chargement des sprites indisponible : '+err.message;
 }
}

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',mountControls,{once:true});
 document.addEventListener('DOMContentLoaded',preloadHostedSprites,{once:true});
}else{
 mountControls();
 preloadHostedSprites();
}
window.ZikaPascalAnimation=Object.freeze({
 counts,fps,url,install,state,draw,ready:()=>Object.keys(available),
 consistentSizeReady:()=>essentialReady,waitForIdle,loadPack
});
})();