/* TRON — platform.js: detecta teléfono/PC. Los builds (tools/build.py) fijan window.TRON_BUILD = 'web' | 'mobile'. Sin build, se detecta solo. */
(function (TG) {
    'use strict';
    const q = new URLSearchParams(location.search);
    const coarse = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && Math.min(screen.width, screen.height) < 900);
    let touch = coarse || q.get('touch') === '1';
    if (window.TRON_BUILD === 'web') touch = q.get('touch') === '1';
    if (window.TRON_BUILD === 'mobile') touch = true;
    TG.platform = { touch, build: window.TRON_BUILD || 'auto', low: touch || q.get('low') === '1' };
    document.documentElement.classList.toggle('touch', touch);
    if (touch && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})(window.TG = window.TG || {});
