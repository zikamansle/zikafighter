#!/usr/bin/env python3
"""Zika Fighter · bloc 1 Pascal: 12 separately rendered transparent game sprites.
The identity, body scale, face, pants and shoes all come from the user-approved
master. Animate only small, local fist/arm/torso positions: no global sprite zoom.
Preview-only: other fighting animations are left untouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from hashlib import sha256
import numpy as np
import json

ROOT=Path("assets/fighters/pascal")
MASTER=ROOT/"reference/maitre-valide-256.png"
OUTPUT=ROOT/"bloc1"
EXPECTED_SHA="44a01a47486b87bf12896b167ebcbc3f5a6ebe6defe1bddeda5db261c03b43e9"
assert sha256(MASTER.read_bytes()).hexdigest()==EXPECTED_SHA,"Unapproved source master"
ref=Image.open(MASTER).convert("RGBA")
assert ref.size==(256,256) and ref.getbbox()==(95,122,161,227)
src=np.asarray(ref).copy()
xs=np.arange(256,dtype=np.float32)[None,:]
ys=np.arange(256,dtype=np.float32)[:,None]

def local_field(cx,cy,rx,ry,power=1.3):
    radius=((xs-cx)/rx)**2+((ys-cy)/ry)**2
    return np.clip(1-radius,0,1)**power

left=local_field(128,155,13,12)*np.clip((ys-146)/5,0,1)
right=local_field(145,147,14,13)*np.clip((xs-135)/6,0,1)
breathing=local_field(123,163,24,15,2)*np.clip((ys-147)/6,0,1)
protected=(ys<140)|(ys>=191)
grid_x,grid_y=np.meshgrid(np.arange(256),np.arange(256))

IDLE=[
    (0,0,0,0,0), (1,-1,-1,0,.5), (2,-1,-2,-1,.7),
    (2,0,-1,-2,.8), (0,0,0,-1,0), (-1,1,1,0,-.5),
    (-2,1,2,1,-.7),(-1,0,1,1,-.4)
]
GUARD=[
    (2,-1,-1,-1,.6), (2,-2,-1,-1,.6),
    (1,-2,-2,-2,.9),(-1,0,1,-1,-.4)
]
ANIMATIONS={"attente":IDLE,"garde_debout":GUARD}

def draw_frame(values):
    ldx,ldy,rdx,rdy,breath=values
    dx=left*ldx+right*rdx+breathing*breath*.65
    dy=left*ldy+right*rdy
    dx=np.where(protected,0,dx)
    dy=np.where(protected,0,dy)
    gx=np.clip(np.rint(grid_x-dx),0,255).astype("int16")
    gy=np.clip(np.rint(grid_y-dy),0,255).astype("int16")
    pixels=src[gy,gx].copy()
    pixels[:140]=src[:140]
    pixels[191:]=src[191:]
    return Image.fromarray(pixels,"RGBA")

def blue_palette(im):
    arr=np.asarray(im).copy()
    r=arr[:,:,0].astype(np.float32);g=arr[:,:,1].astype(np.float32)
    b=arr[:,:,2].astype(np.float32);a=arr[:,:,3]
    mask=(a>0)&(b>r*1.05)&(b>g*1.10)&(r<207)
    arr[:,:,0][mask]=np.clip(r[mask]*.68,0,255).astype(np.uint8)
    arr[:,:,1][mask]=np.clip(g[mask]*.88+16,0,255).astype(np.uint8)
    arr[:,:,2][mask]=np.clip(b[mask]*1.08,0,255).astype(np.uint8)
    return Image.fromarray(arr,"RGBA")

records=[]; seen=set()
for pose,frames in ANIMATIONS.items():
    for i,values in enumerate(frames,1):
        im=draw_frame(values)
        assert im.size==(256,256) and im.getbbox()==ref.getbbox(),(pose,i,"silhouette")
        assert im.crop((0,0,256,140)).tobytes()==ref.crop((0,0,256,140)).tobytes(),(pose,i,"head")
        assert im.crop((0,191,256,256)).tobytes()==ref.crop((0,191,256,256)).tobytes(),(pose,i,"feet")
        digest=sha256(im.tobytes()).hexdigest()
        assert digest not in seen,(pose,i,"duplicate")
        seen.add(digest)
        alt=blue_palette(im)
        assert im.getchannel("A").tobytes()==alt.getchannel("A").tobytes()
        for pal,frame in (("original",im),("bleu",alt)):
            path=OUTPUT/pal/pose/f"{i:02}.png"
            path.parent.mkdir(parents=True,exist_ok=True)
            frame.save(path,optimize=True)
        records.append({"pose":pose,"frame":i,"size":[256,256],"inkBounds":[95,122,161,227],
                        "headUnchanged":True,"feetUnchanged":True,"sourceHash":digest})
shadow=Image.new("RGBA",(256,256))
draw=ImageDraw.Draw(shadow)
draw.ellipse((102,224,158,232),fill=(12,10,24,48))
shadow.save(OUTPUT/"ombre_sol.png",optimize=True)
manifest={"character":"Pascal","version":"bloc1-preview","masterSHA256":EXPECTED_SHA,
          "status":"ONLY ATTENTE/GARDE DEBOUT - USER TEST REQUIRED",
          "canvas":[256,256],"anchor":[128,227],"counts":{"attente":8,"garde_debout":4},
          "palettes":["original","bleu"],"spritesPerPalette":12,
          "shadows":"Separate transparent grounded shadow in ombre_sol.png; the game stage handles the world-space shadow",
          "visualPerfection":"Not asserted: user review required"}
(OUTPUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
(OUTPUT/"qa.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
for pal in ("original","bleu"):
    files=sorted((OUTPUT/pal).glob("*/*.png"))
    assert len(files)==12
    for f in files:
        with Image.open(f) as check:
            assert check.size==(256,256)
print("PASS Pascal bloc 1: 12 distinct PNG per palette, approved face/feet, stable scale, 256px transparent; preview only")
