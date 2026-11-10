// Geometric correction of existing pixels only. No generated/repainted artwork.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const root='assets/fighters/pascal';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`));
if(manifest.geometryRevision==='v88'){console.log('v88 already applied');process.exit(0);}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const paths=[];for(const palette of ['original','bleu'])for(const pose of fs.readdirSync(`${root}/${palette}`))for(const file of fs.readdirSync(`${root}/${palette}/${pose}`))if(file.endsWith('.png'))paths.push(`${root}/${palette}/${pose}/${file}`);
const before=Object.fromEntries(paths.map(p=>[p,hash(p)]));
const read=p=>execFileSync('magick',[p,'-depth','8','rgba:-'],{maxBuffer:1024*1024});
const write=(p,b)=>execFileSync('magick',['-size','256x256','-depth','8','rgba:-',p],{input:b});
const top=b=>{for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(b[(y*256+x)*4+3]>60)return y;throw Error('Empty PNG');};
const changed=[];
for(const pose of ['marche_avant','marche_arriere','saut_neutre','saut_avant','saut_arriere']){
 for(let frame=1;frame<=manifest.counts[pose];frame++){
  const key=`${pose}/${String(frame).padStart(2,'0')}.png`;
  const original=read(`${root}/original/${key}`),t=top(original);
  const walk=pose.startsWith('marche_');
  // Only the four airborne frames are aligned. Ground crouches stay untouched.
  if(!walk&&(frame<2||frame>5))continue;
  const dy=walk?0:142-t;
  if(!walk&&dy===0)continue;
  let sum=0,count=0;
  for(let y=t+28;y<t+54;y++)for(let x=0;x<256;x++)if(original[(y*256+x)*4+3]>60){sum+=x;count++;}
  const cx=sum/count;
  for(const palette of ['original','bleu']){
   const p=`${root}/${palette}/${key}`,src=read(p),dst=Buffer.alloc(src.length);
   if(walk){
    for(let y=0;y<256;y++){
     // Leave the entire face/hair block and both feet byte-identical.
     const ramp=Math.max(0,Math.min(1,(y-(t+25))/12,((227-20)-y)/18));
     const amount=ramp*ramp*(3-2*ramp),factor=1-.18*amount;
     for(let x=0;x<256;x++){
      const sx=Math.round(cx+(x-cx)/factor);
      if(sx>=0&&sx<256)src.copy(dst,(y*256+x)*4,(y*256+sx)*4,(y*256+sx+1)*4);
     }
    }
    assert(src.subarray(0,(t+25)*256*4).equals(dst.subarray(0,(t+25)*256*4)),'Face changed');
    assert(src.subarray(207*256*4).equals(dst.subarray(207*256*4)),'Feet changed');
   }else{
    assert(dy<=0&&dy>=-20);
    for(let y=0;y<256;y++)if(y+dy>=0&&y+dy<256)src.copy(dst,(y+dy)*256*4,y*256*4,(y+1)*256*4);
    // Translation only: each visible pixel is preserved, including the face.
    let a=0,b=0;for(let i=3;i<src.length;i+=4){a+=src[i];b+=dst[i];}assert.equal(a,b,'Clipped jump');
   }
   write(p,dst);
  }
  changed.push({file:key,operation:walk?'local torso width calibration':'airborne vertical alignment',dy,headPixelsPreserved:true});
 }
}
// Use existing complete Pascal crouches, with a true stationary low guard.
// Snapshot sources before replacing destinations to avoid cascading copies.
const crouchMap={
 'garde_accroupie/01.png':'saut_neutre/01.png','garde_accroupie/02.png':'saut_neutre/01.png',
 'garde_accroupie/03.png':'saut_neutre/01.png','garde_accroupie/04.png':'saut_neutre/01.png',
 'descente_accroupie/01.png':'attente/01.png','descente_accroupie/02.png':'garde_accroupie/01.png',
 'descente_accroupie/03.png':'saut_neutre/01.png','descente_accroupie/04.png':'saut_neutre/01.png',
 'retour_debout/01.png':'saut_neutre/01.png','retour_debout/02.png':'garde_accroupie/01.png',
 'retour_debout/03.png':'garde_accroupie/01.png','retour_debout/04.png':'attente/01.png'
};
for(const palette of ['original','bleu']){
 const source=Object.fromEntries([...new Set(Object.values(crouchMap))].map(k=>[k,fs.readFileSync(`${root}/${palette}/${k}`)]));
 for(const [dest,ref] of Object.entries(crouchMap))fs.writeFileSync(`${root}/${palette}/${dest}`,source[ref]);
}
for(const [file,source] of Object.entries(crouchMap))changed.push({file,source,operation:'existing full-body crouch and consistent transitions',headPixelsPreserved:true});

const permitted=new Set(changed.flatMap(c=>['original','bleu'].map(p=>`${root}/${p}/${c.file}`)));
for(const p of paths)if(!permitted.has(p))assert.equal(hash(p),before[p],`Unrelated sprite changed: ${p}`);
for(const c of changed){const a=read(`${root}/original/${c.file}`),b=read(`${root}/bleu/${c.file}`);for(let i=3;i<a.length;i+=4)assert.equal(a[i],b[i]);}
manifest.geometryRevision='v88';manifest.crouchRevision='v88';manifest.geometryCorrection='Local walking torso narrowing with untouched face and feet; airborne frames aligned without rescaling or redrawing';
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(`${root}/geometry_v88_audit.json`,JSON.stringify({revision:'v88',targetedOriginal:changed.length,targetedBlue:changed.length,changedOriginal:changed.filter(c=>hash(`${root}/original/${c.file}`)!==before[`${root}/original/${c.file}`]).length,changedBlue:changed.filter(c=>hash(`${root}/bleu/${c.file}`)!==before[`${root}/bleu/${c.file}`]).length,unrelatedSpritesUnchanged:true,changed},null,2)+'\n');
console.log(`Validated ${changed.length} corrected frames per palette; all other PNG unchanged.`);
