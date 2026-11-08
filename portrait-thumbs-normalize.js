/* Zika Fighter — vignettes 20 combattants, cadrage et fond bleu commun.
   Traitement uniquement des images de liste, jamais des grands portraits.
   Si un fond n'est pas isolable proprement, la vignette reste intacte. */
(()=>{'use strict';
 const W=104,H=132,COLOR=[8,17,66,255];
 const cache=new Map();
 function build(img){
  if(!img?.naturalWidth||!img.naturalHeight)return null;
  const src=document.createElement('canvas');src.width=W;src.height=H;
  const ctx=src.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  // Recadrage du visage/buste avec la même focale pour les 20 cases.
  const sw=img.naturalWidth,sh=img.naturalHeight;
  const ratio=Math.max(W/sw,H/sh);
  const dw=sw*ratio,dh=sh*ratio;
  const dx=(W-dw)/2,dy=Math.min(0,(H-dh)*.28);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,dx,dy,dw,dh);
  const frame=ctx.getImageData(0,0,W,H);
  const pixels=frame.data;
  const pix=(x,y)=>(y*W+x)*4;
  // Bordures de l'image : trouver la couleur de fond pour chaque coin.
  const seeds=[[2,2],[W-3,2],[2,H-3],[W-3,H-3]];
  const keys=seeds.map(([x,y])=>{const i=pix(x,y);return [pixels[i],pixels[i+1],pixels[i+2]];});
  const d2=(i,k)=>{
    const dr=pixels[i]-k[0],dg=pixels[i+1]-k[1],db=pixels[i+2]-k[2];
    return dr*dr+dg*dg+db*db;
  };
  // Ne pas détourer si l'image n'a pas de zones de fond détectables.
  let coherent=0;
  for(const [x,y] of [[0,0],[W-1,0],[0,H-1],[W-1,H-1]]){
    const p=pix(x,y);
    if(keys.some(k=>d2(p,k)<3600))coherent++;
  }
  if(coherent>=3){
    const visited=new Uint8Array(W*H),queue=new Int32Array(W*H);
    let start=0,end=0;
    const put=(x,y)=>{
      if(x<0||x>=W||y<0||y>=H)return;
      const n=y*W+x;if(visited[n])return;visited[n]=1;
      const i=n*4;
      // Comparer au fond local et non à un unique bleu global.
      let min=Infinity;
      for(const key of keys)min=Math.min(min,d2(i,key));
      if(min<2400){queue[end++]=n;}
    };
    for(let x=0;x<W;x++){put(x,0);put(x,H-1);}
    for(let y=0;y<H;y++){put(0,y);put(W-1,y);}
    const mask=new Uint8Array(W*H);
    while(start<end){
      const n=queue[start++];mask[n]=1;
      const x=n%W,y=Math.floor(n/W);
      if(x>0)put(x-1,y);
      if(x<W-1)put(x+1,y);
      if(y>0)put(x,y-1);
      if(y<H-1)put(x,y+1);
    }
    const removed=end/(W*H);
    // Protection anti-effacement des visages : ne remplacer que si
    // la surface semble correspondre au fond (pas à toute la photo).
    if(removed>.045&&removed<.68){
      for(let n=0;n<W*H;n++)if(mask[n]){
       const i=n*4;pixels[i]=COLOR[0];pixels[i+1]=COLOR[1];pixels[i+2]=COLOR[2];
       pixels[i+3]=255;
      }
      ctx.putImageData(frame,0,0);
    }
  }
  // Un fond et un cadrage communs pour toutes les miniatures.
  const dest=document.createElement('canvas');dest.width=W;dest.height=H;
  const out=dest.getContext('2d');out.fillStyle='#081142';out.fillRect(0,0,W,H);
  out.imageSmoothingEnabled=false;out.drawImage(src,0,0);
  return dest.toDataURL('image/png');
 }
 window.ZikaFighterThumbNormalize=Object.freeze({
  fromImage(key,img){
   if(cache.has(key))return cache.get(key);
   let data=null;
   try{data=build(img);}catch(err){console.warn('Recadrage vignette '+key,err);}
   cache.set(key,data);
   return data;
  }
 });
})();
