#!/usr/bin/env python3
"""Measure Pascal's actual ink bounds, hair, head and torso across 316 frames.
Produces data only; never edits approved artwork.
"""
from pathlib import Path
from collections import defaultdict
from statistics import median
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]/'assets/fighters/pascal'
report={'revision':'v91-audit','reference':'attente/01.png','poses':{},'outliers':[]}
for pose_dir in sorted((ROOT/'original').iterdir()):
    if not pose_dir.is_dir():continue
    frames=[]
    for p in sorted(pose_dir.glob('*.png')):
        im=Image.open(p).convert('RGBA')
        a=im.getchannel('A').load();rgb=im.load()
        visible=[(x,y) for y in range(256) for x in range(256) if a[x,y]>60]
        if len(visible)<30:raise ValueError('Empty '+str(p))
        x0=min(x for x,y in visible);x1=max(x for x,y in visible)+1
        y0=min(y for x,y in visible);y1=max(y for x,y in visible)+1
        hair=[(x,y) for x,y in visible if y<=y0+24 and
              min(rgb[x,y][0:3])>=172 and max(rgb[x,y][0:3])-min(rgb[x,y][0:3])<=62]
        hair_bounds=[min(x for x,y in hair),max(x for x,y in hair)+1] if hair else None
        rowwidth={}
        for offset in (0,8,16,24,32,40,48,56,68,80):
            y=y0+offset
            xs=[x for x in range(256) if y<256 and a[x,y]>60]
            if xs:rowwidth[offset]={'width':max(xs)-min(xs)+1,'center':round((max(xs)+min(xs))/2,1)}
        frames.append({'file':p.name,'bounds':[x0,y0,x1,y1],
                       'w':x1-x0,'h':y1-y0,'alpha':len(visible),
                       'hairWidth':hair_bounds[1]-hair_bounds[0] if hair_bounds else None,
                       'rows':rowwidth})
    report['poses'][pose_dir.name]=frames
    heights=[f['h'] for f in frames]
    hair=[f['hairWidth'] for f in frames if f['hairWidth']]
    report.setdefault('summary',{})[pose_dir.name]={
        'frames':len(frames),'hmin':min(heights),'hmax':max(heights),
        'hmedian':median(heights),'hairMin':min(hair) if hair else None,
        'hairMax':max(hair) if hair else None}
    if len(frames)>1 and max(heights)-min(heights)>15:
        report['outliers'].append({'pose':pose_dir.name,'heightRange':max(heights)-min(heights),'heights':heights})
out=ROOT/'full_dimension_audit_v91.json'
out.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
print('AUDIT '+str(sum(v['frames'] for v in report['summary'].values()))+' sprites, '+str(len(report['outliers']))+' pose height ranges above 15 pixels')
for name in ('attente','marche_avant','marche_arriere','garde_debout','saut_neutre','saut_avant','saut_arriere','jab','direct','crochet','uppercut','pied_moyen','garde_accroupie','descente_accroupie','retour_debout'):
    print(name,report['summary'].get(name))
