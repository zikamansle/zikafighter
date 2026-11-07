/* Musique et effets originaux chiptune pour Zika Fighter. Aucun fichier audio externe. */
(() => {
  'use strict';
  if (window.ZikaArcadeAudio) return;
  let ctx=null, master=null, timer=null, beat=0, playing=false;
  const AC=()=>window.AudioContext||window.webkitAudioContext;
  function unlock(){
    try {
      if(!ctx){const C=AC();if(!C)return false;ctx=new C();master=ctx.createGain();master.gain.value=.23;master.connect(ctx.destination);}
      if(ctx.state==='suspended') void ctx.resume();
      return true;
    }catch(_){return false;}
  }
  function note(freq,duration=.12,at=0,type='square',level=.08){
    if(!ctx||!master)return;
    const start=ctx.currentTime+at;
    const osc=ctx.createOscillator(),env=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,start);
    env.gain.setValueAtTime(.0001,start);
    env.gain.exponentialRampToValueAtTime(Math.max(.001,level),start+.008);
    env.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(env);env.connect(master);osc.start(start);osc.stop(start+duration+.015);
  }
  const melody=[392,0,466.16,523.25,587.33,0,523.25,466.16,392,0,349.23,392,466.16,0,349.23,293.66,311.13,0,392,466.16,523.25,0,466.16,392,349.23,0,311.13,349.23,392,0,293.66,261.63];
  const bass=[130.81,130.81,155.56,116.54];
  function tick(){
    if(!playing||!ctx)return;
    const i=beat++;
    const m=melody[i%melody.length];
    if(m)note(m,.125,0,'square',.09);
    if(i%2===0)note(bass[Math.floor(i/8)%4],.19,0,'triangle',.13);
    if(i%4===0)note(85,.08,0,'sine',.18);
    if(i%4===2)note(174.6,.055,0,'triangle',.07);
  }
  function startTitle(){
    if(!unlock())return false;
    if(playing)return true;
    playing=true;beat=0;tick();timer=window.setInterval(tick,167);
    return true;
  }
  function stop(){playing=false;if(timer!==null){window.clearInterval(timer);timer=null;}}
  function logo(){if(!unlock())return;[392,523.25,659.25,1046.5].forEach((f,i)=>note(f,.16,i*.11,'square',.12));}
  function select(){if(!unlock())return;note(523.25,.08,0,'square',.15);note(784,.16,.085,'square',.14);}
  function transition(){if(!unlock())return;[392,466.16,587.33,784].forEach((f,i)=>note(f,.08,i*.065,'sawtooth',.09));}
  window.ZikaArcadeAudio={unlock,logo,startTitle,stop,select,transition};
})();