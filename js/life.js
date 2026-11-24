/* ==========================================================================
   TRON — life.js : el mundo cobra vida
   · Crowd: ciudadanos que pasean y ciclos que circulan (Grids y mundos reales).
   · GridEvents: eventos aleatorios con AVISO en pantalla:
       - FALLA DE LA GRID (inspirada en Tron: Betrayal): zonas que se desestabilizan y se caen; puedes reparar el nodo.
       - CARRERA ILEGAL: carrera clandestina en la que puedes participar o solo mirar.
       - TORNEO ILEGAL de discos: participa o mira... hasta que llega la REDADA.
       - APAGÓN: la Grid se queda a oscuras.
   · Redada → ARRESTO: pagas la multa o aceptas la anulación.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;
    const LINES = {
        grid: ['Dicen que el sistema se está desestabilizando.', 'Yo solo ejecuto mi rutina.', '¿Viste las carreras de anoche?', 'Cuidado con los guardias.', 'Un programa debe saber cuándo no preguntar.', 'Por aquí, todo fluye… casi siempre.'],
        rw: ['Qué ruido hacen esas motos…', 'Nunca había visto algo así en la ciudad.', 'Perdona, ando con prisa.', '¿Tú también viste esa luz?', 'Dicen que en el arcade pasan cosas raras.']
    };

    // ------------------------------------------------------------------ avisos en pantalla
    const Alerts = {
        el: null, list: [],
        init() { if (this.el) return; const d = document.createElement('div'); d.id = 'alerts'; document.getElementById('hud').appendChild(d); this.el = d; },
        push(a) { this.init(); a.t = 0; this.list.push(a); TG.sound.eventAlert(); TG.haptic && TG.haptic(40); this.render(); },
        remove(id) { this.list = this.list.filter(a => a.id !== id); this.render(); },
        render() {
            this.init(); this.el.innerHTML = '';
            for (const a of this.list) { const c = document.createElement('div'); c.className = 'al ' + (a.kind || ''); c.dataset.id = a.id; c.innerHTML = `<i>${a.icon}</i><b>${U.esc(a.text)}</b><span class="al-d"></span><em class="al-t"></em>`; this.el.appendChild(c); }
        },
        update(g) {
            if (!this.el) return; const p = g.player;
            for (const a of this.list) {
                const c = this.el.querySelector(`[data-id="${a.id}"]`); if (!c) continue;
                if (a.x != null && a.era === g.era) { const d = Math.hypot(a.x - p.x, a.y - p.y), ang = Math.atan2(a.y - p.y, a.x - p.x), arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗']; c.querySelector('.al-d').textContent = arrows[Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8] + ' ' + Math.round(d / 10) * 10 + ' m'; } else c.querySelector('.al-d').textContent = a.era && a.era !== g.era ? '(otro mapa)' : '';
                c.querySelector('.al-t').textContent = a.timer != null ? Math.max(0, Math.ceil(a.timer)) + ' s' : '';
            }
        }
    };
    TG.Alerts = Alerts;

    // ------------------------------------------------------------------ ciudadanos y vehículos
    class Crowd {
        constructor(g) { this.g = g; this.list = []; this.cars = []; this.talk = null; }
        ok() { const g = this.g; return g.state === 'play' && !g.player.interior && !g.tutorial.active && !g.battle.active && !g.race.active && !g.tank.active && !g.transition && !g.raise; }
        mk(x, y, o = {}) {
            const rw = !!(TG.GRIDS[this.g.era] && TG.GRIDS[this.g.era].rw), th = G.THEME[this.g.era];
            const cols = rw ? ['#cfd8e3', '#e0c7a6', '#a9c4d8', '#d9a7a7', '#b8d9b0'] : [th.glow, th.accent, '#5CC8FF', '#B58CFF', '#7DFF9B', '#FFB347'];
            return Object.assign({ x, y, tx: x, ty: y, c: U.pick(cols), look: rw ? 'human' : U.pick(['visor', 'plain', 'helmet', 'long']), sp: 45 + Math.random() * 40, ph: Math.random() * 9, f: 1, moving: false, wait: Math.random() * 3, seed: Math.random() * 9, flee: 0 }, o);
        }
        spawnAt(x, y, r, n, tag) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = 30 + Math.random() * r; this.list.push(this.mk(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, { anchor: { x, y, r }, tag })); } }
        clearTag(tag) { this.list = this.list.filter(c => c.tag !== tag); }
        flee(tag, from) { for (const c of this.list) if (c.tag === tag) { c.flee = 8; const a = Math.atan2(c.y - from.y, c.x - from.x); c.tx = c.x + Math.cos(a) * 1400; c.ty = c.y + Math.sin(a) * 1400; c.sp = 170; } }
        update(dt) {
            const g = this.g, p = g.player;
            if (!this.ok()) { if (!g.state || g.player.interior) { this.list = this.list.filter(c => c.tag); this.cars = []; } return; }
            const b = g.currentBounds(), N = 11, NC = TG.GRIDS[g.era] && TG.GRIDS[g.era].rw ? 4 : 5;
            // ciudadanos
            if (this.list.filter(c => !c.tag).length < N && Math.random() < dt * 5) { const a = Math.random() * 6.28, d = 420 + Math.random() * 760, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; if (x > 80 && y > 80 && x < b.w - 80 && y < b.h - 80) this.list.push(this.mk(x, y)); }
            for (const c of this.list) {
                c.wait -= dt;
                if (c.flee > 0) c.flee -= dt;
                if (Math.hypot(c.tx - c.x, c.ty - c.y) < 8 && c.flee <= 0) { if (c.wait <= 0) { c.wait = 1 + Math.random() * 4; const R = c.anchor ? c.anchor.r : 260, bx = c.anchor ? c.anchor.x : c.x, by = c.anchor ? c.anchor.y : c.y, a = Math.random() * 6.28; c.tx = bx + Math.cos(a) * Math.random() * R; c.ty = by + Math.sin(a) * Math.random() * R * 0.8; c.sp = 45 + Math.random() * 40; } c.moving = false; }
                else if (c.wait <= 0 || c.flee > 0) { const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy) || 1; c.x += dx / d * c.sp * dt; c.y += dy / d * c.sp * dt; c.moving = true; c.ph += dt * 9; if (Math.abs(dx) > 2) c.f = dx > 0 ? 1 : -1; }
            }
            this.list = this.list.filter(c => c.tag || Math.hypot(c.x - p.x, c.y - p.y) < 1900 && c.x > 0 && c.y > 0 && c.x < b.w && c.y < b.h);
            // vehículos ambientales
            if (this.cars.length < NC && Math.random() < dt * 1.2) { const horiz = Math.random() < 0.5, s = Math.random() < 0.5 ? 1 : -1, a = Math.random() * 6.28, d = 800 + Math.random() * 500; this.cars.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, vx: horiz ? s : 0, vy: horiz ? 0 : s, sp: 300 + Math.random() * 160, c: U.pick(['#FF8A1F', '#5CC8FF', '#FFD040', '#FF5AF0', '#7DFF9B']), trail: [] }); }
            for (const v of this.cars) { v.x += v.vx * v.sp * dt; v.y += v.vy * v.sp * dt; v.trail.push({ x: v.x, y: v.y }); if (v.trail.length > 26) v.trail.shift(); }
            this.cars = this.cars.filter(v => Math.hypot(v.x - p.x, v.y - p.y) < 1900 && v.x > 0 && v.y > 0 && v.x < b.w && v.y < b.h);
        }
        renderGround(ctx, cam, t) {
            if (!this.ok() && !this.g.player.interior) return; const rw = TG.GRIDS[this.g.era] && TG.GRIDS[this.g.era].rw;
            for (const v of this.cars) {
                if (!cam.onScreen(v.x, v.y, 200)) continue; ctx.save(); if (v.trail.length > 1) { ctx.beginPath(); v.trail.forEach((q, i) => { const x = q.x - cam.ox, y = q.y - cam.oy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = U.rgba(v.c, rw ? 0.25 : 0.55); ctx.stroke(); }
                G.cycle(ctx, v.x - cam.ox, v.y - cam.oy + 4, Math.atan2(v.vy, v.vx), v.c, { t }); ctx.restore();
            }
        }
        drawables(cam, t) {
            const out = []; if (!this.ok()) return out;
            for (const c of this.list) { if (!cam.onScreen(c.x, c.y, 100)) continue; out.push({ y: c.y, c, draw: (ctx) => { const x = c.x - cam.ox, y = c.y - cam.oy; G.humanoid(ctx, x, y + 14, { c: c.c, a: '#fff', f: c.f, ph: c.ph, moving: c.moving, look: c.look, t, seed: c.seed, alpha: 0.92 }); } }); }
            return out;
        }
        nearTalk() { const p = this.g.player; if (!this.ok()) return null; let best = null, bd = 90; for (const c of this.list) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = c; } } return best ? { d: bd + 14, text: '[E] Hablar con ' + (TG.GRIDS[this.g.era].rw ? 'un peatón' : 'un programa'), run: () => { const L = LINES[TG.GRIDS[this.g.era].rw ? 'rw' : 'grid']; this.g.combat.floater(best.x, best.y - 90, U.pick(L), best.c); TG.sound.ui(); } } : null; }
    }
    TG.Crowd = Crowd;

    // ------------------------------------------------------------------ eventos aleatorios
    class GridEvents {
        constructor(g) {
            this.g = g; this.cur = null; this.timer = 110; this.noIllegal = 0; this.arrestOpen = false; this.hold = 0;
            const q = (id) => document.getElementById(id); if (!q('arrest-pay')) return;
            q('arrest-pay').addEventListener('click', () => this.resolveArrest(true)); q('arrest-annul').addEventListener('click', () => this.resolveArrest(false));
        }
        ok() { const g = this.g; return g.state === 'play' && !g.player.interior && !g.tutorial.active && !g.battle.active && !g.race.active && !g.tank.active && !g.transition && !g.raise && !g.paused && !g.player.dead && !(g.special && g.special.mg && g.special.mg.active); }
        isRw() { return !!(TG.GRIDS[this.g.era] && TG.GRIDS[this.g.era].rw); }
        // ---- planificador
        update(dt) {
            const g = this.g; Alerts.update(g); this.noIllegal = Math.max(0, this.noIllegal - dt);
            if (this.cur) { const e = this.cur; if (e.era !== g.era && e.kind !== 'raidonly') { this.end(); return; } if (this.ok()) e.update(dt); if (e.done) this.end(); return; }
            if (!this.ok()) return; this.timer -= dt; if (this.timer > 0) return;
            this.timer = (55 + Math.random() * 55) / Math.min(1.5, g.difficulty.threat);
            const pool = []; const rw = this.isRw();
            if (!rw) { pool.push('glitch', 'glitch', 'blackout'); }
            if (this.noIllegal <= 0) pool.push('street_race', 'tournament', 'tournament');
            this.start(U.pick(pool));
        }
        start(kind) {
            const g = this.g, p = g.player, b = g.currentBounds(), a = Math.random() * 6.28, d = 650 + Math.random() * 500; if (this.cur) this.end();
            let x = U.clamp(p.x + Math.cos(a) * d, 500, b.w - 500), y = U.clamp(p.y + Math.sin(a) * d, 500, b.h - 500);
            const locs = TG.LOCATIONS[g.era] || []; for (let k = 0; k < 6 && locs.some(l => Math.hypot(l.x - x, l.y - y) < l.r + 330); k++) { x = U.clamp(p.x + Math.cos(a + k) * (d + 120), 500, b.w - 500); y = U.clamp(p.y + Math.sin(a + k) * (d + 120), 500, b.h - 500); }
            const E = { glitch: Glitch, blackout: Blackout, street_race: StreetRace, tournament: Tournament }[kind]; this.cur = new E(this, x, y); this.cur.era = g.era; this.cur.kind = kind; this.cur.begin();
        }
        end() { if (this.cur) { this.cur.cleanup && this.cur.cleanup(); Alerts.remove(this.cur.alertId); this.cur = null; } }
        // ---- interacción (E)
        interact(cands) { const e = this.cur; if (e && e.interact && this.ok()) { const c = e.interact(); if (c) cands.push(c); } }
        renderGround(ctx, cam, t) { if (this.cur && this.cur.era === this.g.era && this.cur.renderGround) this.cur.renderGround(ctx, cam, t); }
        renderOver(ctx, cm, cam, t) { if (this.cur && this.cur.era === this.g.era && this.cur.renderOver) this.cur.renderOver(ctx, cm, cam, t); }
        drawables(cam, t) { return this.cur && this.cur.era === this.g.era && this.cur.drawables ? this.cur.drawables(cam, t) : []; }
        // ---- redada y arresto
        raid(spot, radius) {
            const g = this.g, E = this.cur; if (!E) return; E.raidT = 15; E.raidSpot = spot; E.raidR = radius;
            Alerts.push({ id: 'raid', icon: '🚨', text: '¡REDADA! Huye de la zona', kind: 'danger', x: spot.x, y: spot.y, era: g.era, timer: 15 }); g.camera.shake(8);
            const n = 4 + g.difficulty.extra(); for (let i = 0; i < n; i++) { const a = (i / n) * 6.28 + Math.random(), r = radius + 650; g.combat.spawn(TG.makeEnemy(i % 3 === 2 ? 'ranged' : 'guard', g.era, spot.x + Math.cos(a) * r, spot.y + Math.sin(a) * r * 0.8, { tag: 'raid', noDespawn: true, aggro: 2000, reward: 0 })); }
            g.crowd.flee('event', spot); TG.Toast.show('🚨 ¡La Guardia irrumpe! Sal de la zona o te arrestarán.', 'warn', 5000);
        }
        arrest(why) {
            if (this.arrestOpen) return; const g = this.g, p = g.player; this.arrestOpen = true; g.duel.cancel(); g.race.cancel(); g.paused = true;
            this.fine = Math.min(400, 120 + Math.round(p.bits * 0.08)); document.getElementById('arrest-why').textContent = why; document.getElementById('arrest-fine').textContent = this.fine + ' ◈';
            document.getElementById('arrest-pay').disabled = p.bits < this.fine; TG.sound.damage(); TG.Modals.open('arrest-modal');
        }
        resolveArrest(pay) {
            const g = this.g, p = g.player, E = this.cur; TG.Modals.close('arrest-modal'); this.arrestOpen = false; g.paused = false; const sp = E && E.raidSpot ? E.raidSpot : { x: p.x, y: p.y };
            g.combat.enemies = g.combat.enemies.filter(e => e.tag !== 'raid'); this.noIllegal = 200;
            if (pay && g.economy.spend(this.fine)) { const a = Math.random() * 6.28; p.x = U.clamp(sp.x + Math.cos(a) * 1100, 200, g.currentBounds().w - 200); p.y = U.clamp(sp.y + Math.sin(a) * 1100, 200, g.currentBounds().h - 200); TG.Toast.show(`Pagaste la multa de ${this.fine} ◈ y te liberaron.`, 'info', 4200); }
            else { const lost = Math.round(p.bits * 0.2); p.bits -= lost; g.economy.updateHUD(); p.x = g.grid.spawn.x; p.y = g.grid.spawn.y; TG.Toast.show(`Anulación: perdiste ${lost} ◈ y apareces en el punto de inicio.`, 'warn', 5000); }
            p.invuln = 3; g.camera.snap(g.currentBounds().w, g.currentBounds().h); this.end();
        }
        reset() { this.end(); Alerts.list = []; Alerts.render(); this.timer = 90; }
    }
    TG.GridEvents = GridEvents;

    // ============================== FALLA DE LA GRID
    class Glitch {
        constructor(M, x, y) { this.M = M; this.x = x; this.y = y; this.r = 300; this.phase = 'warn'; this.t = 0; this.alertId = 'glitch'; this.done = false; this.inT = 0; this.hold = 0; }
        begin() { const g = this.M.g; Alerts.push({ id: 'glitch', icon: '⚠', text: 'Inestabilidad de la Grid: parte del suelo va a caer', kind: 'warn', x: this.x, y: this.y, era: g.era, timer: 9 }); TG.Toast.show('⚠ Falla de la Grid: repara el nodo central (mantén E) o aléjate.', 'warn', 4800); }
        update(dt) {
            const g = this.M.g, p = g.player; this.t += dt; const inside = Math.hypot(p.x - this.x, p.y - this.y) < this.r;
            if (this.phase === 'warn') {
                const al = Alerts.list.find(a => a.id === 'glitch'); if (al) al.timer = Math.max(0, 9 - this.t);
                if (Math.random() < dt * 2.5) g.camera.shake(1.6);
                if (Math.hypot(p.x - this.x, p.y - this.y) < 100 && g.input.down('KeyE')) { this.hold += dt; if (this.hold >= 3) { g.economy.add(90); TG.sound.reward(); g.particles.ring(this.x, this.y, '#7DFF9B', 260); TG.Toast.show('✔ Nodo reparado: la Grid se estabiliza. +90 Bits', 'good', 3800); this.done = true; return; } } else this.hold = Math.max(0, this.hold - dt * 2);
                if (this.t >= 9) { this.phase = 'collapse'; this.t = 0; g.camera.shake(14); TG.sound.damage(); const al2 = Alerts.list.find(a => a.id === 'glitch'); if (al2) { al2.text = '¡El suelo se ha caído! No entres a la zona'; al2.timer = 14; } }
            } else if (this.phase === 'collapse') {
                const al = Alerts.list.find(a => a.id === 'glitch'); if (al) al.timer = Math.max(0, 14 - this.t);
                if (Math.random() < dt * 4) g.particles.emit(this.x + (Math.random() - 0.5) * this.r * 2, this.y + (Math.random() - 0.5) * this.r * 1.6, '#ff5a5a', 2, 3, { vy: 2 });
                if (inside && !p.dead && p.invuln < 1.5) {   // el suelo caído hace daño continuo (se aplica directo: ignora los instantes de invulnerabilidad)
                    this.inT += dt; p.health -= 7 * dt / (p.resistanceMultiplier || 1); if (p.health <= 0) { p.health = 1; p.takeDamage(9999, g); return; }
                    if (this.inT > 3) { this.inT = 0; const a = Math.atan2(p.y - this.y, p.x - this.x); p.x = this.x + Math.cos(a) * (this.r + 90); p.y = this.y + Math.sin(a) * (this.r + 90); p.health = Math.max(1, p.health - 18); g.camera.shake(10); TG.haptic && TG.haptic(60); TG.Toast.show('¡Caíste por una grieta de la Grid!', 'warn', 2400); TG.sound.damage(); }
                } else this.inT = 0;
                for (const e of g.combat.enemies) if (e.isAlive && Math.hypot(e.x - this.x, e.y - this.y) < this.r - 20) { e.hit(60 * dt, g, {}); }
                if (this.t >= 14) { this.phase = 'restore'; this.t = 0; }
            } else if (this.t >= 3) this.done = true;
        }
        interact() { if (this.phase !== 'warn') return null; const p = this.M.g.player, d = Math.hypot(p.x - this.x, p.y - this.y); return d < 110 ? { d: d - 40, text: '[Mantén E] Reparar el nodo de la Grid (' + Math.round(this.hold / 3 * 100) + '%)', run: () => {} } : null; }
        renderGround(ctx, cam, t) {
            const x = this.x - cam.ox, y = this.y - cam.oy, R = this.r, fl = 0.5 + 0.5 * Math.sin(t * 22); ctx.save();
            if (this.phase === 'warn') {
                ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.8, 0, 0, Math.PI * 2); ctx.setLineDash([16, 10]); ctx.lineDashOffset = -t * 40; ctx.strokeStyle = `rgba(255,${80 + fl * 120 | 0},80,${0.55 + fl * 0.35})`; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = `rgba(255,70,70,${0.05 + fl * 0.06})`; ctx.fill(); G.glow(ctx, x, y, 80, '#FF5A5A', 0.45); ctx.beginPath(); ctx.arc(x, y - 10, 26 + 4 * fl, 0, Math.PI * 2); G.stroke(ctx, '#fff', 2, 0.9); ctx.beginPath(); ctx.arc(x, y - 10, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.hold / 3)); G.stroke(ctx, '#7DFF9B', 4, 1);
                ctx.font = 'bold 11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('NODO · MANTÉN E', x, y + 34);
            } else {
                const k = this.phase === 'restore' ? 1 - this.t / 3 : 1; ctx.globalAlpha = k; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.8, 0, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); ctx.strokeStyle = '#ff3d3d'; ctx.lineWidth = 3; ctx.stroke();
                ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,60,60,.5)'; ctx.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const a = i * 0.9 + 0.3, r2 = R * (0.35 + (i % 4) * 0.18); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 16); ctx.lineTo(x + Math.cos(a + 0.3) * r2, y + Math.sin(a + 0.3) * r2 * 0.8); ctx.lineTo(x + Math.cos(a - 0.2) * r2 * 1.3, y + Math.sin(a - 0.2) * r2); ctx.stroke(); }
                for (let i = 0; i < 18; i++) { const bx = x + (U.hash2(i, 3) - 0.5) * R * 1.6, by = y + ((U.hash2(i, 9) + t * 0.15 * (1 + (i % 3))) % 1 - 0.5) * R * 1.4; ctx.fillStyle = `rgba(255,${60 + (i * 20) % 120},60,.5)`; ctx.fillRect(bx, by, 10 + (i % 4) * 5, 10 + (i % 3) * 5); } ctx.restore();
            }
            ctx.restore();
        }
        renderOver(ctx, cm, cam, t) { const p = this.M.g.player, d = Math.hypot(p.x - this.x, p.y - this.y); if (d > this.r + 900) return; const k = (this.phase === 'collapse' ? 0.16 : 0.07) * U.clamp(1 - d / (this.r + 900), 0, 1) * 3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { ctx.fillStyle = `rgba(${i % 2 ? '255,60,90' : '60,220,255'},${k})`; ctx.fillRect(Math.random() < 0.3 ? 0 : (Math.random() - 0.5) * 40, Math.random() * cm.h, cm.w, 2 + Math.random() * 8); } ctx.restore(); }
        cleanup() { }
    }

    // ============================== APAGÓN
    class Blackout {
        constructor(M, x, y) { this.M = M; this.t = 0; this.dur = 28; this.alertId = 'blackout'; this.done = false; this.sp = 3; }
        begin() { Alerts.push({ id: 'blackout', icon: '🌑', text: 'Apagón en la Grid: a oscuras', kind: 'warn', era: this.M.g.era, timer: this.dur }); TG.Toast.show('🌑 Apagón: se oyen pasos en la oscuridad…', 'warn', 3800); TG.sound.charge(); }
        update(dt) { const g = this.M.g; this.t += dt; this.sp -= dt; const al = Alerts.list.find(a => a.id === 'blackout'); if (al) al.timer = this.dur - this.t; if (this.sp <= 0 && g.combat.enemies.length < 6) { this.sp = 6; const a = Math.random() * 6.28; g.combat.spawn(TG.makeEnemy(Math.random() < 0.3 ? 'ranged' : 'guard', g.era, g.player.x + Math.cos(a) * 520, g.player.y + Math.sin(a) * 420, { noDespawn: false, aggro: 1400, reward: 14 })); } if (this.t >= this.dur) { g.economy.add(70); TG.Toast.show('💡 La energía vuelve. +70 Bits por sobrevivir', 'good', 3600); TG.sound.reward(); this.done = true; } }
        renderOver(ctx, cm, cam, t) { const g = this.M.g, p = g.player, k = U.clamp(Math.min(this.t / 2, (this.dur - this.t) / 2), 0, 1), x = p.x - cam.ox, y = p.y - cam.oy - 20, r = 230 + 20 * Math.sin(t * 3); const gr = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 1.6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(0,0,0,${0.55 * k})`); gr.addColorStop(1, `rgba(0,2,6,${0.93 * k})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, cm.w, cm.h); }
    }

    // ============================== CARRERA ILEGAL
    class StreetRace {
        constructor(M, x, y) { this.M = M; this.x = x; this.y = y; this.t = 0; this.alertId = 'sr'; this.done = false; this.racers = []; this.raided = false; this.raidAt = Math.random() < 0.4 ? 14 + Math.random() * 14 : 1e9; this.raidT = 0; this.dur = 70; this.joinable = true; this.pts = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; this.pts.push({ x: x - 520 + 520 * Math.cos(a), y: y + 340 * Math.sin(a) }); } this.pts.forEach(q => { q.x += 520; }); }
        begin() {
            const g = this.M.g; Alerts.push({ id: 'sr', icon: '🏁', text: 'Carrera ilegal en marcha: únete (E) o mira', kind: 'info', x: this.x, y: this.y, era: g.era, timer: this.dur });
            for (let i = 0; i < 5; i++) { const a = -0.3 - i * 0.12; this.racers.push({ x: this.x + 420 * Math.cos(a) , y: this.y + 300 * Math.sin(a) - i * 14, a: Math.PI / 2, idx: i % 8, sp: 330 + Math.random() * 90, c: ['#FF8A1F', '#FFD040', '#FF3A6A', '#B58CFF', '#7DFF9B'][i], trail: [] }); }
            g.crowd.spawnAt(this.x, this.y, 460, 8, 'event'); TG.Toast.show('🏁 Se oyen motores: hay una carrera ilegal cerca.', 'info', 4200);
        }
        update(dt) {
            const g = this.M.g, p = g.player; this.t += dt; const al = Alerts.list.find(a => a.id === 'sr'); if (al && !this.raided) al.timer = Math.max(0, this.dur - this.t);
            for (const r of this.racers) { const goal = this.pts[(r.idx + 1) % 8], want = Math.atan2(goal.y - r.y, goal.x - r.x); let d = want - r.a; while (d > Math.PI) d -= 6.28; while (d < -Math.PI) d += 6.28; r.a += U.clamp(d, -3 * dt, 3 * dt); const f = this.raided ? 0 : 1; r.x += Math.cos(r.a) * r.sp * dt * f; r.y += Math.sin(r.a) * r.sp * dt * f; if (Math.hypot(r.x - goal.x, r.y - goal.y) < 160) r.idx = (r.idx + 1) % 8; r.trail.push({ x: r.x, y: r.y }); if (r.trail.length > 30) r.trail.shift(); if (this.raided) r.trail.shift(); }
            if (!this.raided && this.t >= this.raidAt && !g.race.active) { this.raided = true; this.joinable = false; this.M.raid({ x: this.x, y: this.y }, 560); g.crowd.flee('event', { x: this.x, y: this.y }); }
            if (this.raided) { this.raidT -= dt; if (this.raidT > -1 && Math.hypot(p.x - this.x, p.y - this.y) < 620 && this.raidT <= 11 && !this.M.arrestOpen) { const near = g.combat.enemies.some(e => e.tag === 'raid' && e.isAlive && Math.hypot(e.x - p.x, e.y - p.y) < 230); if (near || this.raidT <= 0) { this.M.arrest('Te sorprendieron en una carrera ilegal.'); return; } } if (this.raidT <= -1 || (this.raidT <= 0 && Math.hypot(p.x - this.x, p.y - this.y) > 700)) { if (Math.hypot(p.x - this.x, p.y - this.y) > 700) TG.Toast.show('Escapaste de la redada.', 'good', 3000); this.done = true; } }
            else if (this.t >= this.dur) { this.done = true; }
        }
        interact() { if (!this.joinable || this.raided) return null; const p = this.M.g.player, d = Math.hypot(p.x - this.x, p.y - this.y); return d < 170 ? { d: d - 40, text: '[E] Unirte a la carrera ilegal (30 ◈)', run: () => this.join() } : null; }
        join() { const g = this.M.g; TG.TRACKS.illegal = { loc: null, rx: 520, ry: 340, n: 8, laps: 1, name: 'Carrera Ilegal', fee: 30 }; const loc = { id: 'illegal', name: 'Carrera ilegal', x: this.x, y: this.y, r: 60, act: { track: 'illegal' } }; this.joinable = false; this.racers = []; g.race.start(loc, 0); if (!g.race.active) { this.joinable = true; return; } this.done = false; this.t = Math.min(this.t, this.raidAt - 40); this.raidAt = 1e9; this.finishWatch = true; }
        renderGround(ctx, cam, t) {
            const x = this.x - cam.ox, y = this.y - cam.oy; ctx.save(); ctx.beginPath(); this.pts.forEach((q, i) => { const px = q.x - cam.ox, py = q.y - cam.oy; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 40; ctx.strokeStyle = 'rgba(255,170,60,.35)'; ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([]);
            G.glow(ctx, x, y, 70, '#FFAA3C', 0.28); ctx.font = 'bold 11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFD84A'; ctx.fillText('CARRERA ILEGAL', x, y - 22);
            for (const r of this.racers) { const rx = r.x - cam.ox, ry = r.y - cam.oy; if (r.trail.length > 1) { ctx.beginPath(); r.trail.forEach((q, i) => { const px = q.x - cam.ox, py = q.y - cam.oy; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = U.rgba(r.c, 0.55); ctx.stroke(); } G.cycle(ctx, rx, ry + 4, r.a, r.c, { t }); }
            ctx.restore();
        }
        cleanup() { const g = this.M.g; g.crowd.clearTag('event'); g.combat.enemies.forEach(e => { if (e.tag === 'raid') e.isAlive = false; }); }
    }

    // ============================== TORNEO ILEGAL DE DISCOS
    class Tournament {
        constructor(M, x, y) { this.M = M; this.x = x; this.y = y; this.t = 0; this.alertId = 'tn'; this.done = false; this.raided = false; this.raidAt = 18 + Math.random() * 16; this.raidT = 0; this.dur = 80; this.fighters = [{ ph: 0 }, { ph: 2 }]; }
        begin() { const g = this.M.g; Alerts.push({ id: 'tn', icon: '🥋', text: 'Torneo ilegal de discos: participa (E) o mira', kind: 'info', x: this.x, y: this.y, era: g.era, timer: this.dur }); g.crowd.spawnAt(this.x, this.y, 300, 10, 'event'); TG.Toast.show('🥋 Hay un torneo ilegal de discos cerca. Puedes mirar… o competir.', 'info', 4800); }
        update(dt) {
            const g = this.M.g, p = g.player; this.t += dt; const al = Alerts.list.find(a => a.id === 'tn'); if (al && !this.raided) al.timer = Math.max(0, this.dur - this.t);
            if (!this.raided && this.t >= this.raidAt) { this.raided = true; this.M.raid({ x: this.x, y: this.y }, 420); if (g.duel.active) { this.M.arrest('Te atraparon peleando en un torneo ilegal.'); return; } }
            if (this.raided) { this.raidT -= dt; const d = Math.hypot(p.x - this.x, p.y - this.y); if (d < 470 && !this.M.arrestOpen) { const near = g.combat.enemies.some(e => e.tag === 'raid' && e.isAlive && Math.hypot(e.x - p.x, e.y - p.y) < 240); if (near || this.raidT <= 0) { this.M.arrest('Te sorprendieron en un torneo ilegal.'); return; } } if (this.raidT <= -1 || (this.raidT <= 0 && d > 600)) { if (d > 600) TG.Toast.show('Escapaste de la redada.', 'good', 3000); this.done = true; } }
            else if (this.t >= this.dur) this.done = true;
        }
        interact() { if (this.raided) return null; const p = this.M.g.player, d = Math.hypot(p.x - this.x, p.y - this.y); return d < 160 ? { d: d - 30, text: '[E] Competir en el torneo ilegal (50 ◈)', run: () => this.join() } : null; }
        join() { const g = this.M.g; if (!g.economy.spend(50)) { TG.Toast.show('La inscripción cuesta 50 ◈.', 'warn'); return; } const loc = { id: 'illegal_ring', name: 'Torneo ilegal', x: this.x, y: this.y, r: 60, arena: 'disc' }; g.duel.start(loc, 0); this.won = false; this.watch = true; this.raidAt = Math.min(this.raidAt, this.t + 12 + Math.random() * 10); }
        renderGround(ctx, cam, t) { const x = this.x - cam.ox, y = this.y - cam.oy, th = G.THEME[this.M.g.era]; ctx.save(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y, 130 - i * 26, (130 - i * 26) * 0.6, 0, 0, Math.PI * 2); G.stroke(ctx, i === 1 ? '#FFD84A' : '#FF5A3A', 2.4 - i * 0.4, 0.8); } G.glow(ctx, x, y, 150, '#FF5A3A', 0.18); ctx.font = 'bold 11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFD84A'; ctx.fillText('TORNEO ILEGAL', x, y - 92); ctx.restore(); }
        drawables(cam, t) { const out = [], ring = this; if (this.raided) return out; [[-48, 0, '#FF5A3A', 1], [48, 0, '#5CC8FF', -1]].forEach(([dx, dy, c, f], i) => { const x = this.x + dx, y = this.y + dy; if (!cam.onScreen(x, y, 80)) return; out.push({ y, draw: (ctx) => { G.humanoid(ctx, x - cam.ox, y - cam.oy + 14, { c, a: '#fff', f, ph: t * 7 + i * 3, moving: Math.sin(t * 2 + i) > 0.2, look: 'helmet', t }); if (Math.sin(t * 3 + i * 2) > 0.8) { ctx.beginPath(); ctx.arc(x - cam.ox + f * 24, y - cam.oy - 24, 9, 0, 6.28); G.stroke(ctx, c, 2, 0.9); } } }); }); return out; }
        cleanup() { const g = this.M.g; g.crowd.clearTag('event'); g.combat.enemies.forEach(e => { if (e.tag === 'raid') e.isAlive = false; }); }
    }
})(window.TG = window.TG || {});
