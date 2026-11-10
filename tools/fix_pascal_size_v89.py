#!/usr/bin/env python3
"""Pascal v89: conservative walk-width and airborne alignment corrections.

Source PNGs only, not game controls. Facial and shoe pixels are never repainted.
Changes to original and bleu palettes use the very same geometrical mask.
"""
from pathlib import Path
from statistics import median
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]/"assets/fighters/pascal"
WALK=("marche_avant","marche_arriere")
JUMP=("saut_neutre","saut_avant","saut_arriere")
REV="v89"

def load(path):
    im=Image.open(path).convert("RGBA")
    if im.size!=(256,256): raise ValueError(f"Incorrect PNG size: {path}")
    return im

def points(im, y0=0, y1=256):
    a=im.getchannel("A")
    pix=a.load()
    return [(x,y) for y in range(max(0,y0),min(256,y1))
            for x in range(256) if pix[x,y]>60]

def bbox(im):
    p=points(im)
    if not p: raise ValueError("Empty sprite")
    return (min(x for x,y in p),min(y for x,y in p),
            max(x for x,y in p)+1,max(y for x,y in p)+1)

def mid_body(im):
    top=bbox(im)[1]
    a=im.getchannel("A").load()
    widths=[]
    centers=[]
    for y in range(top+33,min(top+62,207)):
        xs=[x for x in range(256) if a[x,y]>60]
        if len(xs)>=10:
            widths.append(max(xs)-min(xs)+1)
            centers.append((max(xs)+min(xs))/2)
    if not widths: raise ValueError("No torso silhouette")
    return float(median(widths)),float(median(centers)),top

def move_x(im,shift):
    if shift==0: return im.copy()
    result=Image.new("RGBA",(256,256))
    result.paste(im,(shift,0))
    # Never clip Pascal's hair, face, hands or shoes.
    if sum(result.getchannel("A").getdata())!=sum(im.getchannel("A").getdata()):
        raise ValueError("Airborne x correction would crop Pascal")
    return result

def narrow_body(im,factor,cx,top):
    if factor>=.99999: return im.copy()
    src=im.load()
    out=im.copy()
    dst=out.load()
    for y in range(top+26,207):
        z=min(1.,max(0.,(y-(top+26))/18.),max(0.,(207-y)/20.))
        z=z*z*(3.-2.*z)
        f=1.-(1.-factor)*z
        if abs(f-1.)<.00001: continue
        for x in range(256):
            sx=round(cx+(x-cx)/f)
            dst[x,y]=src[sx,y] if 0<=sx<256 else (0,0,0,0)
    # Hair/face and feet are preserved pixel for pixel.
    if im.crop((0,0,256,top+26)).tobytes()!=out.crop((0,0,256,top+26)).tobytes():
        raise AssertionError("A face pixel changed")
    if im.crop((0,207,256,256)).tobytes()!=out.crop((0,207,256,256)).tobytes():
        raise AssertionError("A foot pixel changed")
    return out

def main():
    manifest_path=ROOT/"manifest.json"
    manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("sizeCorrectionRevision")==REV:
        print("Pascal v89 was already applied; nothing to resample")
        return
    if manifest.get("geometryRevision")!="v88":
        raise ValueError("Unexpected source: must start from approved v88")
    report={"revision":REV,"method":"torso-only nearest-neighbor on walk outliers; translational airborne x anchor",
            "sourceGeometry":"v88","frames":[],"corrections":[]}
    plans={}
    for pose in (*WALK,*JUMP):
        originals=sorted((ROOT/"original"/pose).glob("*.png"))
        if len(originals)!=manifest["counts"][pose]: raise ValueError(pose)
        measurements=[]
        for file in originals:
            im=load(file)
            size,center,top=mid_body(im)
            measurements.append((file,size,center,top,bbox(im)))
        ref_width=median(m[1] for m in measurements)
        # A jump has deliberate leaning; only large centre discontinuities are corrected.
        air=[m for m in measurements if int(m[0].stem) in (2,3,4,5)]
        ref_air_x=median(m[2] for m in air) if air else None
        for file,width,center,top,bounds in measurements:
            relative=f"{pose}/{file.name}"
            factor=1.0
            shift=0
            if pose in WALK and width>ref_width*1.12:
                factor=max(.92,min(1.,(ref_width*1.055)/width))
            if pose in JUMP and int(file.stem) in (2,3,4,5):
                d=round(ref_air_x-center)
                if abs(d)>=6: shift=max(-9,min(9,d))
            plans[relative]=(factor,center,top,shift)
            report["frames"].append({"file":relative,"torsoWidth":round(width,2),
                "referenceWidth":round(ref_width,2),"top":top,
                "alphaBounds":list(bounds),"bodyCenter":round(center,2),
                "proposedTorsoFactor":round(factor,4),"proposedAirShift":shift})
    for relative,(factor,cx,top,shift) in plans.items():
        if factor==1.0 and shift==0: continue
        output=[]
        for pal in ("original","bleu"):
            file=ROOT/pal/relative
            im=load(file)
            corrected=move_x(narrow_body(im,factor,cx,top),shift)
            output.append((file,im,corrected))
        if output[0][2].getchannel("A").tobytes()!=output[1][2].getchannel("A").tobytes():
            raise AssertionError("Both Pascal palettes must keep identical silhouettes")
        if output[0][1].getchannel("A").tobytes()!=output[1][1].getchannel("A").tobytes():
            raise AssertionError("Source palettes have mismatched alpha")
        if shift==0 and bbox(output[0][2])[3]!=bbox(output[0][1])[3]:
            raise AssertionError("Ground-contact changed")
        for file,old,new in output:
            if old.tobytes()!=new.tobytes(): new.save(file,optimize=True)
        report["corrections"].append({"file":relative,"localTorsoScale":round(factor,4),"airShift":shift})
    for relative in plans:
        a=load(ROOT/"original"/relative)
        b=load(ROOT/"bleu"/relative)
        if a.getchannel("A").tobytes()!=b.getchannel("A").tobytes():
            raise AssertionError(f"Different alpha in palettes: {relative}")
    report["correctedFramesPerPalette"]=len(report["corrections"])
    (ROOT/"size_audit_v89.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    manifest["sizeCorrectionRevision"]=REV
    manifest["sizeCorrectionMethod"]="Targeted walking torso silhouette outliers and jump body center (both palettes); no face recolor/redraw"
    manifest["sizeCorrectedFrames"]=len(report["corrections"])
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Pascal v89: {len(report['corrections'])} targeted PNG per palette; all others unchanged")
    for c in report["corrections"]: print(c)

if __name__=="__main__":
    main()
