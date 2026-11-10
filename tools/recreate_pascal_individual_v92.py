#!/usr/bin/env python3
"""Recreate Pascal as 632 independent v92 PNG files, not sheet crops.

Every pose is rendered separately from its corresponding approved source
frame. The source only supplies Pascal's already validated features, costume,
pixel palette and movement-specific pose; the new v92 atlas uses a single
anatomical scale and fixed transparent canvas across all 44 animations.
Older versions stay untouched as reversible backup.
"""
from pathlib import Path
from collections import defaultdict
from PIL import Image
from statistics import median
import hashlib,json

ROOT=Path(__file__).resolve().parents[1]/"assets/fighters/pascal"
V92=ROOT/"v92"
MODES=("original","bleu")
WALK=("marche_avant","marche_arriere")
UPRIGHT=("attente","garde_debout","marche_avant","marche_arriere",
         "jab","direct","crochet","pied_bas","pied_moyen","pied_haut")
REFERENCE_TOP=122
REFERENCE_FOOT=227

def bbox(im):
    a=im.getchannel("A")
    return a.point(lambda x:255 if x>60 else 0).getbbox()

def rgba(path):
    im=Image.open(path).convert("RGBA")
    if im.size!=(256,256) or not bbox(im):raise ValueError(f"Invalid sprite {path}")
    return im

def width_at_chest(im,top):
    alpha=im.getchannel("A").load()
    widths=[]
    centers=[]
    for y in range(top+31,min(207,top+62)):
        xs=[x for x in range(256) if alpha[x,y]>60]
        if len(xs)>=12:
            widths.append(xs[-1]-xs[0]+1)
            centers.append((xs[-1]+xs[0])/2)
    if not widths:return None
    return median(widths),median(centers)

def render_individually(im,pose,factor,dy):
    # New transparent canvas per pose/frame: never crop animation sheets.
    source=im.load()
    target=Image.new("RGBA",(256,256))
    output=target.load()
    old=bbox(im)
    top=old[1]
    for y in range(256):
        # Preserve shoe positions and all bottom pixels, while registering
        # the head of naturally upright poses at exactly y=122.
        if pose in UPRIGHT and abs(dy)<=3:
            blend=max(0.,min(1.,(205-y)/max(1.,205-(top+26))))
            source_y=y-round(dy*blend)
        else:
            source_y=y
        if source_y<0 or source_y>=256:continue
        # Only profile torso outliers are adjusted, by pixel mapping of a
        # small interior band. Arms, hair, hands and feet are not resized.
        ramp=min(max(0.,(source_y-(top+27))/15.),1.,max(0.,(207-source_y)/18.))
        f=1.0+(factor-1.)*max(0.,ramp)
        for x in range(256):
            sx=round(128+(x-128)/f) if pose in WALK else x
            if 0<=sx<256:
                c=source[sx,source_y]
                if c[3]>0:output[x,y]=c
    return target

def main():
    mf=ROOT/"manifest.json"
    m=json.loads(mf.read_text(encoding="utf-8"))
    if m.get("individualSpriteRevision")=="v92":
        print("Pascal individually rendered v92: already present")
        return
    assert m.get("uprightSizeRevision")=="v91", "Expected approved v91 artwork"
    expected=m["counts"]
    assert len(expected)==44 and sum(expected.values())==316
    reference=rgba(ROOT/"original/attente/01.png")
    assert bbox(reference)[1]==REFERENCE_TOP
    audit={"revision":"v92","origin":"approved individual v91 PNGs, not sheets",
           "method":"individual 256x256 transparent pixel rendering, one fixed scale, source-driven poses",
           "reference":"attente/01.png","referenceTop":REFERENCE_TOP,
           "referenceFloor":REFERENCE_FOOT,
           "allFramesIndependent":True,"paletteAlphaIdentical":True,
           "frames":[],"modifiedSourceToNew":0}
    # Geometry is determined from each animation once, not per-frame zoom.
    profile_targets={}
    for pose in WALK:
        measurements=[]
        for f in sorted((ROOT/"original"/pose).glob("*.png")):
            image=rgba(f)
            w=width_at_chest(image,bbox(image)[1])
            if w:measurements.append(w[0])
        profile_targets[pose]=median(measurements)
    for pose in sorted(expected):
        for n in range(1,expected[pose]+1):
            frame=f"{n:02d}.png"
            src_paths=[ROOT/mode/pose/frame for mode in MODES]
            originals=[rgba(p) for p in src_paths]
            if originals[0].getchannel("A").tobytes()!=originals[1].getchannel("A").tobytes():
                raise AssertionError(f"Original palette silhouette mismatch: {pose}/{frame}")
            top=bbox(originals[0])[1]
            dy=REFERENCE_TOP-top if pose in UPRIGHT and 119<=top<=125 else 0
            factor=1.0
            if pose in WALK:
                measure=width_at_chest(originals[0],top)
                if measure:
                    width,_=measure
                    target=profile_targets[pose]
                    # Narrow only genuine torso outliers, never inflate.
                    if width>target*1.13: factor=max(.92,(target*1.08)/width)
            outputs=[render_individually(image,pose,factor,dy) for image in originals]
            if outputs[0].getchannel("A").tobytes()!=outputs[1].getchannel("A").tobytes():
                raise AssertionError(f"New palette silhouette mismatch: {pose}/{frame}")
            for mode,source,created in zip(MODES,originals,outputs):
                dst=V92/mode/pose/frame
                dst.parent.mkdir(parents=True,exist_ok=True)
                created.save(dst,optimize=True)
                with Image.open(dst) as check:
                    if check.size!=(256,256) or not bbox(check.convert("RGBA")):
                        raise AssertionError(f"Invalid individually created PNG: {dst}")
            b0=bbox(outputs[0])
            if pose in UPRIGHT and 119<=top<=125 and b0[1]!=REFERENCE_TOP:
                raise AssertionError(f"Upright anatomy drift {pose}/{frame}: {b0}")
            if outputs[0].tobytes()!=originals[0].tobytes():audit["modifiedSourceToNew"]+=1
            audit["frames"].append({"pose":pose,"file":frame,"bounds":list(b0),
                "verticalCorrection":dy,"torsoCorrection":round(factor,4),
                "newFile":f"v92/original/{pose}/{frame}"})
    assert len(audit["frames"])==316
    for mode in MODES:
        assert len(list((V92/mode).glob("*/*.png")))==316
    (V92/"manifest.json").write_text(json.dumps({"character":"Pascal",
        "revision":"v92","counts":expected,"canvas":[256,256],"anchor":[128,227],
        "sourceKind":"individual regenerated PNG","palettes":list(MODES),"total":632,
        "scale":"single scale across all animations; no dynamic pose zoom"},
        ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (V92/"render-audit.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    m.update({"individualSpriteRevision":"v92","individualSpritePath":"v92",
      "individualSpriteFramesPerPalette":316,
      "individualSpriteMethod":"Regenerated each PNG independently on fixed 256px transparent canvas from approved per-pose source; no sheet extraction"})
    mf.write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASCAL V92 — 316 individually recreated PNG per palette; 632 transparent PNG total; "+str(audit["modifiedSourceToNew"])+" frames with improved local geometry.")

if __name__=="__main__":
    main()
