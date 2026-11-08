// Tests de non-régression — Zika Fighter / référence SFII Turbo SNES
// Exécuter à la racine : node tests/smoke-static.mjs
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read=path=>readFileSync(join(root,path),'utf8');
const html=read('index.html');
const select=read('character-select.js');
const selectCss=read('character-select.css');
const stages=read('stage-select.js');
const stageCss=read('stage-select.css');
const stageAudio=read('stage-audio.js');
const fightersData=JSON.parse(read('data/fighters.json'));
const stageData=JSON.parse(read('data/stages.json'));

const fighterCount=fightersData.fighters.length;
assert.equal(fighterCount,20,'La grille doit comporter les 20 combattants humains');
assert.equal(new Set(fightersData.fighters.map(f=>f.name)).size,20,'Noms humains uniques');
assert.equal(fightersData.bonus.name,'Zika','Zika est uniquement le bonus');
assert.equal(stageData.stageConcepts.length,21,'21 arènes prévues');
assert.equal(stageData.stageConcepts.filter(s=>!s.bonus).length,20,'20 arènes initiales');
assert.equal(stageData.stageConcepts.filter(s=>s.bonus).length,1,'1 arène bonus');
for(const stage of stageData.stageConcepts){
  assert.ok(existsSync(join(root,'assets/audio',stage.audio)),
    'Annonce audio manquante : '+stage.audio);
}
assert.equal((stageAudio.match(/"imageUrl":/g)||[]).length,21,
  'Chaque arène doit conserver son illustration originale');
assert.match(stageAudio,/!s\.bonus\|\|zikaUnlocked\(\)/,'Arène bonus verrouillée');
assert.match(select,/visibleCount=\(\)=>zikaUnlocked\(\)\?21:20/,
  'Zika doit être masqué avant le déblocage');
assert.match(selectCss,/grid-template-columns:repeat\(7,/,
  'Grille 7–7–6 obligatoire');
assert.match(selectCss,/grid-template-rows:repeat\(3,/,
  'Trois rangées de combattants');
assert.match(selectCss,/object-fit:contain/,
  'Ne jamais déformer les portraits approuvés');
assert.doesNotMatch(selectCss,/object-fit:fill/,
  'Le rendu object-fit:fill déforme les portraits');

assert.match(stageCss,/#select #zf-stage-screen\{\s*position:absolute;top:62%/,
  'Arènes dans le bandeau inférieur de la sélection');
assert.match(stages,/s\.imageUrl/,
  'Le bandeau doit utiliser l’illustration propre à chaque arène');
assert.doesNotMatch(stages,/backgroundSize='700% 300%'/,
  'Ne pas revenir au montage d’arènes 7×3');

const canvas=html.match(/<canvas id="game" width="(\d+)" height="(\d+)"/);
assert.ok(canvas,'Canvas de combat introuvable');
assert.equal(Number(canvas[1])/Number(canvas[2]),4/3,
  'Combat : résolution strictement 4:3');
assert.match(html,/\.scene\{position:relative;aspect-ratio:4 \/ 3;/,
  'Combat : affichage CSS strictement 4:3');
assert.match(html,/const W=1152,H=864, floor=754;/,
  'Le moteur doit utiliser les dimensions du canvas');
assert.match(html,/const sw=Math\.min\(bg\.naturalWidth,bg\.naturalHeight\*W\/H\)/,
  'Les décors doivent être recadrés, jamais étirés');
assert.match(html,/stage-select\.js\?/,'Le choix des arènes doit être chargé');
for(const path of [
  'data/approved-portrait-thumbs.js','data/approved-portrait-heroes.js'
]){
  assert.ok(existsSync(join(root,path)),'Portraits validés manquants : '+path);
  assert.ok(html.includes('./'+path+'?'),'Portraits non chargés : '+path);
}

const embedded=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(embedded,'Moteur principal introuvable');
new vm.Script(embedded[1],{filename:'index-inline.js'});
for(const path of [
  'arcade-audio.js','arcade-intro.js','character-select.js','stage-select.js',
  'stage-audio.js','screen-transitions.js'
]){
  new vm.Script(read(path),{filename:path});
}
console.log('Zika Fighter : tests statiques OK — '+fighterCount+
  ' combattants, 21 arènes, format 4:3, portraits préservés.');
console.log('Attention : contrôle visuel, audio et combat réel encore à effectuer.');
