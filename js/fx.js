/* ==========================================================================
   TRON: LAS TRES GRIDS — fx.js
   PostFX (bloom + viñeta), partículas ambientales y el DIGITALIZADOR:
   un láser barre la pantalla; la escena se desintegra en píxeles y la nueva
   se rematerializa. Se usa al iniciar la partida y al cruzar un portal.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;

    // ================================================================ POST FX
    class PostFX {
        constructor(cm) {
            this.cm = cm;
            this.a = document.createElement('canvas'); this.b = document.createElement('canvas');
            this.resize(); cm.onResize.push(() => this.resize());
            this.enabled = true;
        }
        resize() {
            const W = this.cm.canvas.width, H = this.cm.canvas.height;
            this.a.width = Math.max(8, W >> 2); this.a.height = Math.max(8, H >> 2);
            this.b.width = Math.max(8, W >> 3); this.b.height = Math.max(8, H >> 3);
        }
        apply(era, strength = 1) {
            const ctx = this.cm.ctx, src = this.cm.canvas, W = src.width, H = src.height;
            if (this.enabled) {
                const ac = this.a.getContext('2d'), bc = this.b.getContext('2d');
                ac.globalCompositeOperation = 'copy'; ac.filter = 'contrast(1.55) brightness(1.1) saturate(1.35)';
                ac.imageSmoothingEnabled = true; ac.drawImage(src, 0, 0, this.a.width, this.a.height); ac.filter = 'none';
                bc.globalCompositeOperation = 'copy'; bc.imageSmoothingEnabled = true; bc.drawImage(this.a, 0, 0, this.b.width, this.b.height);
                ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                ctx.globalAlpha = 0.6 * strength; ctx.drawImage(this.a, 0, 0, W, H);
                ctx.globalAlpha = 0.55 * strength; ctx.drawImage(this.b, 0, 0, W, H);
                ctx.restore();
            }
            // viñeta
            const w = this.cm.w, h = this.cm.h, th = G.THEME[era];
            const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.78);
            v.addColorStop(0, `rgba(${th.vignette},0)`); v.addColorStop(1, `rgba(${th.vignette},0.78)`);
            ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
        }
    }
    TG.PostFX = PostFX;

    // ============================================================ AMBIENTE
    class Ambient {
        constructor(cm) { this.cm = cm; this.p = []; this.era = null; this.lightning = 0; this.glitch = 0; }
        reset(era) {
            this.era = era; this.p = [];
            const n = era === '1982' ? 60 : era === '2010' ? 85 : 70;
            for (let i = 0; i < n; i++) this.p.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.9, s: Math.random() });
        }
        update(t) {
            if (this.era === '2010' && Math.random() < 0.0016) this.lightning = 1;
            if (this.era === '2025' && Math.random() < 0.01) this.glitch = 1;
            this.lightning *= 0.9; this.glitch *= 0.8;
        }
        render(cam, t, interior) {
            const c = this.cm.wctx, W = this.cm.w, H = this.cm.h, th = G.THEME[this.era || '1982'];
            if (!this.era) return;
            c.save(); c.globalCompositeOperation = 'lighter';
            const k = interior ? 0.4 : 1;
            for (const p of this.p) {
                let x, y;
                if (this.era === '1982') { y = ((p.y - t * 0.012 * p.z) % 1 + 1) % 1; x = ((p.x + Math.sin(t * 0.3 + p.s * 9) * 0.01) % 1 + 1) % 1; }
                else if (this.era === '2010') { y = ((p.y + t * 0.01 * p.z) % 1 + 1) % 1; x = ((p.x + t * 0.008 * p.z) % 1 + 1) % 1; }
                else { y = ((p.y - t * 0.02 * p.z) % 1 + 1) % 1; x = ((p.x + Math.sin(t * 0.8 + p.s * 9) * 0.015) % 1 + 1) % 1; }
                const px = ((x * W - cam.ox * 0.12 * p.z) % W + W) % W, py = ((y * H - cam.oy * 0.12 * p.z) % H + H) % H;
                const a = (0.25 + 0.5 * Math.abs(Math.sin(t * 1.3 + p.s * 20))) * p.z * k;
                c.fillStyle = U.rgba(this.era === '2025' ? (p.s > 0.5 ? '#ff5c7c' : '#ffb870') : th.major, a);
                if (this.era === '1982') c.fillRect(px, py, 2.4 * p.z, 2.4 * p.z);
                else { c.beginPath(); c.arc(px, py, 1.4 * p.z + 0.4, 0, Math.PI * 2); c.fill(); }
            }
            if (this.glitch > 0.1) {
                c.fillStyle = U.rgba('#ff1744', 0.12 * this.glitch);
                for (let i = 0; i < 4; i++) c.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6);
            }
            if (this.lightning > 0.05) { c.fillStyle = `rgba(190,255,255,${0.12 * this.lightning})`; c.fillRect(0, 0, W, H); }
            c.restore();
        }
    }
    TG.Ambient = Ambient;

    // ========================================================== DIGITALIZADOR
    TG.DIGI_STYLES = { '1982': 'scan', r1982: 'scan', '2003': 'scan', '2010': 'cubes', r2010: 'cubes', '2025': 'laser', r2025: 'laser', arq: 'glitch' };
    class Digitizer {
        constructor(cm) {
            this.cm = cm; this.active = false; this.phase = 'idle'; this.t = 0;
            this.snap = document.createElement('canvas'); this.full = document.createElement('canvas');
            this.levels = [6, 12, 24, 48].map(k => ({ k, c: document.createElement('canvas') }));
            this.parts = []; this.opts = null; this.hex = [];
        }
        start(opts) {
            this.opts = opts; this.active = true; this.t = 0; this.parts = []; this.midDone = false; this.doneCalled = false;
            const tr = opts.mode === 'transfer';
            this.dOut = tr ? 1500 : 0; this.dHold = tr ? 650 : 700; this.dIn = tr ? 2000 : 3000;
            this.era = opts.from || opts.to;
            if (tr) this._capture(this.snap);
            this.phase = tr ? 'out' : 'hold';
            this.hex = []; for (let i = 0; i < 9; i++) this.hex.push(this._hexLine());
            const total = (this.dOut + this.dHold + this.dIn) / 1000;
            if (TG.sound) TG.sound.digitize(total);
        }
        _hexLine() { let s = ''; for (let i = 0; i < 6; i++) s += Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0') + ' '; return s; }
        _capture(dest) {
            const src = this.cm.canvas, W = src.width, H = src.height;
            dest.width = W; dest.height = H; const d = dest.getContext('2d'); d.setTransform(1, 0, 0, 1, 0, 0); d.drawImage(src, 0, 0);
            this._levels(dest, W, H);
        }
        _levels(from, W, H) {
            for (const l of this.levels) {
                l.c.width = Math.max(4, Math.ceil(W / (l.k * this.cm.dpr))); l.c.height = Math.max(4, Math.ceil(H / (l.k * this.cm.dpr)));
                const c = l.c.getContext('2d'); c.imageSmoothingEnabled = true; c.drawImage(from, 0, 0, l.c.width, l.c.height);
            }
        }
        update(dt) {
            if (!this.active) return;
            this.t += dt;
            const o = this.opts;
            if (this.phase === 'out' && this.t >= this.dOut) { this.phase = 'hold'; }
            if (this.phase === 'hold' && !this.midDone && this.t >= this.dOut + 80) { this.midDone = true; if (o.onMid) o.onMid(); }
            if (this.phase === 'hold' && this.t >= this.dOut + this.dHold) { this.phase = 'in'; this.era = o.to; }
            if (this.t >= this.dOut + this.dHold + this.dIn) { this.active = false; this.phase = 'idle'; if (!this.doneCalled) { this.doneCalled = true; if (o.onDone) o.onDone(); } }
            if (Math.random() < 0.18) { this.hex.shift(); this.hex.push(this._hexLine()); }
        }
        get progress() { return U.clamp(this.t / (this.dOut + this.dHold + this.dIn), 0, 1); }

        render() {
            if (!this.active) return;
            const cm = this.cm, ctx = cm.ctx, W = cm.canvas.width, H = cm.canvas.height, dpr = cm.dpr;
            const th = G.THEME[this.era || '1982'], o = this.opts, t = this.t;
            const live = this.phase === 'in';
            if (live) this._capture(this.full);   // copia del frame vivo
            const src = live ? this.full : this.snap;
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
            const style = TG.DIGI_STYLES[this.era] || 'scan';
            if (style !== 'scan') {   // estilos propios de cada película
                const ph = this.phase, pp = ph === 'out' ? U.clamp(t / this.dOut, 0, 1) : ph === 'in' ? U.clamp((t - this.dOut - this.dHold) / this.dIn, 0, 1) : 0;
                if (style === 'cubes') this._rCubes(ctx, src, W, H, dpr, th, ph, pp, t); else if (style === 'laser') this._rLaser(ctx, src, W, H, dpr, th, ph, pp, t); else this._rGlitch(ctx, src, W, H, dpr, th, ph, pp, t);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this._hud(ctx, cm.w, cm.h, th, o); ctx.restore(); return;
            }
            const sh = Math.ceil(12 * dpr), trail = H * 0.5;
            let lineY = -9999, showLine = false;
            if (this.phase === 'out') { lineY = -40 * dpr + (H + 80 * dpr) * U.easeInOut(t / this.dOut); showLine = true; }
            else if (this.phase === 'in') { const p = (t - this.dOut - this.dHold) / this.dIn; lineY = -40 * dpr + (H + 80 * dpr) * U.easeInOut(U.clamp(p / 0.9, 0, 1)); showLine = p < 0.9; }
            const out = this.phase === 'out';
            if (this.phase !== 'hold') {
                for (let y = 0, i = 0; y < H; y += sh, i++) {
                    const hh = Math.min(sh, H - y), yc = y + hh / 2;
                    let d;
                    if (out) d = yc > lineY ? -1 : (lineY - yc) / trail;
                    else d = yc > lineY ? -1 : (lineY - yc) / trail;
                    if (out) {
                        if (d < 0) { ctx.drawImage(src, 0, y, W, hh, 0, y, W, hh); continue; }
                        if (d > 0.85) continue;
                        const lv = d < 0.12 ? 0 : d < 0.28 ? 1 : d < 0.5 ? 2 : 3;
                        const a = 1 - U.smooth(d / 0.85);
                        this._slice(ctx, lv, y, hh, H, W, a, (U.hash2(i, Math.floor(t / 40)) - 0.5) * 46 * (1 - d) * dpr);
                    } else {
                        if (d < 0) continue;
                        if (d > 0.85) { ctx.drawImage(src, 0, y, W, hh, 0, y, W, hh); continue; }
                        const lv = d < 0.2 ? 3 : d < 0.4 ? 2 : d < 0.62 ? 1 : 0;
                        const a = U.smooth(d * 1.5 + 0.15);
                        this._slice(ctx, lv, y, hh, H, W, a, (U.hash2(i, Math.floor(t / 40)) - 0.5) * 30 * (1 - d) * dpr);
                    }
                }
            }
            // ---- retícula de píxeles en la zona vacía
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const cw = cm.w, ch = cm.h, cell = 28;
            ctx.globalCompositeOperation = 'lighter';
            for (let gx = 0; gx < cw; gx += cell) for (let gy = 0; gy < ch; gy += cell) {
                const inEmpty = out ? gy < lineY / dpr - ch * 0.5 : (this.phase === 'hold' ? true : gy > lineY / dpr);
                if (!inEmpty) continue;
                const h = U.hash2(gx / cell, gy / cell);
                const f = 0.5 + 0.5 * Math.sin(t * 0.004 + h * 40);
                ctx.fillStyle = U.rgba(th.glow, 0.035 + 0.07 * f * (h > 0.82 ? 3 : 1)); ctx.fillRect(gx + 1, gy + 1, cell - 2, cell - 2);
            }
            // ---- láser
            if (showLine) {
                const ly = lineY / dpr, wob = Math.sin(t * 0.02) * 1.5;
                const g = ctx.createLinearGradient(0, ly - 90, 0, ly + 90);
                g.addColorStop(0, U.rgba(th.glow, 0)); g.addColorStop(0.5, U.rgba(th.glow, 0.5)); g.addColorStop(1, U.rgba(th.glow, 0));
                ctx.fillStyle = g; ctx.fillRect(0, ly - 90, cw, 180);
                ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(0, ly - 1.5 + wob, cw, 3);
                ctx.fillStyle = U.rgba(th.glow, 0.9); ctx.fillRect(0, ly - 5 + wob, cw, 2); ctx.fillRect(0, ly + 3 + wob, cw, 2);
                G.glow(ctx, cw * ((t * 0.0012) % 1), ly, 120, '#fff', 0.5);
                // voxels que se desprenden de la línea
                for (let k = 0; k < 18; k++) this.parts.push({ x: Math.random() * cw, y: ly + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 1.4, vy: (out ? -1 : 1) * (0.5 + Math.random() * 3), s: 2 + Math.random() * 5, a: 1, c: Math.random() < 0.3 ? '#ffffff' : th.glow });
            }
            for (let i = this.parts.length - 1; i >= 0; i--) {
                const p = this.parts[i]; p.x += p.vx; p.y += p.vy; p.a -= 0.017;
                if (p.a <= 0) { this.parts.splice(i, 1); continue; }
                ctx.fillStyle = U.rgba(p.c, p.a); ctx.fillRect(p.x, p.y, p.s, p.s);
            }
            if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
            // ---- haz de digitalización sobre el usuario (inicio de partida)
            if (o.mode === 'boot' && o.beam) {
                const p = U.clamp(t / (this.dHold + this.dIn), 0, 1);
                const bx = o.beam.x, by = o.beam.y, k = 1 - U.smooth((p - 0.55) / 0.45);
                if (k > 0.01) {
                    const g = ctx.createLinearGradient(0, 0, 0, by);
                    g.addColorStop(0, U.rgba('#ffffff', 0.0)); g.addColorStop(0.7, U.rgba(th.glow, 0.55 * k)); g.addColorStop(1, U.rgba('#ffffff', 0.9 * k));
                    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 8, -10); ctx.lineTo(bx + 8, -10); ctx.lineTo(bx + 62 * (0.4 + k), by + 4); ctx.lineTo(bx - 62 * (0.4 + k), by + 4); ctx.closePath(); ctx.fill();
                    G.glow(ctx, bx, by, 120 * k + 20, '#ffffff', 0.55 * k);
                    for (let i = 0; i < 3; i++) { const rr = ((p * 2.4 + i / 3) % 1); ctx.strokeStyle = U.rgba(th.glow, (1 - rr) * 0.9 * k); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(bx, by, 20 + rr * 160, (20 + rr * 160) * 0.34, 0, 0, Math.PI * 2); ctx.stroke(); }
                }
            }
            // ---- texto de estado
            ctx.globalCompositeOperation = 'source-over';
            const pr = Math.round(this.progress * 100);
            ctx.font = '12px "Share Tech Mono", monospace'; ctx.textAlign = 'left'; ctx.fillStyle = U.rgba(th.glow, 0.8);
            for (let i = 0; i < this.hex.length; i++) ctx.fillText(this.hex[i], 22, 36 + i * 15);
            ctx.textAlign = 'center'; ctx.font = 'bold 18px Orbitron, sans-serif'; ctx.fillStyle = '#fff';
            const label = o.label || 'DIGITALIZANDO USUARIO';
            ctx.fillText(`${label}… ${pr}%`, cw / 2, ch - 78);
            ctx.font = '12px "Share Tech Mono", monospace'; ctx.fillStyle = U.rgba(th.glow, 0.9);
            if (o.sub) ctx.fillText(o.sub, cw / 2, ch - 56);
            const bw = Math.min(420, cw * 0.5); ctx.strokeStyle = U.rgba(th.glow, 0.8); ctx.lineWidth = 1; ctx.strokeRect(cw / 2 - bw / 2, ch - 42, bw, 8);
            ctx.fillStyle = th.glow; ctx.fillRect(cw / 2 - bw / 2 + 2, ch - 40, (bw - 4) * this.progress, 4);
            // destello final
            ctx.restore();
        }

        // ---- texto de estado común a todos los estilos
        _hud(ctx, cw, ch, th, o) {
            ctx.globalCompositeOperation = 'source-over'; const pr = Math.round(this.progress * 100);
            ctx.font = '12px "Share Tech Mono", monospace'; ctx.textAlign = 'left'; ctx.fillStyle = U.rgba(th.glow, 0.8); for (let i = 0; i < this.hex.length; i++) ctx.fillText(this.hex[i], 22, 36 + i * 15);
            ctx.textAlign = 'center'; ctx.font = 'bold 18px Orbitron, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`${o.label || 'DIGITALIZANDO USUARIO'}… ${pr}%`, cw / 2, ch - 78);
            ctx.font = '12px "Share Tech Mono", monospace'; ctx.fillStyle = U.rgba(th.glow, 0.9); if (o.sub) ctx.fillText(o.sub, cw / 2, ch - 56);
            const bw = Math.min(420, cw * 0.5); ctx.strokeStyle = U.rgba(th.glow, 0.8); ctx.lineWidth = 1; ctx.strokeRect(cw / 2 - bw / 2, ch - 42, bw, 8); ctx.fillStyle = th.glow; ctx.fillRect(cw / 2 - bw / 2 + 2, ch - 40, (bw - 4) * this.progress, 4);
        }
        // ---- TRON LEGACY (2010): la escena se rompe en cubos que se absorben en un vórtice; la Grid se forma desde el centro
        _rCubes(ctx, src, W, H, dpr, th, ph, p, t) {
            const cell = Math.round(40 * dpr), cx = W / 2, cy = H / 2, maxD = Math.hypot(cx, cy), out = ph === 'out';
            if (ph !== 'hold') for (let gy = 0; gy < H; gy += cell) for (let gx = 0; gx < W; gx += cell) {
                const mx = gx + cell / 2, my = gy + cell / 2, dn = Math.hypot(mx - cx, my - cy) / maxD, nz = U.hash2(gx / cell, gy / cell);
                const delay = out ? (1 - dn) * 0.45 + nz * 0.15 : dn * 0.5 + nz * 0.15, k = U.clamp((p - delay) / 0.4, 0, 1);
                if (out) {
                    if (k >= 1) continue; const e = U.easeInOut(k), ang = e * (3 + nz * 5) + k * 6, sc = 1 - e * 0.95, sw = e * 2.4;   // espiral hacia el centro
                    const ex = cx + (mx - cx) * (1 - e) + Math.cos(Math.atan2(my - cy, mx - cx) + sw) * 0, ey = cy + (my - cy) * (1 - e);
                    const rx = cx + Math.cos(Math.atan2(my - cy, mx - cx) + sw) * Math.hypot(mx - cx, my - cy) * (1 - e), ry = cy + Math.sin(Math.atan2(my - cy, mx - cx) + sw) * Math.hypot(mx - cx, my - cy) * (1 - e);
                    ctx.save(); ctx.translate(k > 0 ? rx : ex, k > 0 ? ry : ey); ctx.rotate(k > 0 ? ang : 0); ctx.globalAlpha = 1 - e * 0.6; ctx.drawImage(src, gx, gy, cell, cell, -cell * sc / 2, -cell * sc / 2, cell * sc, cell * sc);
                    if (k > 0) { ctx.globalAlpha = 0.9 * (1 - e); ctx.strokeStyle = th.major; ctx.lineWidth = 1.4 * dpr; ctx.strokeRect(-cell * sc / 2, -cell * sc / 2, cell * sc, cell * sc); } ctx.restore();
                } else {
                    if (k <= 0) continue; const e = U.easeInOut(k), sc = e, ex = cx + (mx - cx) * e, ey = cy + (my - cy) * e, ang = (1 - e) * (2 + nz * 4);
                    ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang); ctx.globalAlpha = Math.min(1, k * 2); ctx.drawImage(src, gx, gy, cell, cell, -cell * sc / 2, -cell * sc / 2, cell * sc, cell * sc);
                    if (k < 1) { ctx.globalAlpha = (1 - k) * 0.95; ctx.strokeStyle = nz > 0.75 ? th.accent : th.major; ctx.lineWidth = 1.6 * dpr; ctx.strokeRect(-cell * sc / 2, -cell * sc / 2, cell * sc, cell * sc); } ctx.restore();
                }
            }
            // rayos de velocidad radiales y vórtice central
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
            const inten = ph === 'hold' ? 0.9 : out ? U.smooth(p * 1.6) : 1 - U.smooth(p * 1.2);
            for (let i = 0; i < 46; i++) {
                const a = i * 2.399 + t * 0.0007, r0 = (0.08 + 0.9 * ((i * 0.37 + t * (out ? -0.0011 : 0.0011)) % 1 + 1) % 1) * maxD, r1 = r0 + 40 + 120 * inten;
                ctx.strokeStyle = U.rgba(i % 5 === 0 ? th.accent : th.major, 0.18 + 0.5 * inten * ((i % 3) / 3 + 0.3)); ctx.lineWidth = (1 + (i % 3)) * dpr; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.62); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.62); ctx.stroke();
            }
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, (60 + i * 46 + 30 * Math.sin(t * 0.004 + i)) * dpr * (0.4 + inten), (22 + i * 16) * dpr * (0.4 + inten), t * 0.0015 * (i % 2 ? 1 : -1), 0, Math.PI * 2); ctx.strokeStyle = U.rgba(i % 2 ? th.accent : '#ffffff', 0.5 * inten + 0.1); ctx.lineWidth = 2 * dpr; ctx.stroke(); }
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220 * dpr * (0.5 + inten)); g.addColorStop(0, `rgba(255,255,255,${0.75 * inten})`); g.addColorStop(0.4, U.rgba(th.glow, 0.35 * inten)); g.addColorStop(1, U.rgba(th.glow, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
        }
        // ---- TRON: ARES (2025): láser que "imprime" la escena en partículas, de abajo hacia arriba
        _rLaser(ctx, src, W, H, dpr, th, ph, p, t) {
            const out = ph === 'out', band = Math.round(150 * dpr), cell = Math.max(5, Math.round(8 * dpr));
            const planeY = ph === 'hold' ? (t * 0.25 % 1) * H : H * (1 - U.easeInOut(p)) ;   // el plano sube de abajo hacia arriba
            if (ph !== 'hold') {
                // zona ya impresa: in → debajo del plano (se ve la escena); out → encima del plano (aún sin borrar)
                ctx.save(); ctx.beginPath(); if (out) ctx.rect(0, 0, W, Math.max(0, planeY - band)); else ctx.rect(0, planeY + band, W, H); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
                // banda de transición en trama de puntos (halftone)
                for (let gy = Math.max(0, Math.floor((planeY - band) / cell) * cell); gy < Math.min(H, planeY + band); gy += cell) {
                    const f0 = (gy + cell / 2 - planeY) / band;   // -1 (arriba) … 1 (abajo)
                    const f = out ? U.clamp(0.5 - f0 * 0.5 * -1, 0, 1) : U.clamp(0.5 + f0 * 0.5, 0, 1);
                    const rev = out ? U.clamp(0.5 - f0 * 0.5 - 0.5 + 0.5, 0, 1) : f;
                    for (let gx = 0; gx < W; gx += cell) {
                        const n = U.hash2(gx / cell, gy / cell), sz = cell * U.clamp((out ? (1 - f) : f) * 1.15 - n * 0.35, 0, 1); if (sz < 1) continue;
                        ctx.drawImage(src, gx, gy, cell, cell, gx + (cell - sz) / 2, gy + (cell - sz) / 2, sz, sz);
                    }
                }
            }
            // nube de puntos tenue en la zona aún no impresa y plano láser
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
            const zoneTop = ph === 'hold' ? 0 : out ? planeY : 0, zoneBot = ph === 'hold' ? H : out ? H : planeY;
            for (let i = 0; i < 160; i++) { const x = U.hash2(i, 3) * W, y = zoneTop + U.hash2(i, 9) * Math.max(1, zoneBot - zoneTop) - ((t * 0.04 * (1 + U.hash2(i, 5))) % 50); ctx.fillStyle = U.rgba(i % 7 === 0 ? '#ffffff' : th.glow, 0.25 + 0.5 * U.hash2(i, 7)); ctx.fillRect(x, y, 2 * dpr, 2 * dpr); }
            const ly = planeY, px = W * (0.5 + 0.38 * Math.sin(t * 0.0021));
            const gr = ctx.createLinearGradient(0, ly - 110 * dpr, 0, ly + 110 * dpr); gr.addColorStop(0, U.rgba(th.glow, 0)); gr.addColorStop(0.5, U.rgba(th.glow, 0.5)); gr.addColorStop(1, U.rgba(th.glow, 0)); ctx.fillStyle = gr; ctx.fillRect(0, ly - 110 * dpr, W, 220 * dpr);
            ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillRect(0, ly - 1.5 * dpr, W, 3 * dpr); ctx.fillStyle = U.rgba(th.glow, 0.95); ctx.fillRect(0, ly - 4 * dpr, W, 2 * dpr); ctx.fillRect(0, ly + 3 * dpr, W, 2 * dpr);
            for (const sx of [0, W]) { ctx.strokeStyle = U.rgba(th.glow, 0.85); ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(px, ly); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.8 * dpr; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(px, ly); ctx.stroke(); }
            G.glow(ctx, px, ly, 90 * dpr, '#ffffff', 0.7);
            for (let k = 0; k < 14; k++) this.parts.push({ x: Math.random() * W / dpr, y: ly / dpr + (Math.random() - 0.5) * 6, vx: (Math.random() - 0.5) * 1.2, vy: -(0.5 + Math.random() * 2.6), s: 2 + Math.random() * 2, a: 0.9, c: Math.random() < 0.3 ? '#ffffff' : th.glow });
            ctx.restore();
            ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'lighter';
            for (let i = this.parts.length - 1; i >= 0; i--) { const q = this.parts[i]; q.x += q.vx; q.y += q.vy; q.a -= 0.02; if (q.a <= 0) { this.parts.splice(i, 1); continue; } ctx.fillStyle = U.rgba(q.c, q.a); ctx.fillRect(q.x, q.y, q.s, q.s); }
            if (this.parts.length > 700) this.parts.splice(0, this.parts.length - 700); ctx.restore();
        }
        // ---- ARQ GRID: glitch (cortes, desplazamientos y bucle de tiempo)
        _rGlitch(ctx, src, W, H, dpr, th, ph, p, t) {
            const strip = Math.max(6, Math.round(14 * dpr)), out = ph === 'out', amt = ph === 'hold' ? 1 : out ? U.smooth(p) : 1 - U.smooth(p), tt = Math.floor(t / 70);
            if (ph !== 'hold') for (let y = 0, i = 0; y < H; y += strip, i++) {
                const n = U.hash2(i, tt), jump = n > 1 - 0.55 * amt ? (U.hash2(i, tt + 9) - 0.5) * 220 * amt * dpr : 0, vis = (out ? U.hash2(i, 77) > amt * 0.92 : U.hash2(i, 77) < (1 - amt) * 1.0 + 0.04) ? 1 : 0;
                if (!vis && amt > 0.6) continue; ctx.globalAlpha = vis ? 1 : 0.35;
                ctx.drawImage(src, 0, y, W, strip, jump, y, W, strip);
                if (n > 0.8 && amt > 0.2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 * amt; ctx.drawImage(src, 0, y, W, strip, jump + 10 * dpr * amt, y, W, strip); ctx.fillStyle = U.rgba(th.glow, 0.25 * amt); ctx.fillRect(0, y, W, strip); ctx.fillStyle = U.rgba(th.accent, 0.18 * amt); ctx.fillRect(0, y + 2, W, 2); ctx.globalCompositeOperation = 'source-over'; }
            }
            ctx.globalAlpha = 1; ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 26; i++) { const bx = U.hash2(i, tt) * W, by = U.hash2(i, tt + 3) * H, bw = (30 + U.hash2(i, tt + 5) * 280) * dpr, bh = (4 + U.hash2(i, tt + 7) * 22) * dpr; if (U.hash2(i, tt + 11) < 0.55 + (1 - amt) * 0.3) continue; ctx.fillStyle = U.rgba(U.hash2(i, tt + 13) > 0.5 ? th.glow : th.accent, 0.25 + 0.4 * amt); ctx.fillRect(bx, by, bw, bh); }
            for (let y = 0; y < H; y += 4 * dpr) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y, W, dpr); }
            if (ph === 'hold') { ctx.font = `bold ${60 * dpr}px Orbitron, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = U.rgba(th.accent, 0.5 + 0.4 * U.hash2(tt, 1)); ctx.fillText('ERROR ⟲', W / 2 + (U.hash2(tt, 2) - 0.5) * 20 * dpr, H / 2); ctx.fillStyle = U.rgba(th.glow, 0.4); ctx.fillText('ERROR ⟲', W / 2 + 5 * dpr, H / 2 + 3 * dpr); }
            ctx.restore();
        }
        _slice(ctx, lv, y, hh, H, W, a, dx) {
            const l = this.levels[lv], k = l.c.height / H;
            ctx.globalAlpha = a;
            ctx.drawImage(l.c, 0, y * k, l.c.width, Math.max(1, hh * k), dx, y, W, hh);
            ctx.globalAlpha = 1;
        }
    }
    TG.Digitizer = Digitizer;

})(window.TG = window.TG || {});
