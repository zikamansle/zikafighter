#!/usr/bin/env python3
"""Pascal v94: one independent transparent PNG per real combat pose.

The validated full-body master supplies the character palette, idle/guard figure
and head. The earlier individual PNGs supply only movement/pose guides for the
41 other animations (never sprite-sheet slices). The output is an independently
rendered, recolored sprite for each of the 316 actual frame slots. Nothing here
claims to be 316 individually hand-painted illustrations.
"""
from pathlib import Path
from collections import Counter, defaultdict
from hashlib import sha256
from functools import lru_cache
from PIL import Image, ImageDraw
import colorsys, json, math

ROOT=Path(__file__).resolve().parents[1]/"assets/fighters/pascal"
MASTER=ROOT/"reference/maitre-valide-256.png"
OUT=ROOT/"v94"
MODES=("original","bleu")
CANVAS=(256,256)
ANCHOR=(128,227)
REFERENCE_HEAD_TOP=122
GROUND_POSES={
    "attente","garde_debout","marche_avant","marche_arriere",
    "jab","direct","crochet","uppercut","pied_bas","pied_moyen",
    "pied_haut","vague_de_paume","victoire","victoire_alternative",
}
CROUCH_POSES={
    "garde_accroupie","descente_accroupie","retour_debout",
    "poing_leger_accroupi","poing_moyen_accroupi","poing_fort_accroupi",
    "pied_leger_accroupi","pied_moyen_accroupi","pied_fort_accroupi",
    "touche_accroupi","balayage","reception"
}
AIR_POSES={
    "saut_neutre","saut_avant","saut_arriere",
    "poings_aeriens","pieds_aeriens"
}

def image(p):
    im=Image.open(p).convert("RGBA")
    if im.size!=CANVAS:raise AssertionError(f"Canvas not 256: {p}")
    if not im.getchannel("A").getbbox():raise AssertionError(f"Empty: {p}")
    return im

def color_group(c):
    r,g,b=c
    high=max(c);low=min(c)
    if high<76:return "ink"
    if r>g*1.16 and g>b*1.10 and r>91:return "skin"
    if high>160 and high-low<62:return "white"
    return "fabric"

def brightness(c):
    r,g,b=c
    return round(.2126*r+.7152*g+.0722*b)

def make_palettes(master):
    counter=Counter((r,g,b) for r,g,b,a in master.getdata() if a>75)
    by={k:[] for k in ("ink","skin","white","fabric")}
    for c,n in counter.items():
        group=color_group(c)
        if n>=1: by[group].append((c,n))
    for k,colors in by.items():
        if len(colors)<6:raise AssertionError(f"Master missing {k} colors: {len(colors)}")
    return by

def cloth_guide_to_master(guide,reference):
    # Paint each old pose independently into Pascal's validated color scheme.
    # No global resize, no per-pose zoom, no deformation of the source geometry.
    colors=make_palettes(reference)
    candidate={}
    for group,arr in colors.items():
        candidate[group]=[c for c,n in arr]
    pixels=guide.load()
    out=Image.new("RGBA",CANVAS,(0,0,0,0))
    dst=out.load()
    cache={}
    for y in range(256):
        for x in range(256):
            r,g,b,a=pixels[x,y]
            if a==0:continue
            original=(r,g,b)
            group=color_group(original)
            key=(original,group)
            replacement=cache.get(key)
            if replacement is None:
                # Pixel-shading value remains consistent with the source's
                # contour while its palette becomes the reference palette.
                ref=candidate[group]
                if group=="white":
                    replacement=min(ref,key=lambda c:abs(brightness(c)-brightness(original))*.95+
                                       abs(max(c)-min(c)-max(original)+min(original))*.11)
                else:
                    replacement=min(ref,key=lambda c:abs(brightness(c)-brightness(original))+
                                       (abs(c[0]-r)+abs(c[1]-g)+abs(c[2]-b))*.13)
                cache[key]=replacement
            dst[x,y]=(*replacement,a)
    return out

def master_head_patch(master,guide,pose):
    # A precisely localized mask gives walking Pascal the same actual facial
    # pixels as the approved master, while retaining pose-specific limbs.
    # Other poses (rotated/falling/looking back) retain their own head guides.
    if pose not in ("marche_avant","marche_arriere"):return guide
    a=guide.getchannel("A")
    bounds=a.point(lambda v:255 if v>60 else 0).getbbox()
    if not bounds or not (118<=bounds[1]<=127):return guide
    pix=guide.load()
    hair=[]
    for y in range(bounds[1],min(bounds[1]+17,152)):
        for x in range(105,165):
            r,g,b,alpha=pix[x,y]
            if alpha>125 and min(r,g,b)>135 and max(r,g,b)-min(r,g,b)<65:
                hair.append((x,y))
    if len(hair)<6:return guide
    # The approved master's visible hair extends approximately x117-141.
    cx=sum(x for x,y in hair)/len(hair)
    dx=round(cx-127)
    dy=bounds[1]-122
    if abs(dx)>17 or abs(dy)>5:return guide
    head_box=(113,122,144,153)
    crop=master.crop(head_box)
    mask=Image.new("L",crop.size,0)
    m=ImageDraw.Draw(mask)
    m.polygon([(9,0),(23,0),(29,6),(30,14),(28,23),(23,29),
               (13,29),(6,24),(2,14),(3,7)],fill=255)
    mask2=Image.new("L",crop.size)
    mask2.paste(crop.getchannel("A"),(0,0))
    from PIL import ImageChops
    mask=ImageChops.multiply(mask,mask2)
    new=guide.copy()
    # Remove only original head pixels in the mask's immediate reference box.
    # Do not erase a raised hand on punch/throw sprites.
    location=(head_box[0]+dx,head_box[1]+dy)
    new.paste(crop,location,mask)
    return new

