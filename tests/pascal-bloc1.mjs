import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='assets/fighters/pascal';
const manifest=JSON.parse(fs.readFileSync(root+'/bloc1/manifest.json','utf8'));
const audits=JSON.parse(fs.readFileSync(root+'/bloc1/qa.json','utf8'));
const loader=fs.readFileSync('pascal-animation.js','utf8');
const game=fs.readFileSync('index.html','utf8');
assert.equal(manifest.version,'bloc1-preview');
assert.equal(manifest.masterSHA256,crypto.createHash('sha256').update(fs.readFileSync(root+'/reference/maitre-valide-256.png')).digest('hex'));
assert.deepEqual(manifest.counts,{attente:8,garde_debout:4});
assert.equal(audits.length,12);
assert.equal(new Set(audits.map(x=>x.sourceHash)).size,12);
assert(loader.includes("const previewBloc1=pascalParams.get('pascal')==='bloc1'"));
assert(loader.includes("const bloc1Root='./assets/fighters/pascal/bloc1/original/'"));
assert(loader.includes("mountBloc1Controls();"));
assert(loader.includes("previewBloc1?[...essentialPoses,'garde_debout']"));
assert(game.includes('zf-20261110-pascal-bloc1-preview'));
for(const palette of ['original','bleu']){
 for(const [pose,number] of Object.entries(manifest.counts)){
  for(let i=1;i<=number;i++){
   const p=path.join(root,'bloc1',palette,pose,String(i).padStart(2,'0')+'.png');
   assert(fs.existsSync(p),'Missing individual frame '+p);
   const b=fs.readFileSync(p);
   assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(b.readUInt32BE(16),256);
   assert.equal(b.readUInt32BE(20),256);
  }
 }
}
assert(fs.existsSync(root+'/bloc1/ombre_sol.png'));
console.log('PASS Pascal bloc1: 8 idle + 4 standing guard, 24 PNG with 2 palettes, master locked, preview only.');
