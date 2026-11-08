/* Zika Fighter: shared music/effects mixer for menus and combat.
   Respects the persistent OPTION MODE settings throughout the game. */
(() => {
  'use strict';
  if (window.ZikaArcadeAudio) return;
  const AC=()=>window.AudioContext||window.webkitAudioContext;
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
  let settings={musicVolume:7,fxVolume:8,stereo:true};
  try {
    const saved=JSON.parse(localStorage.getItem('zikafighter-options-v2')||'null');
    if(saved) settings={...settings,...saved};
  } catch (_) {}
  let ctx=null,musicOut=null,sfxOut=null,sfxLimiter=null,timer=null,beat=0,playing=false,effectPan=0;
  const decodedClips=new Map(),levelCache=new WeakMap();
  function updateGain(){
    if(!ctx)return;
    if(musicOut)musicOut.gain.setTargetAtTime(.57*clamp(settings.musicVolume,0,10)/10,ctx.currentTime,.012);
    if(sfxOut)sfxOut.gain.setTargetAtTime(clamp(settings.fxVolume,0,10)/10,ctx.currentTime,.012);
  }
  function unlock(){
    try {
      if(!ctx){
        const C=AC();if(!C)return false;
        ctx=new C();
        musicOut=ctx.createGain();
        sfxOut=ctx.createGain();
        musicOut.connect(ctx.destination);
        sfxLimiter=ctx.createDynamicsCompressor();
        sfxLimiter.threshold.value=-9;
        sfxLimiter.knee.value=4;
        sfxLimiter.ratio.value=8;
        sfxLimiter.attack.value=.003;
        sfxLimiter.release.value=.09;
        sfxOut.connect(sfxLimiter);
        sfxLimiter.connect(ctx.destination);
        updateGain();
      }
      if(ctx.state==='suspended') void ctx.resume().catch(()=>{});
      return ctx.state!=='closed';
    }catch(_){return false;}
  }
  function setLevels(music,fx){
    settings.musicVolume=clamp(music,0,10);
    settings.fxVolume=clamp(fx,0,10);
    updateGain();
  }
  function setSettings(next){
    if(next&&typeof next==='object')settings={...settings,...next};
    updateGain();
  }
  function note(freq,duration=.12,at=0,type='square',level=.08,channel='sfx',pan=null){
    if(!ctx)return;
    const start=ctx.currentTime+Math.max(0,at)+.014;
    const osc=ctx.createOscillator(),env=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,start);
    env.gain.setValueAtTime(.0001,start);
    env.gain.exponentialRampToValueAtTime(Math.max(.001,level),start+.008);
    env.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(env);
    if(ctx.createStereoPanner){
      const panner=ctx.createStereoPanner();
      const requestedPan=pan===null?(channel==='sfx'?effectPan:0):pan;
      panner.pan.value=settings.stereo?clamp(requestedPan,-1,1):0;
      env.connect(panner);
      panner.connect(channel==='music'?musicOut:sfxOut);
    }else{
      env.connect(channel==='music'?musicOut:sfxOut);
    }
    osc.start(start);osc.stop(start+duration+.015);
  }
  const melody=[392,0,466.16,523.25,587.33,0,523.25,466.16,392,0,349.23,392,466.16,0,349.23,293.66,311.13,0,392,466.16,523.25,0,466.16,392,349.23,0,311.13,349.23,392,0,293.66,261.63];
  const bass=[130.81,130.81,155.56,116.54];
  function tick(){
    if(!playing||!ctx)return;
    const i=beat++;
    const m=melody[i%melody.length];
    if(m)note(m,.125,0,'square',.09,'music',Math.sin(i*.7)*.38);
    if(i%2===0)note(bass[Math.floor(i/8)%4],.19,0,'triangle',.13,'music');
    if(i%4===0)note(85,.08,0,'sine',.18,'music');
    if(i%4===2)note(174.6,.055,0,'triangle',.07,'music');
  }
  function startTitle(){
    if(!unlock())return false;
    if(playing)return true;
    playing=true;beat=0;
    if(ctx.state==='running')tick();
    else void ctx.resume().then(()=>{if(playing)tick();}).catch(()=>{});
    timer=window.setInterval(tick,167);
    return true;
  }
  function stop(){playing=false;if(timer!==null){clearInterval(timer);timer=null;}}
  function playEffect(kind='select',pan=0){
    effectPan=clamp(pan,-1,1);
    if(!unlock())return;
    switch(kind){
      case 'punch':note(220,.065,0,'square',.18);note(110,.075,.025,'sawtooth',.13);break;
      case 'kick':note(158,.085,0,'sawtooth',.19);note(76,.13,.035,'triangle',.12);break;
      case 'hit':note(95,.12,0,'sawtooth',.22);note(55,.085,.025,'triangle',.15);break;
      case 'special':[262,392,523].forEach((f,i)=>note(f,.11,i*.045,'sawtooth',.11));break;
      case 'ko':[523,392,262,196].forEach((f,i)=>note(f,.2,i*.13,'square',.12));break;
      case 'round':[392,587,784].forEach((f,i)=>note(f,.13,i*.10,'square',.11));break;
      case 'move':note(660,.055,0,'square',.12);break;
      case 'confirm':note(525,.09,0,'square',.13);note(786,.13,.07,'square',.13);break;
      default:note(525,.085,0,'square',.13);
    }
  }

  // Normalisation RMS des fichiers de bruitage : toutes les sources courtes
  // sont calibrées avant le mixage, indépendamment de leur niveau d'origine.
  function sampleGain(buffer){
    if(!buffer||!buffer.numberOfChannels)return 1;
    const cached=levelCache.get(buffer);if(cached!==undefined)return cached;
    const stride=Math.max(1,Math.floor(buffer.length/32000));
    let sum=0,count=0,peak=0;
    for(let c=0;c<buffer.numberOfChannels;c++){
      const data=buffer.getChannelData(c);
      for(let i=0;i<data.length;i+=stride){
        const magnitude=Math.abs(data[i]);
        peak=Math.max(peak,magnitude);
        if(magnitude>.012){sum+=magnitude*magnitude;count++;}
      }
    }
    const rms=count?Math.sqrt(sum/count):0;
    // Environ -16 dBFS RMS sur les passages audibles ; limiter à -1.4 dBFS crête.
    const level=rms>0?.155/rms:1;
    const ceiling=peak>0?.85/peak:1;
    const gain=Math.min(12,Math.max(.16,Math.min(level,ceiling)));
    levelCache.set(buffer,gain);
    return gain;
  }
  function playSample(buffer,pan=0){
    if(!buffer||!unlock())return false;
    if(clamp(settings.fxVolume,0,10)===0)return true;
    try{
      const source=ctx.createBufferSource(),gain=ctx.createGain();
      source.buffer=buffer;gain.gain.value=sampleGain(buffer);
      source.connect(gain);
      if(ctx.createStereoPanner){
        const stereo=ctx.createStereoPanner();
        stereo.pan.value=settings.stereo?clamp(pan,-1,1):0;
        gain.connect(stereo);stereo.connect(sfxOut);
      }else gain.connect(sfxOut);
      source.start(ctx.currentTime);
      return true;
    }catch(err){console.warn('Zika Fighter : lecture normalisée impossible',err);return false;}
  }
  function preloadClip(url){
    if(decodedClips.has(url))return decodedClips.get(url);
    const request=Promise.resolve().then(()=>{
      if(typeof fetch!=='function')return null;
      return fetch(url).then(response=>{
        if(!response.ok)throw new Error('HTTP '+response.status+' pour '+url);
        return response.arrayBuffer();
      }).then(arrayBuffer=>{
        if(!unlock())return null;
        return ctx.decodeAudioData(arrayBuffer);
      });
    }).catch(()=>null);
    decodedClips.set(url,request);
    return request;
  }
  function fallbackMedia(url){
    try{
      const audio=new Audio(url);audio.preload='auto';
      audio.volume=clamp(settings.fxVolume,0,10)/10;
      const promise=audio.play();if(promise?.catch)promise.catch(()=>{});
      return true;
    }catch(_){return false;}
  }
  function playClip(url,onUnavailable){
    if(clamp(settings.fxVolume,0,10)===0)return true;
    if(!unlock()){
      if(typeof onUnavailable==='function')onUnavailable();
      else fallbackMedia(url);
      return false;
    }
    preloadClip(url).then(buffer=>{
      if(buffer&&playSample(buffer))return;
      if(typeof onUnavailable==='function')onUnavailable();
      else fallbackMedia(url);
    }).catch(()=>{
      if(typeof onUnavailable==='function')onUnavailable();
      else fallbackMedia(url);
    });
    return true;
  }
  // Traitement vocal commun des 21 annonces de stage.
  // AUCUN décalage de hauteur : +4,5 dB à 1,3 kHz, +2,5 dB à 2,5 kHz,
  // saturation douce (SNES granuleux), sans écho ni réverbération.
  // Les fichiers source restent inchangés dans assets/audio.
  const stageDistortionCurve=new Float32Array(2048);
  for(let i=0;i<stageDistortionCurve.length;i++){
    const value=(i/(stageDistortionCurve.length-1))*2-1;
    stageDistortionCurve[i]=Math.tanh(2.7*value)/Math.tanh(2.7);
  }
  async function playStageVoice(url){
    if(clamp(settings.fxVolume,0,10)===0)return true;
    const fallback=()=>new Promise(resolve=>{
      try{
        const el=new Audio(url);
        el.volume=clamp(settings.fxVolume,0,10)/10;
        el.preload='auto';
        el.onended=()=>resolve(true);
        el.onerror=()=>resolve(false);
        const result=el.play();
        if(result?.catch)result.catch(()=>resolve(false));
      }catch(_){resolve(false);}
    });
    if(!unlock())return fallback();
    const buffer=await preloadClip(url);
    if(!buffer||!ctx||ctx.state==='closed')return fallback();
    return new Promise(resolve=>{
      try{
        const source=ctx.createBufferSource();
        const level=ctx.createGain();
        const mid=ctx.createBiquadFilter();
        const clarity=ctx.createBiquadFilter();
        const sat=ctx.createWaveShaper();
        const output=ctx.createGain();
        source.buffer=buffer;
        level.gain.value=sampleGain(buffer);
        mid.type='peaking';mid.frequency.value=1300;mid.Q.value=.85;mid.gain.value=4.5;
        clarity.type='peaking';clarity.frequency.value=2500;clarity.Q.value=1;clarity.gain.value=2.5;
        sat.curve=stageDistortionCurve;
        sat.oversample='2x';
        output.gain.value=.83;
        source.connect(level);level.connect(mid);mid.connect(clarity);
        clarity.connect(sat);sat.connect(output);output.connect(sfxOut);
        source.onended=()=>resolve(true);
        source.start();
      }catch(err){
        console.warn('Zika Fighter : traitement vocal SNES indisponible',err);
        fallback().then(resolve);
      }
    });
  }

  const voiceFiles={
    round:'round.mp3',fight:'fight.mp3',win:'you-win-street-fighter.mp3',
    lose:'you-lose.mp3',perfect:'perfect.mp3',hadouken:'hadouken.mp3',
    grab:'grab-1.mp3',ya:'ya.mp3',final:'final.mp3'
  };
  function playVoice(kind){
    const filename=voiceFiles[kind];if(!filename)return false;
    return playClip('./assets/audio/'+encodeURIComponent(filename));
  }
  function logo(){if(!unlock())return;[392,523.25,659.25,1046.5].forEach((f,i)=>note(f,.16,i*.11,'square',.12));}
  function select(){playEffect('confirm');}
  function transition(){if(!unlock())return;[392,466,587,784].forEach((f,i)=>note(f,.08,i*.065,'sawtooth',.09));}
  function isRunning(){return !!ctx&&ctx.state==='running'&&playing;}
  function volume(value){setLevels(clamp(value,0,1)*10,settings.fxVolume);}
  window.addEventListener('zika:settings-changed',event=>setSettings(event.detail));
  window.ZikaArcadeAudio={
    unlock,logo,startTitle,stop,select,transition,isRunning,volume,
    setLevels,setSettings,playEffect,playVoice,playSample,playClip,preloadClip,sampleGain,playStageVoice,
    getSettings:()=>({...settings})
  };
})();