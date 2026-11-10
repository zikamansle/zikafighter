#!/usr/bin/env python3
"""Conservative side-profile adjustment for Pascal in Zika Fighter.

Targets the 14 walking frames of Pascal. Changes just his torso silhouette:
his hair, face, shoes, colour values, canvas and floor anchor are unchanged.
Identical geometry is applied to original and blue palettes.
"""
from collections import defaultdict
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]/'assets/fighters/pascal'
POSES=('marche_avant','marche_arriere')
VERSION='v84'
WIDTH_FACTOR=0.895

def remap_frame(source):
    y,x=np.nonzero(source[:,:,3]>50)
    if len(y)<100:raise ValueError('Empty character frame')
    top=int(y.min())
    assert top in range(119,127),('Unexpected walking anatomy top',top)
    band=source[top+28:top+54,:,3]>60
    chest=np.where(band)[1]
    cx=float(np.median(chest))
    rows=np.arange(256,dtype=np.float32)
    in_ramp=np.clip((rows-(top+25))/16.0,0,1)
    out_ramp=np.clip(((top+82)-rows)/18.0,0,1)
    strength=np.minimum(in_ramp,out_ramp)
    strength=strength*strength*(3-2*strength)
    factor=1-(1-WIDTH_FACTOR)*strength
    xs=np.arange(256,dtype=np.float32)[None,:]
    src_x=np.clip(np.rint(cx+(xs-cx)/factor[:,None]),0,255).astype(np.int16)
    output=source[np.arange(256)[:,None],src_x].copy()
    # Preserve face, haircut and shoes pixel-for-pixel.
    assert np.array_equal(output[:top+25],source[:top+25])
    assert np.array_equal(output[top+82:],source[top+82:])
    assert output.shape==(256,256,4)
    assert Image.fromarray(output).getchannel('A').getbbox()[3]==227
    return output

def main():
    manifest_file=ROOT/'manifest.json'
    manifest=json.loads(manifest_file.read_text(encoding='utf8'))
    if manifest.get('profileRevision')==VERSION:
        print('Already corrected: Pascal',VERSION)
        return
    assert manifest.get('anatomyRevision')=='v83',('Unrecognized Pascal source art',manifest.get('anatomyRevision'))
    results=defaultdict(list)
    changed=0
    for pose in POSES:
        files=sorted((ROOT/'original'/pose).glob('*.png'))
        assert len(files)==manifest['counts'][pose]
        for file in files:
            blue_file=ROOT/'bleu'/pose/file.name
            original=np.asarray(Image.open(file).convert('RGBA')).copy()
            alternate=np.asarray(Image.open(blue_file).convert('RGBA')).copy()
            assert np.array_equal(original[:,:,3],alternate[:,:,3])
            corrected=remap_frame(original)
            corrected_blue=remap_frame(alternate)
            assert np.array_equal(corrected[:,:,3],corrected_blue[:,:,3])
            assert not np.array_equal(original,corrected),file
            assert np.array_equal(original[:145,:,:],corrected[:145,:,:]),('Facial landmark changed',file)
            Image.fromarray(corrected).save(file,optimize=True)
            Image.fromarray(corrected_blue).save(blue_file,optimize=True)
            changed+=1
            results[pose].append(file.name)
    assert changed==14,changed
    manifest.update({'profileRevision':VERSION,'profileRetouchedFrames':changed,
      'profileRetouch':'walking torso narrowed locally 10.5 percent at maximum; face and feet unchanged'})
    manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    audit={'revision':VERSION,'retouchedOriginal':changed,'retouchedBlue':changed,
           'changedAnimations':dict(results),'referenceFaceUntouched':True,
           'pixelTechnique':'Row-local nearest-neighbor remap of the walking torso, not a global resize'}
    (ROOT/'profile_audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Pascal profile:',changed,'walk frames, 2 palettes, aligned and transparent.')

if __name__=='__main__':
    main()
