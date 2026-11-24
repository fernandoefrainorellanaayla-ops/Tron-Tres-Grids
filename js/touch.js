/* TRON — touch.js: controles táctiles (solo en teléfono). Joystick virtual + botones. Reutiliza el sistema de teclas: genera eventos de teclado/ratón. */
(function (TG) {
    'use strict';
    if (!TG.platform || !TG.platform.touch) return;
    const cv = () => document.getElementById('game-canvas');
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }));
    const tap = (code) => { key(code, true); setTimeout(() => key(code, false), 60); };
    function build() {
        const ui = document.createElement('div'); ui.id = 'touch-ui';
        ui.innerHTML = `<div id="tj-base"><div id="tj-knob"></div></div>
          <div id="tb-right">
            <button class="tb big" data-act="disc">DISCO</button>
            <button class="tb" data-key="KeyE">E</button><button class="tb" data-key="KeyV">CICLO</button>
            <button class="tb sm" data-key="ShiftLeft">🌀</button><button class="tb sm" data-key="KeyY">✍</button><button class="tb sm" data-key="KeyF">🔌</button><button class="tb sm" data-key="KeyH">💻</button><button class="tb sm" data-key="KeyP">🌀P</button>
          </div>
          <div id="tb-top"><button class="tb sm" data-key="KeyQ">MISIONES</button><button class="tb sm" data-key="KeyM">MAPA</button><button class="tb sm" data-key="KeyI">🛒</button><button class="tb sm" data-key="KeyK">♥</button><button class="tb sm" data-key="KeyO">🌐</button><button class="tb sm" data-key="Escape">✕</button></div>
          <div id="tb-items"><button class="tb sm" data-key="Digit1">1</button><button class="tb sm" data-key="Digit2">2</button><button class="tb sm" data-key="Digit3">3</button><button class="tb sm" data-key="Digit4">4</button></div>`;
        document.body.appendChild(ui);
        const base = ui.querySelector('#tj-base'), knob = ui.querySelector('#tj-knob'); let id = null, cx = 0, cy = 0; const held = {};
        const set = (codes, on) => { for (const c of codes) if (!!held[c] !== on) { held[c] = on; key(c, on); } };
        const apply = (dx, dy) => { const d = 0.28; set(['KeyA', 'ArrowLeft'], dx < -d); set(['KeyD', 'ArrowRight'], dx > d); set(['KeyW', 'ArrowUp'], dy < -d); set(['KeyS', 'ArrowDown'], dy > d); };
        const move = (e) => { const R = 60; let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy); if (m > R) { dx = dx / m * R; dy = dy / m * R; } knob.style.transform = `translate(${dx}px,${dy}px)`; apply(dx / R, dy / R); };
        base.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; try { base.setPointerCapture(id); } catch (x) { /* */ } const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); if (TG.sound && TG.sound.ensure) TG.sound.ensure(); });
        base.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
        const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; apply(0, 0); };
        base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
        const mouseAt = (x, y, type) => { window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true })); cv().dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true })); };
        const fireDisc = (x, y) => { mouseAt(x, y, 'mousedown'); setTimeout(() => window.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true })), 80); };
        ui.querySelectorAll('.tb').forEach((b) => {
            b.addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation(); if (TG.sound && TG.sound.ensure) TG.sound.ensure(); b.classList.add('on');
                if (b.dataset.act === 'disc') {   // apuntado automático: al enemigo más cercano, o hacia donde miras
                    const g = TG.game; if (!g) return; const p = g.player, cam = g.camera; let best = null, bd = 700;
                    for (const en of g.combat.enemies) { if (!en.isAlive || en.ally) continue; const d = Math.hypot(en.x - p.x, en.y - p.y); if (d < bd) { bd = d; best = en; } }
                    const px = p.x - cam.ox, py = p.y - cam.oy - 30; fireDisc(best ? best.x - cam.ox : px + (p.f || 1) * 240, best ? best.y - cam.oy - 24 : py);
                } else if (b.dataset.key) tap(b.dataset.key);
            });
            b.addEventListener('pointerup', () => b.classList.remove('on')); b.addEventListener('pointercancel', () => b.classList.remove('on'));
        });
        cv().addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; fireDisc(e.clientX, e.clientY); });
        const SK = { ShiftLeft: 'dash', KeyY: 'rewrite', KeyF: 'faraday', KeyH: 'codeMastery', KeyP: 'portalDisc' };
        setInterval(() => { const g = TG.game; if (!g || !g.player) return; ui.querySelectorAll('.tb[data-key]').forEach((b) => { const sk = SK[b.dataset.key]; if (sk) b.style.display = g.player.skills[sk] ? '' : 'none'; }); ui.style.visibility = g.state === 'play' ? 'visible' : 'hidden'; }, 600);
        for (const t of ['gesturestart', 'dblclick']) document.addEventListener(t, (e) => e.preventDefault());
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})(window.TG = window.TG || {});
