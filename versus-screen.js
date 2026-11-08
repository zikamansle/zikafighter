/* VS screen for Zika Fighter — 4:3, uses original approved portraits. */
(()=>{'use strict';
 if(window.ZikaFighterVersus)return;
 const root=document.createElement('div');
 root.id='zf-versus';root.hidden=true;root.setAttribute('aria-label','Écran VS avant le combat');
 root.innerHTML='<div class="zf-vs-picture"><div class="zf-vs-left zf-vs-player"><div class="zf-vs-portrait"><img id="zf-vs-img1" alt=""></div><div class="zf-vs-name" id="zf-vs-name1"></div></div><div class="zf-vs-emblem" aria-hidden="true">VS</div><div class="zf-vs-right zf-vs-player"><div class="zf-vs-portrait"><img id="zf-vs-img2" alt=""></div><div class="zf-vs-name" id="zf-vs-name2"></div></div></div>';
 document.body.appendChild(root);
 const track=new Audio('./assets/audio/4-versus.mp3');track.preload='auto';track.loop=false;
 const name=id=>({'fabienne-1':'FABIENNE','fabienne-2':'FABIENNE','elo':'ÉLO','bene':'BÉNÉ','kev':'KÉV','loic':'LOÏC'}[id]||String(id||'').replace(/-/g,' ').toUpperCase());
 let seq=0,timer=null;
 function close(){seq++;if(timer){clearTimeout(timer);timer=null;}track.pause();try{track.currentTime=0}catch(_){}root.hidden=true;}
 function show({player1,player2,onComplete}={}){
   close();const current=seq;
   const portraits=window.ZikaFighterLargePortraits||window.ZikaFighterPortraits||{};
   for(const [number,id] of [[1,player1],[2,player2]]){
     const img=root.querySelector('#zf-vs-img'+number);const source=portraits[id];
     if(source){img.src=source;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}
     img.alt=name(id);
     root.querySelector('#zf-vs-name'+number).textContent=name(id);
   }
   const enter=()=>{
     if(seq!==current)return;
     root.hidden=false;
     // VS starts at full requested level, never faded in/out.
     track.volume=Math.max(0,Math.min(1,Number(window.ZikaFighterSettings?.musicVolume??7)/10))*.85;
     try{track.currentTime=0}catch(_){}
     void track.play().catch(()=>{});
     timer=setTimeout(()=>{
       if(seq!==current)return;
       const exit=()=>{
         if(seq!==current)return;
         close();
         if(typeof onComplete==='function')onComplete();
       };
       if(window.ZikaFighterScreens?.change)window.ZikaFighterScreens.change(exit,{out:260,hold:35,in:260});
       else exit();
     },2500);
   };
   // Screen curtain owns visual fades, no audio fade on VS track.
   if(window.ZikaFighterScreens?.change)window.ZikaFighterScreens.change(enter,{out:260,hold:35,in:260});
   else enter();
   return true;
 }
 window.ZikaFighterVersus=Object.freeze({show,close});
})();
