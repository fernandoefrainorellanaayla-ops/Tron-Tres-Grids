/* ==========================================================================
   TRON: LAS TRES GRIDS — core.js
   Utilidades, avisos en pantalla, audio, entrada, cámara, partículas y canvas.
   ========================================================================== */
(function (TG) {
    'use strict';

    // ------------------------------------------------------------------ UTILS
    const U = TG.U = {
        clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
        lerp: (a, b, t) => a + (b - a) * t,
        rand: (a, b) => a + Math.random() * (b - a),
        pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
        dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
        smooth: (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); },
        easeOut: (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3),
        easeInOut: (t) => { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
        angDiff: (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; },
        strSeed: (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
        rng: (seed) => {
            let a = seed >>> 0;
            return () => {
                a = (a + 0x6D2B79F5) | 0;
                let t = Math.imul(a ^ (a >>> 15), 1 | a);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        },
        hash2: (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
        hex2rgb: (hex) => {
            let h = (hex || '#ffffff').replace('#', '');
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            const n = parseInt(h, 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        },
        rgba: (hex, a) => { const c = U.hex2rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },
        mix: (hexA, hexB, t) => {
            const a = U.hex2rgb(hexA), b = U.hex2rgb(hexB);
            return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
        },
        esc: (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    };

    // ----------------------------------------------------------------- TOASTS
    TG.Toast = {
        show(msg, kind = 'info', ms = 3600) {
            const box = document.getElementById('toast-container');
            if (!box) return;
            const el = document.createElement('div');
            el.className = 'toast ' + kind;
            el.textContent = msg;
            box.appendChild(el);
            while (box.children.length > 5) box.removeChild(box.firstChild);
            setTimeout(() => el.classList.add('out'), ms);
            setTimeout(() => el.remove(), ms + 500);
        }
    };

    // Ventana de recompensa / cinemática de texto (sustituye a alert())
    TG.Reveal = {
        show(opts, onClose) {
            const m = document.getElementById('reveal-modal');
            if (!m) { if (onClose) onClose(); return; }
            document.getElementById('reveal-kicker').textContent = opts.kicker || '';
            document.getElementById('reveal-title').textContent = opts.title || '';
            document.getElementById('reveal-body').innerHTML = opts.html || U.esc(opts.text || '');
            const btn = document.getElementById('reveal-close'), sec = document.getElementById('reveal-secondary');
            btn.textContent = opts.button || 'CONTINUAR';
            m.style.setProperty('--reveal-color', opts.color || 'var(--theme-primary)');
            if (opts.secondary) { sec.style.display = ''; sec.textContent = opts.secondary.text; } else sec.style.display = 'none';
            TG.Modals.open('reveal-modal');
            const done = (cb) => { TG.Modals.close('reveal-modal'); if (cb) cb(); };
            btn.onclick = () => done(onClose);
            sec.onclick = () => done(opts.secondary && opts.secondary.onClick);
        }
    };

    TG.state = { modalOpen: false, debug: /[?&]debug=1/.test(location.search) };

    // ------------------------------------------------------------------ AUDIO
    class Sound {
        constructor() { this.ctx = null; this.master = null; this.muted = false; this.drone = null; this.droneEra = null; }
        ensure() {
            if (!this.ctx) {
                try {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    this.ctx = new AC();
                    this.master = this.ctx.createGain();
                    this.master.gain.value = this.muted ? 0 : 0.8;
                    this.master.connect(this.ctx.destination);
                } catch (e) { this.ctx = null; }
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
            return this.ctx;
        }
        setMuted(m) {
            this.muted = m;
            if (this.master) this.master.gain.value = m ? 0 : 0.8;
        }
        tone(freq, dur, type = 'square', vol = 0.1, o = {}) {
            const c = this.ensure(); if (!c || this.muted) return;
            try {
                const t0 = c.currentTime + (o.delay || 0);
                const osc = c.createOscillator(); const g = c.createGain();
                osc.type = type; osc.frequency.setValueAtTime(freq, t0);
                if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + o.slide), t0 + dur);
                g.gain.setValueAtTime(0.0001, t0);
                g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3));
                g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
                osc.connect(g); g.connect(this.master);
                osc.start(t0); osc.stop(t0 + dur + 0.02);
            } catch (e) { /* audio opcional */ }
        }
        noise(dur, vol = 0.1, o = {}) {
            const c = this.ensure(); if (!c || this.muted) return;
            try {
                const t0 = c.currentTime + (o.delay || 0);
                const len = Math.max(1, Math.floor(c.sampleRate * dur));
                const buf = c.createBuffer(1, len, c.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
                const src = c.createBufferSource(); src.buffer = buf;
                const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.value = o.freq || 1200; f.Q.value = o.q || 1;
                if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t0 + dur);
                const g = c.createGain();
                g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
                src.connect(f); f.connect(g); g.connect(this.master);
                src.start(t0);
            } catch (e) { /* audio opcional */ }
        }
        throwDisc() { this.tone(900, 0.14, 'sawtooth', 0.07, { slide: -500 }); this.noise(0.12, 0.05, { freq: 2400 }); }
        discReturn() { this.tone(700, 0.12, 'sine', 0.06, { slide: 600 }); }
        discHit() { this.tone(180, 0.18, 'sawtooth', 0.12, { slide: -90 }); this.noise(0.15, 0.08, { freq: 900 }); }
        cycleStart() { this.tone(70, 0.5, 'sawtooth', 0.09, { slide: 160 }); this.noise(0.4, 0.05, { freq: 300, type: 'lowpass' }); }
        damage() { this.tone(160, 0.22, 'sawtooth', 0.14, { slide: -70 }); this.noise(0.18, 0.1, { freq: 600 }); }
        pickup() { [600, 800, 1000].forEach((f, i) => this.tone(f, 0.08, 'sine', 0.08, { delay: i * 0.06 })); }
        portal() { [300, 500, 700, 1000].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.05, { delay: i * 0.12 })); }
        ui() { this.tone(1100, 0.05, 'square', 0.04); }
        accept() { [520, 780].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.08, { delay: i * 0.09 })); }
        reward() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.08, { delay: i * 0.1 })); }
        eventAlert() { [400, 600, 800].forEach((f, i) => this.tone(f, 0.1, 'square', 0.06, { delay: i * 0.11 })); }
        zap() { this.noise(0.25, 0.12, { freq: 3000, q: 4, sweepTo: 600 }); this.tone(1400, 0.2, 'sawtooth', 0.06, { slide: -1000 }); }
        charge() { this.tone(300, 0.35, 'sine', 0.05, { slide: 700 }); }
        digitize(dur) {
            const n = Math.floor(dur * 14);
            this.noise(dur, 0.09, { freq: 500, q: 2, sweepTo: 6000 });
            this.tone(120, dur, 'sawtooth', 0.05, { slide: 900 });
            for (let i = 0; i < n; i++) this.tone(600 + Math.random() * 2600, 0.04, 'square', 0.025, { delay: Math.random() * dur });
        }
        // zumbido ambiental por era
        setAmbient(era) {
            const c = this.ensure(); if (!c || this.droneEra === era) return;
            this.droneEra = era;
            try {
                if (this.drone) { const d = this.drone; d.g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 1.2); setTimeout(() => { try { d.o1.stop(); d.o2.stop(); } catch (e) {} }, 1400); }
                const base = { '1982': 55, '2010': 41, '2025': 49 }[era] || 50;
                const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
                o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = base; o2.frequency.value = base * 1.504;
                f.type = 'lowpass'; f.frequency.value = era === '2025' ? 260 : 190;
                g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(0.028, c.currentTime + 2);
                o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.master);
                o1.start(); o2.start();
                this.drone = { o1, o2, g };
            } catch (e) { /* opcional */ }
        }
    }
    TG.Sound = Sound;

    // ------------------------------------------------------------------ INPUT
    class Input {
        constructor(canvas) {
            this.canvas = canvas;
            this.keys = {};
            this.mouse = { x: 0, y: 0 };
            this.enabled = true;
            this.on = {};
            const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
            window.addEventListener('keydown', (e) => {
                if (typing()) return;
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
                if (e.repeat) { this.keys[e.code] = true; return; }
                this.keys[e.code] = true;
                if (e.code === 'Escape' && this.on.escape) this.on.escape();
                if (!this.enabled) return;
                const map = { KeyV: 'mount', KeyE: 'interact', KeyQ: 'quests', KeyM: 'atlas', KeyX: 'mute', KeyB: 'bloom', KeyI: 'market', KeyY: 'abY', KeyF: 'abF', KeyH: 'abH', KeyP: 'portal', KeyK: 'contacts', Digit1: 'item1', Digit2: 'item2', Digit3: 'item3', Digit4: 'item4' };
                if (map[e.code] && this.on[map[e.code]]) this.on[map[e.code]]();
                if (e.code === 'Space' && this.on.disc1) this.on.disc1();
                if (e.code === 'KeyU' && TG.state.debug && this.on.debugU) this.on.debugU();
            });
            window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
            window.addEventListener('blur', () => { this.keys = {}; });
            window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
            canvas.addEventListener('mousedown', (e) => {
                if (!this.enabled) return;
                if (e.button === 0 && this.on.disc1) this.on.disc1();
                else if (e.button === 2 && this.on.disc2) this.on.disc2();
            });
            window.addEventListener('contextmenu', (e) => { if (e.target === canvas) e.preventDefault(); });
        }
        down(code) { return this.enabled && !!this.keys[code]; }
        get moveVec() {
            let x = 0, y = 0;
            if (this.down('KeyW')) y -= 1; if (this.down('KeyS')) y += 1;
            if (this.down('KeyA')) x -= 1; if (this.down('KeyD')) x += 1;
            return { x, y };
        }
    }
    TG.Input = Input;

    // ----------------------------------------------------------------- CAMERA
    class Camera {
        constructor() { this.x = 0; this.y = 0; this.w = 800; this.h = 600; this.target = null; this.smooth = 0.12; this.shakeMag = 0; this.ox = 0; this.oy = 0; }
        resize(w, h) { this.w = w; this.h = h; }
        follow(t) { this.target = t; }
        shake(m) { this.shakeMag = Math.max(this.shakeMag, m); }
        snap(mw, mh) { this.update(mw, mh, true); }
        update(mw, mh, snap) {
            if (this.target) {
                const tx = this.target.x - this.w / 2, ty = this.target.y - this.h / 2;
                const k = snap ? 1 : this.smooth;
                this.x += (tx - this.x) * k; this.y += (ty - this.y) * k;
            }
            if (mw <= this.w) this.x = (mw - this.w) / 2; else this.x = U.clamp(this.x, 0, mw - this.w);
            if (mh <= this.h) this.y = (mh - this.h) / 2; else this.y = U.clamp(this.y, 0, mh - this.h);
            this.shakeMag *= 0.86; if (this.shakeMag < 0.2) this.shakeMag = 0;
            this.ox = this.x + (this.shakeMag ? (Math.random() - 0.5) * this.shakeMag : 0);
            this.oy = this.y + (this.shakeMag ? (Math.random() - 0.5) * this.shakeMag : 0);
        }
        onScreen(x, y, pad = 200) { return x > this.ox - pad && x < this.ox + this.w + pad && y > this.oy - pad && y < this.oy + this.h + pad; }
    }
    TG.Camera = Camera;

    // -------------------------------------------------------------- PARTICLES
    class Particles {
        constructor() { this.list = []; this.max = 1800; }
        add(p) { if (this.list.length < this.max) this.list.push(p); }
        emit(x, y, color, count = 10, speed = 3, o = {}) {
            for (let i = 0; i < count; i++) {
                const a = o.angle !== undefined ? o.angle + (Math.random() - 0.5) * (o.spread || 0.5) : Math.random() * Math.PI * 2;
                const v = (Math.random() * 0.8 + 0.2) * speed;
                this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + (o.vy || 0), color, size: Math.random() * 2.6 + 1, life: 1, decay: o.decay || (Math.random() * 0.03 + 0.015), g: o.g || 0, kind: o.kind || 'dot' });
            }
        }
        voxels(x, y, color, count = 14, speed = 2.6) {
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2, v = Math.random() * speed;
                this.add({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 30, vx: Math.cos(a) * v * 0.6, vy: -Math.random() * speed - 0.5, color, size: 2 + Math.random() * 4, life: 1, decay: 0.012 + Math.random() * 0.02, g: -0.02, kind: 'box' });
            }
        }
        ring(x, y, color, r = 60) { this.add({ x, y, vx: 0, vy: 0, color, size: 6, life: 1, decay: 0.045, kind: 'ring', maxR: r }); }
        update() {
            for (let i = this.list.length - 1; i >= 0; i--) {
                const p = this.list[i];
                p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.vx *= 0.99;
                p.life -= p.decay;
                if (p.life <= 0) this.list.splice(i, 1);
            }
        }
        render(ctx, cam) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (const p of this.list) {
                const x = p.x - cam.ox, y = p.y - cam.oy;
                if (x < -50 || y < -50 || x > cam.w + 50 || y > cam.h + 50) continue;
                ctx.globalAlpha = Math.max(0, p.life);
                if (p.kind === 'ring') {
                    ctx.strokeStyle = p.color; ctx.lineWidth = 2.5 * p.life;
                    ctx.beginPath(); ctx.arc(x, y, p.maxR * (1 - p.life) + 4, 0, Math.PI * 2); ctx.stroke();
                } else if (p.kind === 'box') {
                    ctx.fillStyle = p.color; const s = p.size * (0.4 + p.life * 0.6); ctx.fillRect(x - s / 2, y - s / 2, s, s);
                } else {
                    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2); ctx.fill();
                }
            }
            ctx.restore();
        }
    }
    TG.Particles = Particles;

    // ----------------------------------------------------------------- CANVAS
    class CanvasManager {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.weather = document.getElementById('weather-canvas');
            this.wctx = this.weather.getContext('2d');
            this.dpr = 1; this.w = 800; this.h = 600; this.onResize = [];
            window.addEventListener('resize', () => this.resize());
            this.resize();
        }
        resize() {
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.w = window.innerWidth; this.h = window.innerHeight;
            for (const c of [this.canvas, this.weather]) {
                c.width = Math.round(this.w * this.dpr); c.height = Math.round(this.h * this.dpr);
            }
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.wctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.onResize.forEach(f => f(this.w, this.h));
        }
        begin() {
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.ctx.globalAlpha = 1; this.ctx.globalCompositeOperation = 'source-over';
            this.wctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.wctx.clearRect(0, 0, this.w, this.h);
        }
    }
    TG.CanvasManager = CanvasManager;

})(window.TG = window.TG || {});
