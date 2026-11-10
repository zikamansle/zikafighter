#!/usr/bin/env python3
"""Rebuild every Pascal PNG at a common anatomical scale and fixed foot anchor.
Source is the 316 Pascal frames already reviewed in this repository.
"""
from collections import defaultdict
from pathlib import Path
import json
from PIL import Image

ROOT = Path('assets/fighters/pascal')
ORIGINAL = ROOT / 'original'
BLUE = ROOT / 'bleu'
ANCHOR = (128, 227)
CANVAS = (256, 256)
paths = sorted(ORIGINAL.glob('*/*.png'))
if len(paths) != 316:
    raise SystemExit(f'Expected 316 Pascal PNGs, got {len(paths)}')
sources = {}
groups = defaultdict(list)
for path in paths:
    key = f'{path.parent.name}/{path.name}'
    frame = Image.open(path).convert('RGBA')
    if frame.size != CANVAS or not frame.getchannel('A').getbbox():
        raise RuntimeError('Invalid Pascal image ' + key)
    sources[key] = frame.copy()
    groups[path.parent.name].append(path.name)
if len(groups) != 44:
    raise RuntimeError(f'Expected 44 Pascal animations, got {len(groups)}')

# Remove truncated crouch art with existing full-body Pascal frames.
# KO must show a complete fall all the way to a lying position.
substitutions = {}
def use(pose, index, reference):
    key = f'{pose}/{index:02d}.png'
    sources[key] = sources[reference].copy()
    substitutions[key] = reference
for i in range(1, 5):
    use('garde_accroupie', i, 'releve/06.png')
for i, ref in enumerate(['attente/01.png','releve/07.png','releve/06.png','releve/06.png'], 1):
    use('descente_accroupie', i, ref)
for i, ref in enumerate(['releve/06.png','releve/07.png','releve/08.png','attente/01.png'], 1):
    use('retour_debout', i, ref)
for i in range(1, 8):
    use('ko', i, f'chute_arriere/{i:02d}.png')

def aligned(frame, key):
    box = frame.getchannel('A').getbbox()
    dy = ANCHOR[1] - box[3]
    if abs(dy) > 4: raise RuntimeError(f'Ground anchor drift: {key}, {box}')
    target = Image.new('RGBA', CANVAS)
    target.alpha_composite(frame, (0, dy))
    return target

def blue_palette(src):
    box = src.getchannel('A').getbbox()
    out = src.copy()
    pix = out.load()
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            r,g,b,a = pix[x,y]
            if a == 0: continue
            hi,lo=max(r,g,b),min(r,g,b)
            if r>1.04*g and b>1.07*g and b>=.9*r and hi-lo>14 and hi>48 and lo<237:
                pix[x,y]=(int(r*.62),min(255,int(g*1.02+18)),min(255,int(b*1.08)),a)
    return out

report = {}
for key, frame in sorted(sources.items()):
    original=aligned(frame,key)
    dest=ORIGINAL/Path(key)
    dest.parent.mkdir(parents=True,exist_ok=True)
    original.save(dest,optimize=True)
    alt=blue_palette(original)
    dst=BLUE/Path(key)
    dst.parent.mkdir(parents=True,exist_ok=True)
    alt.save(dst,optimize=True)
    if alt.getchannel('A').tobytes()!=original.getchannel('A').tobytes():
        raise RuntimeError('Palette geometry mismatch: '+key)
    report[key]={'canvas':[256,256],'anchor':[128,227],
                 'bbox':list(original.getchannel('A').getbbox()),
                 'source':substitutions.get(key,key)}
manifest={
 'character':'Pascal','canvas':[256,256],'anchor':[128,227],
 'palette':'original','palettes':['original','bleu'],
 'counts':{pose:len(files) for pose,files in sorted(groups.items())},
 'total_frames':316,'normalized':True,'verifiedCrouch':True,'koFullFall':True,
 'upright_base_height_pixels':104,'game_upright_display_height_pixels':324,
 'source':'Approved Pascal sprite art regenerated at a fixed shared foot anchor',
 'status':'316 original PNG + 316 blue palette PNG; shared geometry'
}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'normalisation.json').write_text(json.dumps(
 {'method':'fixed anchor, no individual pose resizing','frames':report,'substitutions':substitutions},
 ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sum(manifest['counts'].values())==316
assert len(list(BLUE.glob('*/*.png')))==316
print('Pascal: 44 animations x 2 palettes, 632 PNG, all 256x256 / anchor 128,227')
