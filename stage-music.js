/* Zika Fighter — musiques individuelles des arènes.
 * Les pistes doivent être placées sous assets/audio/stages/<id>.mp3.
 * Aucune musique d'un autre stage n'est utilisée en remplacement.
 */
(()=>{'use strict';
  if(window.ZikaFighterStageMusic)return;
  const stageIds=[
    'partenaires','ats','boulevard-tilleuls','cars-thorin-vriet',
    'credit-agricole','departement-charente','font-gardoire',
    'font-poisson','hotel-de-ville','indalo','maif','mediatheque',
    'office-tourisme','parc-floral','pont-mansle','rue-grande',
    'salle-gautier','square-verdun','super-u','ti-tout-ncf','royaume-zika'
  ];
  const tracks=Object.freeze(Object.fromEntries(stageIds.map(id=>[
    id,'./assets/audio/stages/'+id+'.mp3'
  ])));
  let active=null,session=0;
  function level(){
    const s=window.ZikaFighterSettings||window.ZikaArcadeAudio?.getSettings?.()||{};
    let value=Number(s.musicVolume??7);
    if(!Number.isFinite(value))value=7;
    return Math.max(0,Math.min(1,value/10))*.85;
  }
  function stop(){
    session++;
    const old=active;
    active=null;
    if(old){old.pause();old.removeAttribute('src');old.load();}
  }
  function syncVolume(){if(active)active.volume=level();}
  function start(id,onUnavailable){
    stop();
    if(!Object.hasOwn(tracks,id))return false;
    const token=session, audio=new Audio(tracks[id]);
    active=audio;
    audio.loop=true;
    audio.preload='auto';
    audio.volume=level();
    let handled=false;
    const unavailable=()=>{
      if(handled||token!==session||active!==audio)return;
      handled=true;
      stop();
      console.warn('Zika Fighter : piste de stage indisponible',id);
      onUnavailable?.();
    };
    audio.addEventListener('error',unavailable,{once:true});
    try{
      const p=audio.play();
      if(p?.catch)p.catch(unavailable);
    }catch(_){unavailable();}
    return true;
  }
  window.addEventListener('zika:settings-changed',syncVolume);
  window.ZikaFighterStageMusic=Object.freeze({
    start,stop,syncVolume,tracks,ids:()=>stageIds.slice(),
    activeStage:()=>active?stageIds.find(id=>active.src.endsWith('/'+id+'.mp3'))||null:null
  });
})();