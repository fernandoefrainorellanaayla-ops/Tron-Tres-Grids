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
    // ---- comportamiento de "app": vibración, pantalla encendida, horizontal y pantalla completa (Capacitor)
    TG.haptic = (ms) => { try { if (touch && navigator.vibrate) navigator.vibrate(ms || 20); } catch (e) { /* sin vibración */ } };
    if (touch) {
        let lock = null; const keep = async () => { try { if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen'); } catch (e) { /* no disponible */ } };
        document.addEventListener('visibilitychange', keep); window.addEventListener('pointerdown', function once() { keep(); window.removeEventListener('pointerdown', once); });
        window.addEventListener('load', () => { const P = window.Capacitor && window.Capacitor.Plugins; if (!P) return;
            try { if (P.ScreenOrientation) P.ScreenOrientation.lock({ orientation: 'landscape' }); } catch (e) { /* */ } try { if (P.StatusBar) { P.StatusBar.hide(); } } catch (e) { /* */ } try { if (P.SplashScreen) P.SplashScreen.hide(); } catch (e) { /* */ }
            try { const el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement && !P) el.requestFullscreen(); } catch (e) { /* */ } });
    }
})(window.TG = window.TG || {});
