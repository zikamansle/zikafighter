#!/usr/bin/env python3
"""Zika Fighter: correct approved Pascal sprite proportions without redrawing his face.

Run once on a clean normalized pack. Geometry is identical in both palettes.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]/'assets/fighters/pascal'
REVISION='v83'
POSES={
 'marche_avant','marche_arriere','jab','direct','crochet','uppercut',
 'pied_bas','pied_moyen','pied_haut','balayage','touche_leger',
 'touche_moyen','touche_fort','etourdi','victoire','victoire_alternative',
 'vague_de_paume','prise_du_bricoleur','pied_fort_accroupi',
 'pied_leger_accroupi','pied_moyen_accroupi','poing_fort_accroupi',
 'poing_leger_accroupi','poing_moyen_accroupi','touche_accroupi',
 'releve','releve_apres_ko','saut_neutre','saut_avant','saut_arriere',
 'poings_aeriens','pieds_aeriens','charge_francaise','coup_de_boule','reception'
}
REF_HAIR_W=18.5
POSE_SCALE={'marche_avant':(1.035,1.020),'marche_arriere':(1.035,1.020)}
X,Y=np.meshgrid(np.arange(256,dtype=np.float32),np.arange(256,dtype=np.float32))

def measurements(img):
 alpha=img[:,:,3]
 ys,xs=np.nonzero(alpha>60)
 if len(xs)<10:return None
 top=int(ys.min())
 r,g,b=img[:,:,:3].astype(np.int16).transpose(2,0,1)
 hair=(r>222)&(g>211)&(b>210)&(abs(r-g)<35)&(alpha>140)
 hair[:top,:]=False
 hair[top+9:,:]=False
 yy,xx=np.nonzero(hair)
 if len(xx)<22:return {'top':top,'hair_w':None,'center':None}
 width=int(xx.max()-xx.min()+1)
 hair[top+6:,:]=False
 yy6,xx6=np.nonzero(hair)
 center=float(np.median(xx6)) if len(xx6)>=10 else float(np.median(xx))
 return {'top':top,'hair_w':width,'center':center}

def remap(pose,info):
 sx,sy=POSE_SCALE.get(pose,(1.0,1.0))
 src_y=227-(227-Y)/sy
 src_x=128.0+(X-128.0)/sx
 head_scale=1.0
 if pose in POSES and info and info['hair_w'] is not None:
  width=info['hair_w']
  if 20<=width<=26:
   head_scale=max(.84,min(1.0,REF_HAIR_W/width))
   cx,cy=info['center'],info['top']
   wy=np.clip((cy+33-src_y)/17,0,1)
   wy=np.where(src_y<cy-3,0,wy)
   wx=np.exp(-((src_x-cx)/25.0)**4)
   src_x=cx+(src_x-cx)/(1-(1-head_scale)*wx*wy)
 return (np.clip(np.rint(src_x).astype(np.int16),0,255),
         np.clip(np.rint(src_y).astype(np.int16),0,255),
         float(head_scale))

def main():
 manifest_path=ROOT/'manifest.json'
 manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
 if manifest.get('anatomyRevision')==REVISION:
  print('Pascal anatomy '+REVISION+' already applied, no second resampling.')
  return
 frames=sorted((ROOT/'original').glob('*/*.png'))
 assert len(frames)==316 and sum(manifest['counts'].values())==316
 from hashlib import sha256
 reference=ROOT/'original/attente/01.png'
 reference_hash=sha256(reference.read_bytes()).hexdigest()
 changes=0
 report={'character':'Pascal','revision':REVISION,'reference':'attente/01.png',
  'method':'local head proportions & walking height; nearest-neighbour without recolouring',
  'frames':{},'changed_by_animation':{}}
 for path in frames:
  relative=path.relative_to(ROOT/'original')
  pose=relative.parts[0]
  alt=ROOT/'bleu'/relative
  source=np.asarray(Image.open(path).convert('RGBA'))
  blue=np.asarray(Image.open(alt).convert('RGBA'))
  assert source.shape==blue.shape==(256,256,4),relative
  assert np.array_equal(source[:,:,3],blue[:,:,3]),relative
  before=measurements(source)
  mx,my,scale=remap(pose,before)
  new=source[my,mx].copy()
  new_blue=blue[my,mx].copy()
  assert np.array_equal(new[:,:,3],new_blue[:,:,3]),relative
  y,x=np.nonzero(new[:,:,3])
  assert len(y)>0 and int(y.max())==226,relative
  changed=not np.array_equal(source,new)
  if changed:
   changes+=1
   report['changed_by_animation'][pose]=report['changed_by_animation'].get(pose,0)+1
   Image.fromarray(new,'RGBA').save(path,optimize=True)
   Image.fromarray(new_blue,'RGBA').save(alt,optimize=True)
  report['frames'][str(relative)]={'before':before,'after':measurements(new),
    'head_scale':round(scale,4),'changed':bool(changed)}
 assert sha256(reference.read_bytes()).hexdigest()==reference_hash,'Reference face changed'
 assert 65<=changes<=120,('Unexpected anatomical changes',changes)
 print('Anatomy per-animation retouches:',dict(sorted(report['changed_by_animation'].items())))
 report['changed_original_frames']=changes
 report['changed_palette_frames']=changes
 report['unchanged_frames']=316-changes
 (ROOT/'anatomy_audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 manifest.update({'anatomyRevision':REVISION,
  'anatomyCorrection':'local head and walking body proportions, nearest-neighbor',
  'anatomyCorrectedFrames':changes,'anatomyPaletteFrames':changes})
 manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('PASCAL '+REVISION+': '+str(changes)+' original frames retouched; '+str(changes*2)+' PNG retouched in two palettes.')

if __name__=='__main__':main()
