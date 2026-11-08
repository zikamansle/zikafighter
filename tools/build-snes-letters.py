#!/usr/bin/env python3
"""SNES display letter atlas. Originals cropped from a real SFII Turbo SNES capture.
The original-title capitals (P,L,A,Y,E,R,S,C,T) are pixels from that capture.
Other letters are explicitly marked as reconstructed to match the sprite palette.
No original screenshot or proprietary font file is committed.
"""
import io, urllib.request, os, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

URL='https://shattered-blog.com/wp-content/uploads/2016/07/blog-9.png'
request=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0'})
raw=urllib.request.urlopen(request,timeout=25).read()
im=Image.open(io.BytesIO(raw)).convert('RGB')
assert im.size==(640,412), 'SNES capture source dimensions changed'

W,H=24,30
chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .:-!'&/"
original={'P':180,'L':200,'A':220,'Y':240,'E':260,'R':280,
          'S':340,'C':420,'T':440}
sheet=Image.new('RGBA',(len(chars)*W,H*3),(0,0,0,0))
facefont='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
font=ImageFont.truetype(facefont,23)

def original_tile(ch):
    sx=original[ch]
    crop=im.crop((sx,19,sx+20,45))
    mask=Image.new('L',crop.size,0);mx=mask.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r,g,b=crop.getpixel((x,y))
            # Real yellow/orange pixels from the original SNES bitmap.
            if r>109 and g>64 and b<165 and r>g*1.08 and r>b*1.3:
                mx[x,y]=255
    # Retain the actual dark edging one pixel adjacent to the native glyph.
    grown=mask.filter(ImageFilter.MaxFilter(3))
    tile=Image.new('RGBA',(W,H))
    for y in range(crop.height):
        for x in range(crop.width):
            if grown.getpixel((x,y))>0:
                rgb=crop.getpixel((x,y))
                tile.putpixel((x+2,y+1),(*rgb,255))
    return tile

def fallback_tile(ch):
    tile=Image.new('RGBA',(W,H),(0,0,0,0))
    if ch==' ':return tile
    # Missing original glyphs are designed separately, NOT mislabeled "extracted".
    guide=Image.new('L',(28,34),0);d=ImageDraw.Draw(guide)
    d.text((1,-2),ch,font=font,fill=255,stroke_width=0)
    bounds=guide.getbbox()
    if not bounds:return tile
    crop=guide.crop(bounds)
    max_w,max_h=17,23
    factor=min(max_w/crop.width,max_h/crop.height)
    crop=crop.resize((max(1,round(crop.width*factor)),max(1,round(crop.height*factor))),Image.Resampling.NEAREST)
    px=(W-crop.width)//2;py=2+(23-crop.height)//2
    m=crop.load()
    for yy in range(crop.height):
        for xx in range(crop.width):
            if m[xx,yy]<90:continue
            x=px+xx;y=py+yy
            if x+1<W and y+2<H:tile.putpixel((x+1,y+2),(32,8,30,255))
            if x+1<W and y+1<H:tile.putpixel((x+1,y+1),(151,41,37,255))
            color=(255,236,141,255) if yy<crop.height*.2 else ((255,194,70,255) if yy<crop.height*.7 else (236,105,38,255))
            tile.putpixel((x,y),color)
    return tile

def recolor(tile,mode):
    if mode=='gold':return tile
    out=Image.new('RGBA',tile.size)
    for y in range(tile.height):
      for x in range(tile.width):
        r,g,b,a=tile.getpixel((x,y))
        if not a:continue
        luminance=(r*.4+g*.5+b*.1)/255
        if mode=='cyan':
            color=(round(12+118*luminance),round(44+207*luminance),round(105+150*luminance),a)
        else:
            color=(round(51+204*luminance),round(46+202*luminance),round(70+183*luminance),a)
        out.putpixel((x,y),color)
    return out

for i,ch in enumerate(chars):
    tile=original_tile(ch) if ch in original else fallback_tile(ch)
    for row,variant in enumerate(('gold','cyan','cream')):
        sheet.alpha_composite(recolor(tile,variant),(i*W,row*H))
path='assets/snes-ui-letters.png'
os.makedirs(os.path.dirname(path),exist_ok=True)
sheet.save(path,optimize=True)
print('CREATED',path,'dimensions',sheet.size,'size',os.stat(path).st_size,flush=True)
print('ORIGINAL SNES LETTERS',','.join(original),flush=True)
print('OTHER LETTERS',','.join(ch for ch in chars if ch not in original),flush=True)
