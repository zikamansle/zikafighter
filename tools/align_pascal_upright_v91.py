#!/usr/bin/env python3
"""Pascal v91 - align upright body heights, preserving every hair/face pixel and shoes.

Do not modify the body shape horizontally. Do not alter crouches, knockdowns,
throws or fighting animations with intentional changes of posture.
"""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]/'assets/fighters/pascal'
UPRIGHT=(
 'attente','marche_avant','marche_arriere','garde_debout','jab','direct','crochet',
 'pied_bas','pied_moyen','pied_haut','vague_de_paume'
)
DESIRED_TOP=122
FLOOR=227

def bounds(image):
 a=image.getchannel('A')
 return a.point(lambda v:255 if v>60 else 0).getbbox()

def adjust(img,top,dy):
 if dy==0:return img.copy()
 # Source body part from hair down to upper chest moves together: the
 # face is translated, never distorted or redrawn.
 new=Image.new('RGBA',img.size,(0,0,0,0))
 p=img.load();q=new.load()
 fade_start=top+dy+29
 fade_end=min(204,top+dy+80)
 for y in range(256):
  if y<=fade_start: shift=dy
  elif y>=fade_end: shift=0
  else:shift=round(dy*(fade_end-y)/(fade_end-fade_start))
  source_y=y-shift
  if 0<=source_y<256:
   for x in range(256):q[x,y]=p[x,source_y]
 # Check the face is completely unchanged after vertical TRANSLATION.
 old_head=img.crop((0,top,256,top+28))
 new_head=new.crop((0,top+dy,256,top+dy+28))
 if old_head.tobytes()!=new_head.tobytes():raise AssertionError('Face/head was modified')
 if img.crop((0,205,256,256)).tobytes()!=new.crop((0,205,256,256)).tobytes():
  raise AssertionError('Feet were modified')
 if bounds(new)[1]!=DESIRED_TOP:raise AssertionError('Head height differs from reference')
 if bounds(new)[3]!=FLOOR:raise AssertionError('Foot anchor shifted')
 return new

def main():
 mf=ROOT/'manifest.json'
 m=json.loads(mf.read_text(encoding='utf8'))
 if m.get('uprightSizeRevision')=='v91':
  print('Pascal upright body height already aligned v91')
  return
 if m.get('sizeCorrectionRevision')!='v90':raise AssertionError('Wrong base revision')
 changes=[]
 for pose in UPRIGHT:
  files=sorted((ROOT/'original'/pose).glob('*.png'))
  assert len(files)==m['counts'][pose]
  for file in files:
   relative=file.relative_to(ROOT/'original')
   original=Image.open(file).convert('RGBA')
   top=bounds(original)[1]
   delta=DESIRED_TOP-top
   if abs(delta)>3: raise AssertionError(f'Unexpected {pose} pose top: {top}')
   if delta==0:continue
   blue_path=ROOT/'bleu'/relative
   blue=Image.open(blue_path).convert('RGBA')
   if original.getchannel('A').tobytes()!=blue.getchannel('A').tobytes():
    raise AssertionError('Source palette alpha mismatch')
   output=adjust(original,top,delta)
   alt=adjust(blue,top,delta)
   if output.getchannel('A').tobytes()!=alt.getchannel('A').tobytes():
    raise AssertionError('Output palette alpha mismatch')
   output.save(file,optimize=True)
   alt.save(blue_path,optimize=True)
   changes.append({'file':str(relative),'topBefore':top,'topAfter':DESIRED_TOP,'shiftFacePixels':delta,'changedFaceGeometry':False,'shoesOriginal':True})
 for pose in UPRIGHT:
  for p in (ROOT/'original'/pose).glob('*.png'):
   assert bounds(Image.open(p).convert('RGBA'))[1]==DESIRED_TOP,p
 for pal in ('original','bleu'):
  assert len(list((ROOT/pal).glob('*/*.png')))==316
 audit={'revision':'v91','referenceHeadTop':DESIRED_TOP,'referenceFoot':FLOOR,
        'changedFramesPerPalette':len(changes),'changed':changes,
        'unchangedAnimations':'crouch, knockdown, airborne and body rotations'}
 (ROOT/'upright_geometry_v91_audit.json').write_text(json.dumps(audit,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
 m['uprightSizeRevision']='v91'
 m['uprightReferenceTop']=DESIRED_TOP
 m['uprightCorrectedFrames']=len(changes)
 m['uprightSizeCorrection']='Align head position on all upright frames without resizing face, hands, feet or horizontal body'
 mf.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
 print('PASCAL V91: aligned upright pixel height, '+str(len(changes))+' frames in both palettes.')
 for c in changes:print(c)

if __name__=='__main__':main()
