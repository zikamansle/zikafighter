/* Zika Fighter - séquence d'accueil originale, compatible avec la démo existante. */
(() => {
  'use strict';
  if (document.getElementById('zf-intro')) return;
  const overlay = document.createElement('div');
  overlay.id = 'zf-intro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Introduction Zika Fighter');
  overlay.innerHTML = [
    '<div class="zf-screen zf-splash" id="zf-splash">',
    '<div class="zf-publisher">ZIKACOM<sup style="font-size:.22em;vertical-align:top;letter-spacing:0">®</sup></div>',
    '</div>',
    '<div class="zf-screen zf-title" id="zf-title" hidden>',
    '<div class="zf-mark" aria-label="Zika Fighter"><span>ZIKA</span><span>FIGHTER</span></div>',
    '<div class="zf-press" aria-hidden="true">PUSH START</div>',
    '<div class="zf-copyright">© 2027 ZIKACOM<br>ALL RIGHTS RESERVED</div>',
    '<div class="zf-credits">CREDIT 00</div>',
    '<button type="button" id="zf-audio" aria-label="Activer la musique arcade" style="position:absolute;bottom:10%;right:3%;z-index:3;background:#09135a;color:white;border:2px solid #fff;padding:8px 12px;font:700 12px monospace;cursor:pointer">♪ ACTIVER LE SON</button>',
    '<button type="button" id="zf-start" class="zf-start" aria-label="Commencer Zika Fighter et choisir son personnage">COMMENCER</button>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);
  for (const [filename, readyClass] of [['zika-fighter-title.png','zf-title-ready'], ['zikacom-splash.png','zf-splash-ready']]) {
    const image = new Image();
    image.onload = () => { if (image.naturalWidth > 0) overlay.classList.add(readyClass); };
    image.src = './assets/' + filename;
  }
  const splash = document.getElementById('zf-splash');
  const title = document.getElementById('zf-title');
  const button = document.getElementById('zf-start');
  const soundButton = document.getElementById('zf-audio');
  soundButton.addEventListener('click', event => {
    event.stopPropagation();
    if (window.ZikaArcadeAudio?.startTitle()) soundButton.textContent='♪ MUSIQUE ACTIVÉE';
  });
  let phase = 'publisher';
  let closed = false;
  let splashTimer;
  let audioContext;

  const beep = (frequency, duration, shape = 'square') => {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext ||= new Context();
      if (audioContext.state === 'suspended') void audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = shape;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(0.07, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* Audio optionnel, l'interface doit rester utilisable. */ }
  };
  const showTitle = () => {
    if (closed || phase !== 'publisher') return;
    clearTimeout(splashTimer);
    phase = 'title';
    splash.hidden = true;
    title.hidden = false;
    button.focus({ preventScroll: true });
    if (window.ZikaArcadeAudio && window.ZikaArcadeAudio.startTitle && window.ZikaArcadeAudio.unlock()) {
      // L'autoplay sera silencieux si le navigateur n'a reçu aucune interaction.
      if (navigator.userActivation?.hasBeenActive) window.ZikaArcadeAudio.startTitle();
    }
  };
  const launch = () => {
    if (closed) return;
    if (phase === 'publisher') { window.ZikaArcadeAudio?.logo(); showTitle(); return; }
    closed = true;
    phase = 'selection';
    window.ZikaArcadeAudio?.stop();
    window.ZikaArcadeAudio?.select();
    overlay.classList.add('zf-fade');
    window.setTimeout(() => {
      overlay.remove();
      // La grille Pascal/Micka de la démo est l'écran de sélection actuellement jouable.
      const first = document.querySelector('[data-player]');
      if (first) first.focus({ preventScroll: true });
      if (audioContext && audioContext.state !== 'closed') void audioContext.close();
    }, 390);
  };
  const keydown = event => {
    if (closed || !document.body.contains(overlay)) return;
    if (['Enter', 'Space', 'NumpadEnter'].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      launch();
    } else if (event.code === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (phase === 'publisher') showTitle();
      else launch();
    }
  };
  document.addEventListener('keydown', keydown, true);
  button.addEventListener('click', launch);
  splash.addEventListener('click', () => { window.ZikaArcadeAudio?.logo(); showTitle(); });
  // La marque apparaît d'abord, puis l'écran-titre. Aucun son automatique interdit par le navigateur.
  splashTimer = window.setTimeout(showTitle, 1900);
})();