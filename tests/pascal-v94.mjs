import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='assets/fighters/pascal/v94';
const master='assets/fighters/pascal/reference/maitre-valide-256.png';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const main=fs.readFileSync('index.html','utf8');
const loader=fs.readFileSync('pascal-animation.js','utf8');
assert.equal(manifest.revision,'v94');
assert.equal(manifest.normalized,true);
assert.equal(manifest.verifiedCrouch,true);
assert.equal(Object.keys(manifest.counts).length,44);
assert.equal(Object.values(manifest.counts).reduce((a,b)=>a+b,0),316);
assert(loader.includes("v94/original/"),'Must load the new Pascal pack in real combat');
assert(loader.includes("v94/manifest.json"),'Must check the new pack manifest');
assert(loader.includes("get('pascal')!=='preview-v94'"),'Unapproved v94 must not load by default');
assert(main.includes('zf-20261110-pascal-v94-full-frames'),'Browser build cache bust is missing');
assert(fs.existsSync(master),'Approved Pascal master not present');
let total=0;
for(const palette of ['original','bleu']){
 for(const [pose,n] of Object.entries(manifest.counts)){
  for(let i=1;i<=n;i++){
   const file=path.join(root,palette,pose,String(i).padStart(2,'0')+'.png');
   assert(fs.existsSync(file),'Missing independent Pascal sprite '+file);
   const data=fs.readFileSync(file);
   assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);
   assert.equal(data.readUInt32BE(16),256,file);
   assert.equal(data.readUInt32BE(20),256,file);
   assert(data.length>200,'Suspect PNG '+file);
   total++;
  }
 }
}
assert.equal(total,632);
console.log('PASS Pascal v94 — 44 animations, 632 separate 256px PNG, updated live loader and revert option.');
