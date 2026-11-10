#!/usr/bin/env python3
"""Remove opponent ghost and baked hit effects from Pascal's standalone sprites.

Important: 316 independent PNG per palette, fixed 256x256 canvas and feet
at row 226. These images are drawn as a SINGLE fighter. A second fighter,
projectile or impact must be drawn separately by the combat engine.
"""
from pathlib import Path
import json
import hashlib
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]/'assets/fighters/pascal'
REVISION='v85'
REPLACE={
  # The final charge frames previously included a stick-figure opponent.
  'charge_francaise/06.png':'charge_francaise/03.png',
  'charge_francaise/07.png':'charge_francaise/02.png',
  # The wave projectile has its own engine sprite; no baked projectile.
  'vague_de_paume/05.png':'vague_de_paume/04.png',
  # An unbound composite throw with a white-uniform opponent must not
  # appear as a second fighter when Pascal alone is drawn. Retain the
  # intended grappling sequence using Pascal-only impact/hold poses.
  'prise_du_bricoleur/01.png':'direct/02.png',
  'prise_du_bricoleur/02.png':'direct/03.png',
  'prise_du_bricoleur/03.png':'crochet/03.png',
  'prise_du_bricoleur/04.png':'uppercut/03.png',
  'prise_du_bricoleur/05.png':'uppercut/04.png',
  'prise_du_bricoleur/06.png':'crochet/06.png',
  'prise_du_bricoleur/07.png':'retour_debout/03.png',
}

def check_rgba(path):
  im=Image.open(path).convert('RGBA')
  assert im.size==(256,256),path
  box=im.getchannel('A').getbbox()
  assert box and box[3]==227,(path,box)
  return im

def main():
  manifest_path=ROOT/'manifest.json'
  manifest=json.loads(manifest_path.read_text(encoding='utf8'))
  if manifest.get('cleanCompositeRevision')==REVISION:
    print('Already cleaned '+REVISION)
    return
  assert manifest.get('anatomyRevision')=='v83'
  assert manifest.get('profileRevision')=='v84'
  assert sum(manifest['counts'].values())==316
  record={}
  # Read every target before writing to avoid order-dependent replacements.
  replacements={}
  for palette in ('original','bleu'):
    for destination,source in REPLACE.items():
      src=check_rgba(ROOT/palette/source)
      dest=check_rgba(ROOT/palette/destination)
      replacements[(palette,destination)]=src
      if palette=='original':
        record[destination]={
          'originalFrame':destination,
          'PascalOnlyReference':source,
          'previousSha256':hashlib.sha256(dest.tobytes()).hexdigest()[:16]}
  for palette in ('original','bleu'):
    for destination in REPLACE:
      replacements[(palette,destination)].save(ROOT/palette/destination,optimize=True)
  for destination in REPLACE:
    a=check_rgba(ROOT/'original'/destination)
    b=check_rgba(ROOT/'bleu'/destination)
    assert a.getchannel('A').tobytes()==b.getchannel('A').tobytes()
  assert len(list((ROOT/'original').glob('*/*.png')))==316
  assert len(list((ROOT/'bleu').glob('*/*.png')))==316
  manifest['cleanCompositeRevision']=REVISION
  manifest['ghostFramesCleaned']=len(REPLACE)
  manifest['ghostFramesCleanedPerPalette']=len(REPLACE)
  manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  report={'revision':REVISION,'purpose':'Remove second fighters and baked hit effects from single-character sprites',
    'changedPerPalette':len(REPLACE),'changedTotal':len(REPLACE)*2,'replacements':record,
    'note':'The throw is now Pascal-only placeholder poses until a real two-body throw engine exists.'}
  (ROOT/'composite_cleanup_audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  print('CLEANED '+str(len(REPLACE)*2)+' PNG, no dummy opponent inside Pascal animations.')
if __name__=='__main__':main()
