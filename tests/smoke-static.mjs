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
// Nouvelle sélection : un seul repère 1P mobile et repère rouge 2P.
assert.ok(html.includes('portrait-thumbs-normalize.js?'),
  'Charger la normalisation des fonds et cadrages des miniatures');
assert.match(select,/function thumbnail\(i\)/,
  'Utiliser la vignette recadrée plutôt que la source entière');
assert.match(select,/normalizedThumbnails\[index\]/,
  'Mettre en cache les 20 vignettes homogénéisées');
assert.doesNotMatch(select,/font\.draw\(ctx,'1P',33,20/,
  'Ancien 1P fixe inutile');
assert.doesNotMatch(select,/font\.draw\(ctx,'1P',6,43/,
  'Deuxième 1P fixe inutile');
assert.match(select,/marker\(pointerCursor\[0\],'1P','cyan'\)/,
  'Conserver seulement le repère bleu du curseur 1P');
assert.match(select,/marker\(pointerCursor\[1\],'2P','red'\)/,
  'Le curseur 2P doit être rouge');
assert.match(select,/font\.draw\(ctx,fighters\[chosen\[0\]\]\.name,4,29/,
  'Nom du combattant 1 placé en haut du grand portrait');
assert.match(select,/font\.draw\(ctx,fighters\[chosen\[1\]\]\.name,316,29/,
  'Nom du combattant 2 placé en haut du grand portrait');
assert.match(selectCss,/zf-snes-cursor-red/,
  'Animation rouge distincte pour le curseur 2P');
assert.match(selectCss,/object-fit:cover/,
  'Un même cadrage sans marges pour les miniatures');
assert.ok(html.indexOf('<script defer src="./portrait-thumbs-normalize.js')<
          html.indexOf('<script defer src="./character-select.js'),
  'Normalisation des vignettes chargée avant la sélection');

// Aucun atlas de lettres inventé ne doit être réintroduit.
assert.ok(!html.includes('zf-pixel-lettering.js'),
  'Rejet de l’alphabet artificiel invalidé par l’utilisateur');
assert.ok(!select.includes('ZikaFighterPixelText'),
  'La sélection ne doit pas dépendre du faux lettrage');
for(const file of ['cps-1-fighter.woff2','sfii-large.woff2','sfii-large-colour.woff2']){
  assert.ok(existsSync(join(root,'assets/fonts',file)),
    'Police Street Fighter manquante : '+file);
}
assert.ok(!existsSync(join(root,'assets/snes-ui-letters.png')),
  'Le faux atlas source hybride ne doit plus exister');
const fontsCss=read('snes-fonts.css');
assert.match(fontsCss,/font-family:'ZikaCPS1'/,
  'CPS-1 Fighter doit exister dans les styles');
assert.match(fontsCss,/font-family:'ZikaSFII'/,
  'Street Fighter II Large doit exister dans les styles');
const introSrc=read('arcade-intro.js');
assert.match(introSrc,/function skipZikapcomToLogo\(\)/,
  'START sur ZIKAPCOM doit ouvrir la cinématique du logo');
assert.match(introSrc,/if\(closed\|\|phase!=='cinematic'/,
  'Seule la cinématique peut être passée directement vers PRESS START');
assert.match(introSrc,/legal\.addEventListener\('click',\(\)=>skipZikapcomToLogo\(\)\)/,
  'Le clic doit permettre de passer les crédits vers ZIKA FIGHTER');
assert.match(introSrc,/cinematic\.addEventListener\('click',\(\)=>skipIntroToPressStart\(\)\)/,
  'Le clic doit permettre de passer le logo vers PRESS START');

const introCss=read('arcade-intro.css');
assert.match(introSrc,/const CINEMATIC_LENGTH=5\.40;/,
  'Conserver les images de stabilisation de la rotation 30 FPS');
assert.match(introSrc,/coarseSprites=\[\[96,48\],\[104,52\]/,
  'Mosaïque SNES progressive obligatoire');
assert.match(introSrc,/paint\(giantLetters,x,82,width,Math\.round\(width\*\.27\)\)/,
  'Le mot ZIKA géant doit défiler, pas le logo entier');
assert.match(introSrc,/const progress=Math\.min\(1,frame\/76\)/,
  'ZIKA doit défiler en continu sans arrêt au milieu');
assert.match(introSrc,/prepareGiantZika\(\)/,
  'Le mot ZIKA doit être fabriqué indépendamment du logo');
assert.match(introSrc,/const band=titleMenuOpen&&!battleSubmenuOpen/,
  'Bandeaux de mode uniquement dans les choix TURBO ou NORMAL');
assert.match(introSrc,/if\(previewScreen==='cinematic'\)/,
  'Permettre les captures de chaque phase de l’introduction');
assert.match(introCss,/background-image:none!important/,
  'Interdire la vieille image bleue derrière le Canvas du titre');
assert.match(introCss,/\.zf-title-flash\{/,
  'Neutraliser les anciens flashs de la page titre');
assert.ok(/arcade-intro\\.js\\?v=zf-20261109-/.test(html),
  'Forcer le rechargement de la nouvelle introduction');
assert.ok(html.includes('snes-fonts.css?'),
  'Les polices doivent être intégrées au jeu entier');
assert.match(read('snes-ui-text.js'),/document\.fonts\.load/,
  'Le moteur doit attendre le chargement réel des polices');
assert.doesNotMatch(read('snes-ui-text.js'),/snes-ui-letters\.png/,
  'Le faux atlas mélangé ne doit plus être utilisé');
assert.ok(html.includes('snes-ui-text.js?'),
  'Le moteur d’écriture SNES doit être chargé');
assert.ok(html.indexOf('<script defer src="./snes-ui-text.js')<
          html.indexOf('<script defer src="./character-select.js'),
  'Charger la fonte bitmap avant la sélection');
assert.match(select,/window\.ZikaSNESText/,'Titres et noms en pixels SNES');
assert.ok(!read('arcade-intro.js').includes('Georgia,'),
  'Ne pas remettre des polices système dans les menus');
assert.ok(!read('arcade-intro.css').includes('"Courier New"'),
  'Ne pas réintroduire Courier dans l’interface rétro');

assert.doesNotMatch(select,/zfNameGlyphs/,'Supprimer le faux alphabet 7×9');
assert.doesNotMatch(select,/reference\.src=/,'Supprimer l’ancienne capture montée dans la page');
assert.match(stages,/zf-stage-title-pixels/,'Titre STAGE SELECT en pixels SNES');
assert.match(stages,/zf-stage-slot-name-bitmap/,'Noms d’arènes en pixels SNES');
assert.match(stages,/zf-flight-text/,'Transition des arènes en pixels SNES');
assert.doesNotMatch(selectCss,/background-image:url/,'Plus de faux bandeau de titre');
assert.doesNotMatch(selectCss,/filter:brightness/,'Ne pas faire clignoter les visages');
assert.doesNotMatch(stageCss,/filter:brightness/,'Ne pas éclaircir les arènes');
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
// Non-régression : aucune vieille page Pascal/Micka ne doit apparaître
// avant que l'introduction 16 bits soit montée.
assert.ok(html.includes('<section id="select" class="select" hidden>'),
  'Écran de sélection invisible tant que le menu SNES ne l’a pas ouvert');
assert.ok(!html.includes('Premier test des vrais visuels de Pascal et Micka'),
  'Ancien texte de sélection encore présent');
assert.ok(!html.includes('class="pickcard'),
  'Anciennes cartes de combattants encore présentes');
assert.ok(html.includes('html:not(.zf-intro-booted) body>main'),
  'Protection contre le flash du HTML avant l’introduction absente');
assert.ok(read('arcade-intro.js').includes("classList.add('zf-intro-booted')"),
  'Le montage de l’introduction doit activer la page après création du masque');
assert.ok(/arcade-intro\\.js\\?v=zf-20261109-/.test(html),
  'Le script de démarrage doit utiliser la version de cache courante');

for(const path of [
  'data/approved-portrait-thumbs.js','data/approved-portrait-heroes.js'
]){
  assert.ok(existsSync(join(root,path)),'Portraits validés manquants : '+path);
  assert.ok(html.includes('./'+path+'?'),'Portraits non chargés : '+path);
}

const embedded=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1);
assert.ok(embedded,'Moteur principal introuvable');
new vm.Script(embedded[1],{filename:'index-inline.js'});
for(const path of [
  'arcade-audio.js','arcade-intro.js','character-select.js','stage-select.js',
  'stage-audio.js','stage-music.js','versus-screen.js','screen-transitions.js','snes-ui-text.js','portrait-thumbs-normalize.js'
]){
  new vm.Script(read(path),{filename:path});
}
// Après suppression de la fausse confirmation, aucun panneau orphelin.
assert.doesNotMatch(stages,/zf-stage-flight|zf-stage-confirm-view/,
  'Ancien écran de confirmation encore intégré');
assert.doesNotMatch(stageCss,/zf-stage-flight|zf-stage-confirming|zf-stage-confirm-view/,
  'Styles obsolètes de confirmation présents');

// La sélection précharge les deux portraits pendant l'annonce de l'arène.
const vsCode=read('versus-screen.js');
assert.match(stages,/ZikaFighterVersus\?\.preload\?\./,
  'Préchargement VS pendant le choix du stage manquant');
assert.match(vsCode,/portraitCache=new Map\(\)/,
  'Cache portraits VS manquant');
assert.match(vsCode,/if\(selection\)selection\.hidden=true/,
  'Ancien écran non masqué sous le fondu noir');

// Les 21 musiques doivent exister, sans piste synthétique parasite.
const musicCode=read('stage-music.js');
const trackIds=[...musicCode.slice(musicCode.indexOf('const stageIds=['),
  musicCode.indexOf('];',musicCode.indexOf('const stageIds=[')))
  .matchAll(/'([a-z-]+)'/g)].map(match=>match[1]);
assert.equal(trackIds.length,21,'21 identifiants musicaux nécessaires');
assert.equal(new Set(trackIds).size,21,'Identifiants musicaux uniques');
for(const id of trackIds)
  assert.ok(existsSync(join(root,'assets/audio/stages',id+'.mp3')),
    'Musique de stage manquante : '+id);
assert.doesNotMatch(html,/ZikaArcadeAudio\?\.startTitle\(\)/,
  'Ne pas relancer la mélodie de test pendant les combats');

// Pas de fond bleu avant les crédits, ni de cache CSS obsolète.
assert.match(html,/html,body\{margin:0;min-height:100%;background:#000;/,
  'Le fond initial doit rester noir');
assert.doesNotMatch(introSrc,/c\.fillStyle=t<\.19\?'#120b98'/,
  'Ancien flash bleu du canvas légal');
assert.match(html,/arcade-intro\.css\?v=20261109-startup-black-v6/,
  'Le CSS corrigé du démarrage doit être chargé');

console.log('Zika Fighter : tests statiques OK — '+fighterCount+
  ' combattants, 21 arènes, format 4:3, portraits préservés.');
console.log('Attention : contrôle visuel, audio et combat réel encore à effectuer.');
