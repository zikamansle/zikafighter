/* Fondu noir commun à tous les écrans Zika Fighter (arcade 16 bits).
   Entrée -> noir -> changement d'écran -> sortie du noir.
   Les entrées sont bloquées pendant une transition pour éviter les doubles START. */
(() => {
  'use strict';
  if(window.ZikaFighterScreens)return;
  const curtain=document.createElement('div');
  curtain.id='zf-black-transition';
  curtain.setAttribute('aria-hidden','true');
  Object.assign(curtain.style,{
    position:'fixed',inset:'0',background:'#000',opacity:'0',
    zIndex:'2147483646',pointerEvents:'none',
    transition:'opacity 185ms linear',willChange:'opacity'
  });
  document.body.appendChild(curtain);
  let busy=false;
  function change(action,config={}){
    if(busy)return false;
    busy=true;
    curtain.style.pointerEvents='auto';
    const fadeOut=Math.max(0,config.out??185);
    const hold=Math.max(0,config.hold??45);
    const fadeIn=Math.max(0,config.in??185);
    curtain.style.transition='opacity '+fadeOut+'ms linear';
    requestAnimationFrame(()=>{
      // Double frame: ensure the browser paints opacity=0 before transitioning.
      requestAnimationFrame(()=>{curtain.style.opacity='1';});
    });
    setTimeout(()=>{
      try{action();}catch(err){console.error('Zika Fighter : transition',err);}
      setTimeout(()=>{
        curtain.style.transition='opacity '+fadeIn+'ms linear';
        curtain.style.opacity='0';
        setTimeout(()=>{
          curtain.style.pointerEvents='none';
          busy=false;
        },fadeIn+35);
      },hold);
    },fadeOut+35);
    return true;
  }
  window.ZikaFighterScreens={
    change,
    get busy(){return busy;},
    get element(){return curtain;}
  };
})();