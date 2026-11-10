#!/usr/bin/env python3
"""Zika Fighter - Pascal master-based individual sprites, v93 first verified batch.
Each file is rendered from the same user-approved character. Never extract sheets.
Do not activate the incomplete batch in normal gameplay.
"""
from pathlib import Path
import math,json
from PIL import Image
SOURCE=Path("assets/fighters/pascal/reference/maitre-valide-256.png")
OUT=Path("assets/fighters/pascal/v93")
img=Image.open(SOURCE).convert("RGBA")
assert img.size==(256,256) and img.getbbox()==(95,122,161,227),("Incorrect approved master",img.getbbox())

def render(frame):
    right_offsets=[0,1,2,1,0,-1,-2,-1]
    left_offsets=[0,-1,-1,0,1,1,0,-1]
    fold_offsets=[0,0,1,1,0,-1,-1,0]
    out=Image.new("RGBA",(256,256),(0,0,0,0))
    src=img.load();dst=out.load()
    for y in range(256):
      for x in range(256):
        if src[x,y][3]==0 and (y<146 or y>183):continue
        sx=x
        if 149<=y<=178:
            t=max(0.,min(1.,(y-149)/8.,(178-y)/12.))
            if x>=143:sx=x-round(right_offsets[frame]*t)
            elif x<=113:sx=x-round(left_offsets[frame]*t)
        elif 180<=y<=194 and 121<=x<=140:
            t=max(0.,min(1.,(y-180)/4.,(194-y)/4.))
            sx=x-round(fold_offsets[frame]*t)
        if 0<=sx<256:
            c=src[sx,y]
            if c[3]:dst[x,y]=c
    return out

def palette_blue(src):
    im=src.copy();pix=src.load();p=im.load()
    for y in range(256):
      for x in range(256):
        r,g,b,a=pix[x,y]
        if a and b>=r*1.05 and b>=g*1.10 and r<207:
            p[x,y]=(max(0,int(r*.68)),min(255,int(g*.88+16)),min(255,int(b*1.08)),a)
    return im

audit=[]
for pose,n in (("attente",8),("garde_debout",4)):
    for i in range(n):
        base=render(i)
        assert base.getbbox()==img.getbbox()
        assert base.crop((0,0,256,148)).tobytes()==img.crop((0,0,256,148)).tobytes(),"Face changed"
        assert base.crop((0,199,256,256)).tobytes()==img.crop((0,199,256,256)).tobytes(),"Foot changed"
        alt=palette_blue(base)
        assert base.getchannel("A").tobytes()==alt.getchannel("A").tobytes()
        for name,im in (("original",base),("bleu",alt)):
            target=OUT/name/pose/f"{i+1:02}.png"
            target.parent.mkdir(parents=True,exist_ok=True)
            im.save(target,optimize=True)
        audit.append({"pose":pose,"frame":i+1,"alphaBounds":list(base.getbbox()),"headUnchanged":True,"feetUnchanged":True})
manifest={"character":"Pascal","revision":"v93-partial","source":"reference/maitre-valide-256.png",
          "counts":{"attente":8,"garde_debout":4},
          "framesPerPalette":12,"totalPNG":24,"canvas":[256,256],
          "anchor":[128,227],"status":"STAGING - NOT COMPLETE; DO NOT REPLACE FULL GAME ASSETS",
          "characterScale":1,"preserveCharacterShadows":True,
          "note":"Ground shadow remains rendered by game engine to stay on stage when jumping."}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
(OUT/"qa.json").write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
from hashlib import sha256
for pose,n in (("attente",8),("garde_debout",4)):
    hashes=[sha256((OUT/"original"/pose/f"{i+1:02}.png").read_bytes()).hexdigest() for i in range(n)]
    assert len(set(hashes))==n,("Repeated sprite frame",pose)
assert len(list((OUT/"original").glob("*/*.png")))==12
assert len(list((OUT/"bleu").glob("*/*.png")))==12
print("PASS: v93 staging with 24 separately rendered PNG, uniform head/feet/scale; 2 animations of 44")
