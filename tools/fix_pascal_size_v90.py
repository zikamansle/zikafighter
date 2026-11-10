#!/usr/bin/env python3
"""Pascal v90 - correct six measured silhouette outliers only.

Uses approved v88/v89 sprites. Keeps the entire face/hair block and foot/shoe
block exactly unchanged; edits no image other than these six, in both palettes.
"""
from pathlib import Path
import json
from PIL import Image
from fix_pascal_size_v89 import load, mid_body, narrow_body, bbox

ROOT=Path(__file__).resolve().parents[1]/'assets/fighters/pascal'
# Measurements from size_audit_v89.json, not guesses about other animations.
FACTORS={
 'marche_avant/02.png':0.83,
 'marche_avant/03.png':0.83,
 'marche_avant/04.png':0.84,
 'marche_avant/06.png':0.87,
 'saut_neutre/02.png':0.87,
 'saut_avant/05.png':0.82
}

def main():
    mf=ROOT/'manifest.json'
    m=json.loads(mf.read_text(encoding='utf-8'))
    if m.get('sizeCorrectionRevision')=='v90':
        print('Pascal v90 already corrected, no repeated resizing')
        return
    assert m.get('geometryRevision')=='v88'
    assert m.get('sizeCorrectionRevision')=='v89'
    audit={'revision':'v90','reference':'size_audit_v89.json',
           'method':'row-local torso width nearest-neighbor, without changing face or shoes',
           'corrected':[]}
    for relative,factor in FACTORS.items():
        originals=[]
        before_width=None
        for palette in ('original','bleu'):
            path=ROOT/palette/relative
            im=load(path)
            width,cx,top=mid_body(im)
            if before_width is None: before_width=width
            assert abs(width-before_width)<.01,('Different silhouette palettes',relative)
            changed=narrow_body(im,factor,cx,top)
            if changed.tobytes()==im.tobytes(): raise AssertionError('No-op correction: '+relative)
            assert changed.crop((0,0,256,top+26)).tobytes()==im.crop((0,0,256,top+26)).tobytes()
            assert changed.crop((0,207,256,256)).tobytes()==im.crop((0,207,256,256)).tobytes()
            assert bbox(changed)[1]==bbox(im)[1],relative
            originals.append((path,im,changed))
        assert originals[0][2].getchannel('A').tobytes()==originals[1][2].getchannel('A').tobytes()
        after_width=mid_body(originals[0][2])[0]
        assert after_width<before_width,(relative,before_width,after_width)
        for path,im,changed in originals: changed.save(path,optimize=True)
        audit['corrected'].append({'file':relative,'beforeTorsoWidth':before_width,
          'afterTorsoWidth':after_width,'localFactor':factor,
          'faceUnchanged':True,'feetUnchanged':True})
    for palette in ('original','bleu'):
        assert len(list((ROOT/palette).glob('*/*.png')))==316
    m.update({'sizeCorrectionRevision':'v90','sizeCorrectedFrames':len(FACTORS),
      'sizeCorrectionMethod':'6 measured profile/jump body-width outliers corrected locally; face, hair, feet and control mappings preserved'})
    mf.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    (ROOT/'size_audit_v90.json').write_text(json.dumps(audit,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('PASCAL V90 — corrected',len(FACTORS),'source frames in both palettes')
    for item in audit['corrected']:print(item)

if __name__=='__main__':main()