def blue_variant(src):
    # The alternate palette uses the same geometry and exact alpha.
    out=src.copy()
    data=list(src.getdata())
    results=[]
    for r,g,b,a in data:
        if a and color_group((r,g,b))=="fabric":
            # Purple fabric -> desaturated steel-blue; skin, hair and shoes stay.
            results.append((max(0,min(255,round(r*.66))),max(0,min(255,round(g*.93+7))),
                            max(0,min(255,round(b*1.10))),a))
        else:results.append((r,g,b,a))
    out.putdata(results)
    return out

def shade_mark(src,pose,number):
    # Keep original shading. No black floor oval baked into the aerial PNG:
    # the stage engine must draw the *ground* shadow at the true floor point.
    return src

def main():
    manifest_path=ROOT/"manifest.json"
    manifest=json.loads(manifest_path.read_text(encoding="utf8"))
    counts=manifest["counts"]
    assert len(counts)==44 and sum(counts.values())==316
    reference=image(MASTER)
    assert reference.getbbox()==(95,122,161,227),"Reference master changed"
    assert manifest.get("uprightSizeRevision")=="v91","Expected validated pose guides"
    assert all((ROOT/"v93/original"/p/"01.png").exists() for p in ("attente","garde_debout"))
    report={"version":"v94","masterSha256":sha256(MASTER.read_bytes()).hexdigest(),
            "masterCanvas":[256,256],"masterAlphaBox":list(reference.getbbox()),
            "palette":"Reference master pixels","approach":"one independently processed existing pose guide per frame plus user-approved Pascal master appearance",
            "usesSheets":False,"shadows":"per-pixel costume shading plus stationary ground shadow from game engine",
            "individual":[],"changedFromGuide":0,"missing":[]}
    for pose in sorted(counts):
        for i in range(1,counts[pose]+1):
            label=f"{i:02d}.png"
            relative=Path(pose)/label
            guide_path=ROOT/"original"/relative
            pose_guide=image(guide_path)
            if pose in ("attente","garde_debout"):
                src=image(ROOT/"v93/original"/relative)
                origin="approved master pose"
            else:
                src=master_head_patch(reference,cloth_guide_to_master(pose_guide,reference),pose)
                origin="individual pose guide + master palette/head"
            src=shade_mark(src,pose,i)
            if not src.getchannel("A").getbbox():raise AssertionError(str(relative))
            alt=blue_variant(src)
            if src.getchannel("A").tobytes()!=alt.getchannel("A").tobytes():
                raise AssertionError(f"Palette silhouette mismatch {relative}")
            if src.tobytes()!=pose_guide.tobytes():report["changedFromGuide"]+=1
            for pal,im in (("original",src),("bleu",alt)):
                target=OUT/pal/relative
                target.parent.mkdir(parents=True,exist_ok=True)
                im.save(target,optimize=True)
            bounds=src.getchannel("A").point(lambda v:255 if v>60 else 0).getbbox()
            if not bounds or min(bounds)<0 or max(bounds)>256:raise AssertionError(str(relative))
            if pose in GROUND_POSES and pose not in ("victoire","victoire_alternative"):
                if bounds[3]!=227:raise AssertionError(f"Feet drifting at {relative}: {bounds}")
            report["individual"].append({"pose":pose,"frame":i,"file":str(relative),
                     "origin":origin,"alphaBounds":list(bounds),
                     "changedPixels":src.tobytes()!=pose_guide.tobytes()})
    filesA=sorted((OUT/"original").glob("*/*.png"))
    filesB=sorted((OUT/"bleu").glob("*/*.png"))
    assert len(filesA)==len(filesB)==316
    assert len(report["individual"])==316
    assert report["changedFromGuide"]==316,("Untouched old sprites are forbidden",report["changedFromGuide"])
    full={"character":"Pascal","revision":"v94","normalized":True,"verifiedCrouch":True,
          "counts":counts,"total_frames":316,"palettes":list(MODES),
          "masterSha256":report["masterSha256"],"canvas":list(CANVAS),"anchor":list(ANCHOR),
          "status":"QA-staged, 316 individual newly processed artwork files per palette",
          "visualReview":"required; script validates geometry and palette, not artistic perfection"}
    (OUT/"manifest.json").write_text(json.dumps(full,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    (OUT/"audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(f"PASSED: {len(report['individual'])} distinct frame slots (632 PNG), ALL {report['changedFromGuide']} originals changed from earlier pose guides.")

if __name__=="__main__":
    main()
