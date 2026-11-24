/* ==========================================================================
   TRON — activities.js
   · CARRERAS de ciclos de luz (checkpoints, rivales con IA, vueltas, premios por puesto, apuestas). 7 circuitos (TG.TRACKS).
   · BATALLA DE TANQUES (oleadas, muros, tanques ligeros y pesados) inspirada en Tron: Evolution / Battle Grids.
   Ambas usan zoom de cámara para que el espacio sea jugable (en táctil: apuntado automático).
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;
    const NAMES = ['Vector', 'Pixel', 'Nova', 'Cipher', 'Rogue', 'Axion', 'Quark', 'Helix', 'Vortex', 'Zeta'];
    const COLS = ['#FF8A1F', '#FFD040', '#FF3A6A', '#B58CFF', '#7DFF9B', '#FF5AF0', '#5CC8FF', '#FFFFFF'];
    const PRIZE = [320, 200, 120, 60, 40, 40, 40];
    const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

    // ------------------------------------------------------------------ HUD común de actividades
    const ActHud = {
        el: null,
        init() {
            if (this.el) return; const d = document.createElement('div'); d.id = 'act-hud'; d.className = 'hidden';
            d.innerHTML = '<div class="ah-top"><b id="ah-a"></b><span id="ah-b"></span><span id="ah-c"></span></div><div id="ah-msg"></div><button id="ah-quit" class="tron-button small ghost">ABANDONAR</button>';
            document.getElementById('hud').appendChild(d); this.el = d;
        },
        show(onQuit) { this.init(); this.el.classList.remove('hidden'); const q = this.el.querySelector('#ah-quit'); q.onclick = onQuit; },
        hide() { if (this.el) this.el.classList.add('hidden'); },
        set(a, b, c) { this.init(); this.el.querySelector('#ah-a').textContent = a || ''; this.el.querySelector('#ah-b').textContent = b || ''; this.el.querySelector('#ah-c').textContent = c || ''; },
        msg(t, big) { this.init(); const m = this.el.querySelector('#ah-msg'); m.textContent = t || ''; m.classList.toggle('big', !!big); }
    };
    TG.ActHud = ActHud;

    // ================================================================== CARRERAS
    class Race {
        constructor(g) { this.g = g; this.active = false; this.rivals = []; this.pts = []; }
        track(loc) { return Object.assign({ id: loc.act.track }, TG.TRACKS[loc.act.track]); }
        info(loc) { const T = this.track(loc); return `${T.laps} vuelta${T.laps > 1 ? 's' : ''} · ${5 + (this.g.difficulty.extra() > 1 ? 1 : 0)} rivales · inscripción ${T.fee} ◈ · premios: 1.º ${PRIZE[0]} ◈, 2.º ${PRIZE[1]} ◈, 3.º ${PRIZE[2]} ◈. Cruza todos los checkpoints en orden; las apuestas se duplican solo si ganas.`; }
        start(loc, bet) {
            const g = this.g, p = g.player, T = this.track(loc);
            if (this.active || g.battle.active || g.tank.active) return;
            if (!g.economy.spend(T.fee)) { TG.Toast.show(`Inscripción: ${T.fee} ◈ (no tienes suficientes bits).`, 'warn'); if (bet) g.economy.add(bet); return; }
            this.T = T; this.loc = loc; this.bet = bet || 0; this.active = true; this.t = 0; this.state = 'count'; this.cd = 3.4; this.done = false; this.pidx = 0; this.fin = false;
            const b = g.currentBounds(), n = T.n; let cx = loc.x - T.rx, a0 = 0; if (cx - T.rx < 220) { cx = loc.x + T.rx; a0 = Math.PI; }
            cx = U.clamp(cx, T.rx + 220, b.w - T.rx - 220); const cy = U.clamp(loc.y, T.ry + 220, b.h - T.ry - 220);
            this.pts = Array.from({ length: n }, (_, k) => { const a = a0 + (k / n) * Math.PI * 2; return { x: cx + T.rx * Math.cos(a), y: cy + T.ry * Math.sin(a) }; });
            const P0 = this.pts[0], P1 = this.pts[1], head = Math.atan2(P1.y - P0.y, P1.x - P0.x), nx = -Math.sin(head), ny = Math.cos(head);
            g.combat.reset(); p.mode = 'cycle'; g.activeVehicle = new TG.LightCycle(p, p.skills.mrUBike); p.angle = head; g.activeVehicle.angle = head; g.activeVehicle.speed = 0;
            p.x = P0.x - Math.cos(head) * 100; p.y = P0.y - Math.sin(head) * 100; this.px0 = p.x; this.py0 = p.y; p.invuln = 3; g.camera.snap(b.w, b.h);
            const N = 5 + (g.difficulty.extra() > 1 ? 1 : 0); this.rivals = [];
            for (let i = 0; i < N; i++) { const lat = ((i % 3) - 1) * 78, back = 150 + Math.floor(i / 3) * 80 + (i % 3 === 1 ? 30 : 0); this.rivals.push({ x: P0.x - Math.cos(head) * back + nx * lat, y: P0.y - Math.sin(head) * back + ny * lat, a: head, sp: 0, idx: 0, color: COLS[i % COLS.length], name: NAMES[(i + Math.floor(Math.random() * 3)) % NAMES.length], trail: [], slow: 0, v: 0.93 + Math.random() * 0.1, fin: false, tt: 0 }); }
            g.zoomTarget = 0.7; ActHud.show(() => this.finish(false, true)); TG.sound.cycleStart(); TG.Toast.show('🏁 ' + T.name + ': ← → girar · ↑ acelerar. Cruza los checkpoints en orden.', 'info', 4200);
        }
        score(r) { const T = this.T, n = T.n, tg = this.pts[(r.idx + 1) % n], prev = this.pts[r.idx % n]; const seg = Math.max(1, Math.hypot(tg.x - prev.x, tg.y - prev.y)); return r.idx + 1 - U.clamp(Math.hypot(tg.x - r.x, tg.y - r.y) / seg, 0, 1); }
        rank() { const me = { idx: this.pidx, x: this.g.player.x, y: this.g.player.y }, ms = this.score(me); return 1 + this.rivals.filter(r => this.score(r) > ms).length; }
        update(dt) {
            if (!this.active) return; const g = this.g, p = g.player, T = this.T, n = T.n, total = n * T.laps; this.t += dt;
            if (p.dead) { this.finish(false, true); return; }
            if (this.state === 'count') {
                this.cd -= dt; p.x = this.px0; p.y = this.py0; if (g.activeVehicle) g.activeVehicle.speed = 0; p.invuln = 3;
                const k = Math.ceil(this.cd); ActHud.msg(this.cd > 0 ? String(k) : '¡YA!', true); ActHud.set('SALIDA', T.name, '');
                if (this.cd <= 0) { this.state = 'run'; this.t = 0; TG.sound.reward(); setTimeout(() => ActHud.msg(''), 700); } return;
            }
            // jugador: checkpoints en orden
            const tg = this.pts[(this.pidx + 1) % n];
            if (!this.fin && Math.hypot(p.x - tg.x, p.y - tg.y) < 210) {
                this.pidx++; TG.sound.pickup(); g.particles.ring(tg.x, tg.y, p.color, 130);
                if (this.pidx % n === 0 && this.pidx < total) TG.Toast.show(`Vuelta ${this.pidx / n + 1} de ${T.laps}`, 'good', 1800);
                if (this.pidx >= total) { this.fin = true; this.finish(true); return; }
            }
            // rivales
            for (const r of this.rivals) {
                if (r.fin) continue; const goal = this.pts[(r.idx + 1) % n], want = Math.atan2(goal.y - r.y, goal.x - r.x);
                r.a += U.clamp(angDiff(r.a, want), -3.1 * dt, 3.1 * dt); const base = 8.7 * 60 * g.difficulty.rival() * r.v * (r.slow > 0 ? 0.55 : 1); r.sp += (base - r.sp) * Math.min(1, dt * 1.6); r.slow = Math.max(0, r.slow - dt);
                r.x += Math.cos(r.a) * r.sp * dt; r.y += Math.sin(r.a) * r.sp * dt; r.tt += dt; if (r.tt > 0.035) { r.tt = 0; r.trail.push({ x: r.x, y: r.y }); if (r.trail.length > 38) r.trail.shift(); }
                if (Math.hypot(r.x - goal.x, r.y - goal.y) < 210) { r.idx++; if (r.idx >= total) { r.fin = true; r.place = 1 + this.rivals.filter(q => q.fin && q !== r).length; } }
                const d = Math.hypot(r.x - p.x, r.y - p.y); if (d < 40 && d > 0) { r.x += (r.x - p.x) / d * 6; r.y += (r.y - p.y) / d * 6; r.slow = 0.6; if (g.activeVehicle) g.activeVehicle.speed *= 0.985; if (Math.random() < 0.3) g.particles.emit(r.x, r.y - 10, '#fff', 2, 2); }
            }
            const rk = this.rank(); ActHud.set(`PUESTO ${rk}/${this.rivals.length + 1}`, `VUELTA ${Math.min(T.laps, Math.floor(this.pidx / n) + 1)}/${T.laps}`, `⏱ ${Math.floor(this.t / 60)}:${String(Math.floor(this.t % 60)).padStart(2, '0')}`);
            if (this.t > 260) { TG.Toast.show('Se acabó el tiempo de la carrera.', 'warn'); this.finish(false); }
        }
        finish(win, abandon) {
            if (!this.active) return; const g = this.g, p = g.player; this.active = false; ActHud.hide(); ActHud.msg('');
            const pos = win ? 1 + this.rivals.filter(r => r.fin).length : 99; const b = this.bet; this.bet = 0; g.economy.settleBet(b, win && pos === 1);
            if (win) {
                const prize = Math.round((PRIZE[Math.min(pos - 1, PRIZE.length - 1)]) * (0.9 + 0.1 * g.difficulty.threat)); g.economy.add(prize); TG.sound.reward(); g.particles.ring(p.x, p.y, p.color, 180);
                TG.Toast.show(`${pos === 1 ? '🏆 ¡GANASTE LA CARRERA!' : '🏁 Puesto ' + pos} +${prize} Bits`, pos <= 3 ? 'good' : 'info', 5200); g.quests.event('race', { track: this.T.id, pos });
            } else TG.Toast.show(abandon ? 'Abandonaste la carrera.' : 'Carrera perdida.', 'warn');
            p.mode = 'foot'; g.activeVehicle = null; g.zoomTarget = 1; p.invuln = 1; if (!p.dead) { p.x = this.loc.x; p.y = this.loc.y + this.loc.r + 80; g.camera.snap(g.currentBounds().w, g.currentBounds().h); }
            g.quests.refresh(); this.rivals = []; this.pts = [];
        }
        cancel() { if (this.active) { this.active = false; ActHud.hide(); this.rivals = []; this.g.zoomTarget = 1; const b = this.bet; this.bet = 0; this.g.economy.settleBet(b, false); } }
        render(ctx, cam, t) {
            if (!this.active) return; const g = this.g, n = this.T.n, th = G.THEME[g.era], col = th.glow;
            ctx.save();
            ctx.beginPath(); this.pts.forEach((q, i) => { const x = q.x - cam.ox, y = q.y - cam.oy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.setLineDash([22, 18]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = U.rgba(col, 0.28); ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]);
            const nextIdx = (this.pidx + 1) % n;
            for (let k = 0; k < n; k++) {
                const q = this.pts[k], pr = this.pts[(k - 1 + n) % n], nx = this.pts[(k + 1) % n], tx = nx.x - pr.x, ty = nx.y - pr.y, m = Math.hypot(tx, ty) || 1, ox = -ty / m * 105, oy = tx / m * 105, x = q.x - cam.ox, y = q.y - cam.oy;
                if (x < -300 || y < -300 || x > cam.w + 300 || y > cam.h + 300) continue;
                const isNext = k === nextIdx, c = k === 0 ? '#FFFFFF' : isNext ? '#FFD84A' : col;
                ctx.beginPath(); ctx.moveTo(x - ox, y - oy); ctx.lineTo(x + ox, y + oy); ctx.lineWidth = isNext ? 7 : 4; ctx.strokeStyle = U.rgba(c, isNext ? 0.95 : 0.55); ctx.stroke();
                for (const s of [-1, 1]) { G.glow(ctx, x + ox * s, y + oy * s, isNext ? 50 : 26, c, isNext ? 0.7 : 0.35); ctx.fillStyle = c; ctx.fillRect(x + ox * s - 5, y + oy * s - 5, 10, 10); }
                if (isNext) { G.glow(ctx, x, y, 90 + 14 * Math.sin(t * 6), '#FFD84A', 0.22); }
                if (k === 0) { for (let i = -6; i <= 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(x + ox * (i / 6) - 7, y + oy * (i / 6) - 7, 14, 14); } }
            }
            for (const r of this.rivals) {
                const x = r.x - cam.ox, y = r.y - cam.oy; if (r.trail.length > 1) { ctx.beginPath(); r.trail.forEach((q, i) => { const px = q.x - cam.ox, py = q.y - cam.oy; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = U.rgba(r.color, 0.6); ctx.stroke(); }
                G.cycle(ctx, x, y + 4, r.a, r.color, { t }); G.nameplate(ctx, x, y - 46, r.name, r.color);
            }
            ctx.restore();
        }
    }
    TG.Race = Race;

    // ================================================================== BATALLA DE TANQUES
    class TankBattle {
        constructor(g) { this.g = g; this.active = false; }
        start(loc, bet) {
            const g = this.g, p = g.player; if (this.active || g.battle.active || g.race.active) return;
            this.loc = loc; this.bet = bet || 0; this.active = true; this.over = false; this.wave = 0; this.t = 0; this.cd = 0; this.shots = []; this.foes = [];
            const Sx = 900, Sy = 640; this.R = { x0: loc.x - Sx, y0: loc.y - Sy, x1: loc.x + Sx, y1: loc.y + Sy };
            this.walls = []; for (let i = 0; i < 7; i++) { const w = 80 + Math.random() * 90, h = 60 + Math.random() * 70; this.walls.push({ x: this.R.x0 + 220 + Math.random() * (Sx * 2 - 440) - w / 2, y: this.R.y0 + 160 + Math.random() * (Sy * 2 - 320) - h / 2, w, h }); }
            this.walls = this.walls.filter(w => Math.hypot(w.x + w.w / 2 - loc.x, w.y + w.h / 2 - loc.y) > 200);
            this.me = { x: this.R.x0 + 160, y: loc.y, a: 0, ta: 0, hp: 150 + (p.upg ? (p.upg.vit || 0) * 12 : 0), max: 150 + (p.upg ? (p.upg.vit || 0) * 12 : 0), cd: 0, hit: 0 };
            g.combat.reset(); p.x = this.me.x; p.y = this.me.y; p.invuln = 9999; g.camera.snap(g.currentBounds().w, g.currentBounds().h); g.zoomTarget = 0.78;
            ActHud.show(() => this.finish(false, true)); this.nextWave(); TG.sound.cycleStart(); TG.Toast.show('🛡 BATALLA DE TANQUES: mueve con WASD / joystick · apunta con el ratón (o DISCO en táctil) y dispara', 'warn', 5200);
        }
        nextWave() {
            this.wave++; const g = this.g, n = 2 + this.wave + g.difficulty.extra(); this.wavePause = 0;
            for (let i = 0; i < n; i++) { const heavy = this.wave >= 2 && i % 3 === 2; this.foes.push({ x: this.R.x1 - 140 - Math.random() * 160, y: this.R.y0 + 120 + Math.random() * (this.R.y1 - this.R.y0 - 240), a: Math.PI, ta: Math.PI, hp: (heavy ? 95 : 44) * g.difficulty.enemy().hp, max: (heavy ? 95 : 44) * g.difficulty.enemy().hp, sp: (heavy ? 78 : 118) * g.difficulty.enemy().spd, dmg: (heavy ? 17 : 9) * g.difficulty.enemy().dmg, rate: heavy ? 2.1 : 1.6, cd: 1 + Math.random() * 1.5, heavy, hit: 0, strafe: Math.random() < 0.5 ? 1 : -1 }); }
            TG.Toast.show(`Oleada ${this.wave}/3: ${n} tanques`, 'warn', 2600);
        }
        wallHit(x, y, r) { for (const w of this.walls) if (x > w.x - r && x < w.x + w.w + r && y > w.y - r && y < w.y + w.h + r) return w; return null; }
        move(o, dx, dy, r) { const nx = o.x + dx, ny = o.y + dy; if (!this.wallHit(nx, o.y, r) && nx > this.R.x0 + r && nx < this.R.x1 - r) o.x = nx; if (!this.wallHit(o.x, ny, r) && ny > this.R.y0 + r && ny < this.R.y1 - r) o.y = ny; }
        aim() { const g = this.g, z = g.zoom || 1, cam = g.camera; if (TG.platform && TG.platform.touch) { let b = null, bd = 1e9; for (const f of this.foes) { const d = Math.hypot(f.x - this.me.x, f.y - this.me.y); if (d < bd) { bd = d; b = f; } } return b ? Math.atan2(b.y - this.me.y, b.x - this.me.x) : this.me.a; } return Math.atan2(g.input.mouse.y / z + cam.oy - this.me.y, g.input.mouse.x / z + cam.ox - this.me.x); }
        fire() { if (!this.active || this.over || this.me.cd > 0) return; const m = this.me; m.ta = this.aim(); m.cd = 0.42; this.shots.push({ x: m.x + Math.cos(m.ta) * 34, y: m.y + Math.sin(m.ta) * 34, vx: Math.cos(m.ta) * 720, vy: Math.sin(m.ta) * 720, mine: true, dmg: 26 * (this.g.player.damageMultiplier || 1), life: 1.4 }); TG.sound.throwDisc(); this.g.camera.shake(2); }
        update(dt) {
            if (!this.active) return; const g = this.g, p = g.player, m = this.me, inp = g.input; this.t += dt; p.invuln = 9999;
            if (!this.over) {
                const v = inp.moveVec, mag = Math.hypot(v.x, v.y); if (mag > 0.1) { const a = Math.atan2(v.y, v.x); m.a += U.clamp(angDiff(m.a, a), -5 * dt, 5 * dt); this.move(m, v.x / mag * 210 * dt, v.y / mag * 210 * dt, 26); if (Math.random() < 0.4) g.particles.emit(m.x - Math.cos(m.a) * 22, m.y - Math.sin(m.a) * 22, p.color, 1, 1.2); }
                m.ta = this.aim(); m.cd = Math.max(0, m.cd - dt); m.hit = Math.max(0, m.hit - dt); p.x = m.x; p.y = m.y;
                for (const f of this.foes) {
                    f.cd -= dt; f.hit = Math.max(0, f.hit - dt); const dx = m.x - f.x, dy = m.y - f.y, d = Math.hypot(dx, dy) || 1, want = Math.atan2(dy, dx); f.ta = want; f.a += U.clamp(angDiff(f.a, want), -2.2 * dt, 2.2 * dt);
                    const toward = d > 380 ? 1 : d < 240 ? -0.7 : 0; this.move(f, Math.cos(want) * f.sp * dt * toward + (-dy / d) * f.strafe * f.sp * 0.5 * dt, Math.sin(want) * f.sp * dt * toward + (dx / d) * f.strafe * f.sp * 0.5 * dt, 26);
                    if (Math.random() < 0.004) f.strafe *= -1;
                    if (f.cd <= 0 && d < 640) { f.cd = f.rate + Math.random() * 0.6; const err = (Math.random() - 0.5) * 0.18; this.shots.push({ x: f.x + Math.cos(want) * 34, y: f.y + Math.sin(want) * 34, vx: Math.cos(want + err) * 420, vy: Math.sin(want + err) * 420, mine: false, dmg: f.dmg, life: 1.9 }); }
                }
                for (const s of this.shots) {
                    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; if (this.wallHit(s.x, s.y, 3) || s.x < this.R.x0 || s.x > this.R.x1 || s.y < this.R.y0 || s.y > this.R.y1) { s.life = 0; g.particles.emit(s.x, s.y, '#fff', 4, 2); continue; }
                    if (s.mine) { for (const f of this.foes) if (Math.hypot(f.x - s.x, f.y - s.y) < 28) { f.hp -= s.dmg; f.hit = 0.15; s.life = 0; g.particles.voxels(s.x, s.y, '#FF8A1F', 6, 2); TG.sound.discHit(); break; } }
                    else if (Math.hypot(m.x - s.x, m.y - s.y) < 26) { m.hp -= s.dmg; m.hit = 0.2; s.life = 0; g.camera.shake(6); TG.sound.damage(); TG.haptic && TG.haptic(30); g.particles.voxels(s.x, s.y, p.color, 6, 2); }
                }
                this.shots = this.shots.filter(s => s.life > 0);
                for (const f of this.foes) if (f.hp <= 0) { g.particles.voxels(f.x, f.y - 10, '#FF8A1F', 28, 4); g.particles.ring(f.x, f.y, '#FF8A1F', 110); g.economy.add(20); g.camera.shake(8); TG.sound.discHit(); }
                this.foes = this.foes.filter(f => f.hp > 0);
                if (m.hp <= 0) { this.finish(false); return; }
                if (!this.foes.length) { if (this.wave >= 3) { this.finish(true); return; } this.wavePause += dt; if (this.wavePause > 2) this.nextWave(); }
            }
            ActHud.set('TANQUE', `OLEADA ${this.wave}/3`, `♥ ${Math.max(0, Math.round(m.hp))}/${m.max}`);
        }
        finish(win, abandon) {
            if (!this.active) return; const g = this.g, p = g.player; this.active = false; this.over = true; ActHud.hide(); const b = this.bet; this.bet = 0; g.economy.settleBet(b, win);
            if (win) { const r = Math.round(230 * (0.9 + 0.1 * g.difficulty.threat)); g.economy.add(r); TG.sound.reward(); TG.Toast.show('🏆 ¡BATALLA DE TANQUES GANADA! +' + r + ' Bits', 'good', 4200); g.quests.event('arena', { mode: 'tank' }); }
            else TG.Toast.show(abandon ? 'Abandonaste la batalla.' : 'Tu tanque fue destruido.', 'warn');
            p.invuln = 1.5; g.zoomTarget = 1; p.x = this.loc.x; p.y = this.loc.y + this.loc.r + 80; g.camera.snap(g.currentBounds().w, g.currentBounds().h); this.shots = []; this.foes = []; this.walls = [];
        }
        cancel() { if (this.active) { this.active = false; ActHud.hide(); this.g.zoomTarget = 1; this.g.player.invuln = 1; const b = this.bet; this.bet = 0; this.g.economy.settleBet(b, false); this.foes = []; this.shots = []; } }
        tank(ctx, x, y, a, ta, col, hit, big, hp, max, t) {
            ctx.save(); ctx.translate(x, y); ctx.save(); ctx.rotate(a); ctx.fillStyle = hit > 0 ? '#ffffff' : '#04090e'; const L = big ? 40 : 34, W = big ? 30 : 25; ctx.fillRect(-L / 2, -W / 2, L, W); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.strokeRect(-L / 2, -W / 2, L, W);
            ctx.fillStyle = U.rgba(col, 0.5); ctx.fillRect(-L / 2, -W / 2 - 4, L, 5); ctx.fillRect(-L / 2, W / 2 - 1, L, 5); ctx.restore();
            ctx.save(); ctx.rotate(ta); ctx.fillStyle = '#071018'; ctx.beginPath(); ctx.arc(0, 0, big ? 15 : 12, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.stroke(); ctx.fillStyle = col; ctx.fillRect(0, -3, big ? 40 : 34, 6); ctx.restore();
            G.glow(ctx, 0, 0, 40, col, 0.22); ctx.restore();
            ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 24, y - 44, 48, 6); ctx.fillStyle = hp / max > 0.4 ? '#7DFF9B' : '#FF5A3A'; ctx.fillRect(x - 23, y - 43, 46 * Math.max(0, hp / max), 4);
        }
        render(ctx, cam, t) {
            if (!this.active) return; const g = this.g, R = this.R, th = G.THEME[g.era], p = g.player; ctx.save();
            const x0 = R.x0 - cam.ox, y0 = R.y0 - cam.oy; ctx.fillStyle = U.rgba(th.glow, 0.05); ctx.fillRect(x0, y0, R.x1 - R.x0, R.y1 - R.y0); ctx.strokeStyle = U.rgba(th.glow, 0.9); ctx.lineWidth = 4; ctx.strokeRect(x0, y0, R.x1 - R.x0, R.y1 - R.y0);
            ctx.strokeStyle = U.rgba(th.glow, 0.12); ctx.lineWidth = 1; ctx.beginPath(); for (let x = Math.ceil(R.x0 / 80) * 80; x < R.x1; x += 80) { ctx.moveTo(x - cam.ox, y0); ctx.lineTo(x - cam.ox, R.y1 - cam.oy); } for (let y = Math.ceil(R.y0 / 80) * 80; y < R.y1; y += 80) { ctx.moveTo(x0, y - cam.oy); ctx.lineTo(R.x1 - cam.ox, y - cam.oy); } ctx.stroke();
            for (const w of this.walls) { ctx.fillStyle = '#06121c'; ctx.fillRect(w.x - cam.ox, w.y - cam.oy, w.w, w.h); ctx.strokeStyle = th.glow; ctx.lineWidth = 2.4; ctx.strokeRect(w.x - cam.ox, w.y - cam.oy, w.w, w.h); G.glow(ctx, w.x + w.w / 2 - cam.ox, w.y + w.h / 2 - cam.oy, Math.max(w.w, w.h), th.glow, 0.12); }
            for (const f of this.foes) this.tank(ctx, f.x - cam.ox, f.y - cam.oy, f.a, f.ta, f.heavy ? '#FF3A3A' : '#FF8A1F', f.hit, f.heavy, f.hp, f.max, t);
            this.tank(ctx, this.me.x - cam.ox, this.me.y - cam.oy, this.me.a, this.me.ta, p.color, this.me.hit, false, this.me.hp, this.me.max, t);
            for (const s of this.shots) { ctx.fillStyle = s.mine ? p.color : '#FF8A1F'; G.glow(ctx, s.x - cam.ox, s.y - cam.oy, 20, s.mine ? p.color : '#FF8A1F', 0.6); ctx.fillRect(s.x - cam.ox - 3, s.y - cam.oy - 3, 6, 6); }
            ctx.restore();
        }
    }
    TG.TankBattle = TankBattle;
})(window.TG = window.TG || {});
