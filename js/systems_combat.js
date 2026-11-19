/* ==========================================================================
   TRON: LAS TRES GRIDS — systems_combat.js
   Combat (discos, rebotes, inducción magnética, descarga en cadena),
   DiscDuel, CycleBattle (muros de luz con colisión real) y Events.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;

    // ============================================================= COMBAT
    class Combat {
        constructor(game) {
            this.g = game; this.enemies = []; this.shots = []; this.arcs = []; this.pickups = []; this.floaters = [];
            this.discs = [0, 1].map(i => ({ slot: i, state: 'ready', x: 0, y: 0, vx: 0, vy: 0, sp: 15, dist: 0, bounces: 0, maxBounces: 1, maxDist: 560, hit: new Set(), trail: [], charged: false, spin: 0 }));
        }
        reset() { this.enemies = []; this.shots = []; this.arcs = []; this.pickups = []; for (const d of this.discs) { d.state = 'ready'; d.trail = []; } }
        floater(x, y, text, color) { this.floaters.push({ x, y, text, color: color || '#fff', life: 1 }); }

        throwDisc(slot, wx, wy) {
            const p = this.g.player, d = this.discs[slot];
            if (!d || d.state !== 'ready' || p.dead || p.mode !== 'foot') return;
            if (slot === 1 && !p.skills.dualDisc) return;
            const a = Math.atan2(wy - (p.y - 30), wx - p.x);
            d.sp = 15; d.x = p.x; d.y = p.y - 30; d.vx = Math.cos(a) * d.sp; d.vy = Math.sin(a) * d.sp;
            d.state = 'out'; d.dist = 0; d.bounces = 0; d.hit = new Set(); d.trail = []; d.charged = false;
            d.maxBounces = p.skills.analyticMind ? 4 : 1; d.maxDist = 560; d.wasBounced = false;
            if (p.skills.staticMastery && p.charge >= 0.99) { d.charged = true; p.charge = 0; TG.sound.zap(); }
            TG.sound.throwDisc();
        }
        nearestEnemy(x, y, r, skip) {
            let best = null, bd = r;
            for (const e of this.enemies) { if (!e.isAlive || (skip && skip.has(e.id))) continue; const d = Math.hypot(e.x - x, (e.y - 22) - y); if (d < bd) { bd = d; best = e; } }
            return best;
        }
        enemyShot(e, p) {
            const a = Math.atan2((p.y - 24) - (e.y - 24), p.x - e.x), sp = 6.2;
            this.shots.push({ x: e.x, y: e.y - 24, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 2.4, dmg: e.dmg, color: e.color });
        }
        chain(from, dmg, d) {
            let cur = from; const used = new Set([from.id]);
            for (let i = 0; i < 3; i++) {
                let best = null, bd = 240;
                for (const e of this.enemies) { if (!e.isAlive || used.has(e.id)) continue; const dd = Math.hypot(e.x - cur.x, e.y - cur.y); if (dd < bd) { bd = dd; best = e; } }
                if (!best) break;
                used.add(best.id);
                this.arcs.push({ x1: cur.x, y1: cur.y - 24, x2: best.x, y2: best.y - 24, life: 0.3 });
                best.hit(dmg, this.g, { stun: 1.0 });
                this.g.particles.emit(best.x, best.y - 24, '#9DFBFF', 8, 3);
                cur = best;
            }
        }
        update(dt) {
            const g = this.g, p = g.player, k = dt * 60, b = g.currentBounds();
            for (const d of this.discs) {
                d.spin += dt * 22;
                if (d.state === 'ready') { d.x = p.x; d.y = p.y - 30; continue; }
                d.trail.push({ x: d.x, y: d.y }); if (d.trail.length > 12) d.trail.shift();
                if (d.state === 'out') {
                    if (p.skills.analyticMind) {   // inducción magnética: curva hacia el enemigo cercano
                        const tg = this.nearestEnemy(d.x, d.y, 300, d.hit);
                        if (tg) {
                            const want = Math.atan2(tg.y - 22 - d.y, tg.x - d.x), cur = Math.atan2(d.vy, d.vx);
                            const na = cur + U.clamp(U.angDiff(cur, want), -0.1 * k, 0.1 * k);
                            d.vx = Math.cos(na) * d.sp; d.vy = Math.sin(na) * d.sp;
                        }
                    }
                    d.x += d.vx * k; d.y += d.vy * k; d.dist += d.sp * k;
                    let bounced = false;
                    if (d.x < 10) { d.x = 10; d.vx = Math.abs(d.vx); bounced = true; } else if (d.x > b.w - 10) { d.x = b.w - 10; d.vx = -Math.abs(d.vx); bounced = true; }
                    if (d.y < 10) { d.y = 10; d.vy = Math.abs(d.vy); bounced = true; } else if (d.y > b.h - 10) { d.y = b.h - 10; d.vy = -Math.abs(d.vy); bounced = true; }
                    if (bounced) {
                        d.bounces++; d.wasBounced = true; d.hit.clear();
                        if (!p.skills.analyticMind) { d.sp *= 0.85; const m = Math.hypot(d.vx, d.vy); d.vx = d.vx / m * d.sp; d.vy = d.vy / m * d.sp; }
                        g.particles.emit(d.x, d.y, p.color, 8, 3); TG.sound.ui();
                        if (d.bounces > d.maxBounces) { d.state = 'back'; d.hit.clear(); }
                    }
                    if (d.dist > d.maxDist) { d.state = 'back'; d.hit.clear(); }
                } else {
                    const dx = p.x - d.x, dy = (p.y - 30) - d.y, dd = Math.hypot(dx, dy) || 1, sp = 17 * Math.min(1.8, p.attackSpeedMultiplier);
                    d.vx = dx / dd * sp; d.vy = dy / dd * sp; d.x += d.vx * k; d.y += d.vy * k;
                    if (dd < 26) { d.state = 'ready'; d.charged = false; TG.sound.discReturn(); continue; }
                }
                // impactos
                for (const e of this.enemies) {
                    if (!e.isAlive || e.ally || d.hit.has(e.id)) continue;
                    if (Math.hypot(e.x - d.x, (e.y - 22) - d.y) < 28) {
                        d.hit.add(e.id);
                        const dmg = 22 * p.damageMultiplier * (d.charged ? 2 : 1);
                        e.hit(dmg, g, { knock: Math.atan2(d.vy, d.vx), stun: d.charged ? 1.0 : 0 });
                        TG.sound.discHit(); g.camera.shake(3);
                        this.floater(e.x, e.y - 50, '-' + Math.round(dmg), d.charged ? '#9DFBFF' : '#ffd0a0');
                        if (d.charged) { TG.sound.zap(); this.arcs.push({ x1: d.x, y1: d.y, x2: e.x, y2: e.y - 24, life: 0.25 }); this.chain(e, dmg * 0.6, d); }
                    }
                }
                if (g.special) g.special.discVsProps(d);
                if (g.missions) g.missions.discHit(d);
            }
            // proyectiles enemigos
            for (let i = this.shots.length - 1; i >= 0; i--) {
                const s = this.shots[i]; s.x += s.vx * k; s.y += s.vy * k; s.life -= dt;
                if (Math.hypot(s.x - p.x, s.y - 24 - p.y) < 22 && !p.dead) { p.takeDamage(s.dmg, g); s.life = 0; }
                if (s.life <= 0 || s.x < 0 || s.y < 0 || s.x > b.w || s.y > b.h) this.shots.splice(i, 1);
            }
            for (let i = this.arcs.length - 1; i >= 0; i--) { this.arcs[i].life -= dt; if (this.arcs[i].life <= 0) this.arcs.splice(i, 1); }
            for (let i = this.floaters.length - 1; i >= 0; i--) { const f = this.floaters[i]; f.y -= 28 * dt; f.life -= dt * 0.9; if (f.life <= 0) this.floaters.splice(i, 1); }
            // pickups
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pk = this.pickups[i]; pk.life -= dt;
                const dx = p.x - pk.x, dy = p.y - 20 - pk.y, dd = Math.hypot(dx, dy);
                if (dd < 150 + p.magnet) { pk.x += dx / dd * 5 * k; pk.y += dy / dd * 5 * k; }
                if (dd < 28 + p.magnet * 0.15) {
                    if (pk.kind === 'bit') { const v = g.economy.earn(pk.v || 5); TG.sound.pickup(); this.floater(pk.x, pk.y - 20, '+' + v, '#FFD84A'); }
                    else { p.health = Math.min(p.maxHealth, p.health + 30); TG.sound.pickup(); this.floater(pk.x, pk.y - 20, '+30 ❤', '#7DFF9B'); }
                    this.pickups.splice(i, 1); continue;
                }
                if (pk.life <= 0) this.pickups.splice(i, 1);
            }
            // enemigos
            for (const e of this.enemies) e.update(dt, g);
            // embestida del ciclo
            if (p.mode === 'cycle' && g.activeVehicle && g.activeVehicle.speed > 5.5) {
                for (const e of this.enemies) if (e.isAlive && Math.hypot(e.x - p.x, e.y - p.y) < 42) { e.hit(30, g, { knock: g.activeVehicle.angle }); this.floater(e.x, e.y - 50, 'EMBESTIDA', '#FFD84A'); }
            }
            this.enemies = this.enemies.filter(e => e.isAlive);
            // limpieza de enemigos lejanos del mundo abierto
            if (!g.duel.active && !g.battle.active) {
                this.enemies = this.enemies.filter(e => e.noDespawn || Math.hypot(e.x - p.x, e.y - p.y) < 2200);
            }
        }
        spawn(e) { this.enemies.push(e); return e; }

        // ------------------------------------------------------------ dibujo
        renderGround(ctx, cam, t) {
            for (const pk of this.pickups) {
                const x = pk.x - cam.ox, y = pk.y - cam.oy; if (x < -30 || y < -30 || x > cam.w + 30 || y > cam.h + 30) continue;
                const c = pk.kind === 'bit' ? '#FFD84A' : '#7DFF9B';
                G.glow(ctx, x, y, 22, c, 0.55);
                ctx.save(); ctx.translate(x, y - 8 + Math.sin(t * 4 + pk.x) * 3); ctx.rotate(t * 2);
                ctx.beginPath(); ctx.rect(-5, -5, 10, 10); G.stroke(ctx, c, 1.6, 1); ctx.restore();
            }
        }
        renderFx(ctx, cam, t, input) {
            const g = this.g, p = g.player;
            // proyección balística (Mr. L)
            if (p.skills.analyticMind && p.mode === 'foot' && !p.dead && g.state === 'play') this.renderAim(ctx, cam, input);
            for (const d of this.discs) {
                if (d.state === 'ready') continue;
                const ds = TG.discStyle(p), col = d.charged ? '#BFFFFF' : (ds.color || p.color);
                for (let i = 0; i < d.trail.length; i++) { const q = d.trail[i], a = i / d.trail.length; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = U.rgba(col, a * 0.45); ctx.beginPath(); ctx.arc(q.x - cam.ox, q.y - cam.oy, 2 + a * 5, 0, 7); ctx.fill(); ctx.restore(); }
                this.drawDisc(ctx, d.x - cam.ox, d.y - cam.oy, col, d.spin, d.charged, t, 1, ds.id);
            }
            for (const s of this.shots) this.drawDisc(ctx, s.x - cam.ox, s.y - cam.oy, s.color, t * 18, false, t, 0.7);
            for (const a of this.arcs) {
                ctx.beginPath(); let px = a.x1 - cam.ox, py = a.y1 - cam.oy; const qx = a.x2 - cam.ox, qy = a.y2 - cam.oy; ctx.moveTo(px, py);
                for (let i = 1; i < 6; i++) { const f = i / 6; ctx.lineTo(px + (qx - px) * f + (Math.random() - 0.5) * 18, py + (qy - py) * f + (Math.random() - 0.5) * 18); }
                ctx.lineTo(qx, qy); G.stroke(ctx, '#BFFFFF', 2, Math.min(1, a.life * 4));
            }
            for (const f of this.floaters) { ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 1.6); ctx.font = 'bold 14px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.color; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3; ctx.strokeText(f.text, f.x - cam.ox, f.y - cam.oy); ctx.fillText(f.text, f.x - cam.ox, f.y - cam.oy); ctx.restore(); }
        }
        drawDisc(ctx, x, y, col, spin, charged, t, scale = 1, style) {
            ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
            G.glow(ctx, 0, 0, charged ? 44 : 30, col, charged ? 0.7 : 0.5);
            ctx.save(); ctx.rotate(spin); ctx.scale(1, 0.62);
            if (style === 'blade') G.formPath(ctx, 'hexagon', 12.5); else { ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); }
            ctx.fillStyle = '#03080d'; ctx.fill(); G.stroke(ctx, col, 2.4, 1);
            if (style === 'ring2') { ctx.beginPath(); ctx.arc(0, 0, 17.5, 0, Math.PI * 2); G.stroke(ctx, col, 1.6, 0.8); }
            ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); G.stroke(ctx, '#ffffff', 1.4, 0.9);
            ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(13, 0); G.stroke(ctx, col, 1, 0.8);
            ctx.restore();
            if (charged) for (let i = 0; i < 3; i++) { ctx.beginPath(); let px = 0, py = 0; ctx.moveTo(0, 0); const a = Math.random() * 6.28; for (let k = 0; k < 3; k++) { px += Math.cos(a + k) * 8; py += Math.sin(a + k) * 8 + (Math.random() - 0.5) * 8; ctx.lineTo(px, py); } G.stroke(ctx, '#BFFFFF', 1.2, 0.9); }
            ctx.restore();
        }
        // trayectoria prevista con rebotes (ángulo de incidencia = ángulo de reflexión)
        renderAim(ctx, cam, input) {
            const g = this.g, p = g.player, b = g.currentBounds();
            const wx = input.mouse.x + cam.ox, wy = input.mouse.y + cam.oy;
            const a = Math.atan2(wy - (p.y - 30), wx - p.x);
            let x = p.x, y = p.y - 30, vx = Math.cos(a), vy = Math.sin(a), left = 560, bounces = 0;
            ctx.save(); ctx.beginPath(); ctx.moveTo(x - cam.ox, y - cam.oy);
            const marks = [];
            while (left > 0 && bounces <= 4) {
                let tx = vx > 0 ? (b.w - 10 - x) / vx : vx < 0 ? (10 - x) / vx : 1e9;
                let ty = vy > 0 ? (b.h - 10 - y) / vy : vy < 0 ? (10 - y) / vy : 1e9;
                const tt = Math.min(tx, ty, left);
                x += vx * tt; y += vy * tt; left -= tt; ctx.lineTo(x - cam.ox, y - cam.oy);
                if (tt === tx || tt === ty) { marks.push([x, y]); if (tt === tx) vx = -vx; if (tt === ty) vy = -vy; bounces++; } else break;
            }
            ctx.setLineDash([7, 8]); ctx.lineDashOffset = -g.time * 40; ctx.strokeStyle = U.rgba('#B9A7FF', 0.8); ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
            for (const m of marks) { ctx.beginPath(); ctx.arc(m[0] - cam.ox, m[1] - cam.oy, 5, 0, Math.PI * 2); G.stroke(ctx, '#B9A7FF', 1.6, 1); }
            ctx.restore();
        }
    }
    TG.Combat = Combat;

    // ============================================================ DISC DUEL
    class DiscDuel {
        constructor(game) { this.g = game; this.active = false; this.wave = 0; this.loc = null; }
        start(loc, bet) {
            const g = this.g; this.active = true; this.loc = loc; this.wave = 0; this.done = false; this.bet = bet || 0;
            g.combat.enemies = g.combat.enemies.filter(e => e.noDespawn);
            TG.Toast.show('⚔ DUELO DE DISCOS: 3 oleadas. ¡Sobrevive!', 'warn', 4200); TG.sound.eventAlert();
            this.nextWave();
        }
        nextWave() {
            const g = this.g, loc = this.loc; this.wave++;
            const era = g.era, n = this.wave === 1 ? 3 : this.wave === 2 ? 4 : 3;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + Math.random(), r = loc.r * 0.7 + 60;
                const type = this.wave === 3 && i === 0 ? 'brute' : (this.wave === 2 && i % 2 ? 'ranged' : 'gladiator');
                g.combat.spawn(TG.makeEnemy(type, era, loc.x + Math.cos(a) * r, loc.y + Math.sin(a) * r * 0.8, { tag: 'duel', noDespawn: true, aggro: 2000 }));
            }
            TG.Toast.show(`Oleada ${this.wave}/3`, 'info', 2400);
        }
        update() {
            if (!this.active) return;
            const g = this.g, p = g.player;
            if (p.dead) { this.cancel(); return; }
            if (Math.hypot(p.x - this.loc.x, p.y - this.loc.y) > this.loc.r + 900) { TG.Toast.show('Abandonaste el duelo.', 'warn'); this.cancel(); return; }
            const alive = g.combat.enemies.some(e => e.tag === 'duel' && e.isAlive);
            if (!alive) {
                if (this.wave >= 3) this.win(); else this.nextWave();
            }
        }
        win() {
            this.active = false; const g = this.g;
            g.economy.add(200); g.particles.ring(g.player.x, g.player.y, g.player.color, 140); TG.sound.reward();
            TG.Toast.show('🏆 ¡DUELO GANADO! +200 Bits', 'good', 4200); const bet = this.bet; this.bet = 0; g.economy.settleBet(bet, true);
            g.quests.event('arena', { mode: 'disc' });
        }
        cancel() {
            const was = this.active; this.active = false; this.g.combat.enemies = this.g.combat.enemies.filter(e => e.tag !== 'duel');
            if (was && this.bet > 0) { const b = this.bet; this.bet = 0; this.g.economy.settleBet(b, false); } else this.bet = 0;
        }
    }
    TG.DiscDuel = DiscDuel;

    // =========================================================== CYCLE BATTLE
    // Batalla de ciclos clásica de Tron: giros de 90°, los muros de luz matan.
    class CycleBattle {
        constructor(game) { this.g = game; this.active = false; this.riders = []; this.rect = null; this.prev = {}; this.time = 0; }
        start(loc, bet) {
            const g = this.g, p = g.player; this.bet = bet || 0;
            if (g.activeVehicle) g.activeVehicle = null;
            this.active = true; this.loc = loc; this.time = 0; this.over = false;
            const cx = loc.x, cy = loc.y, Sx = 540, Sy = 420;
            this.rect = { x0: cx - Sx, y0: cy - Sy, x1: cx + Sx, y1: cy + Sy };
            const R = this.rect, th = G.THEME[g.era];
            const mk = (x, y, dir, color, isP) => ({ x, y, dir, color, isP, alive: true, path: [{ x, y }], turnCd: 0, sp: 7.2 });
            p.mode = 'cycle'; p.health = p.maxHealth;
            this.riders = [
                mk(R.x0 + 90, cy, 0, p.color, true),
                mk(R.x1 - 90, cy, 2, '#FF8A1F', false), mk(cx, R.y0 + 90, 1, '#FFD040', false), mk(cx, R.y1 - 90, 3, '#FF3A6A', false)
            ];
            p.x = this.riders[0].x; p.y = this.riders[0].y;
            g.combat.enemies = []; g.combat.shots = [];
            g.camera.snap(g.currentBounds().w, g.currentBounds().h);
            TG.Toast.show('🏍 BATALLA DE CICLOS: ← → giran 90°. ¡No toques los muros de luz!', 'warn', 5200); TG.sound.cycleStart();
        }
        dirVec(d) { return [[1, 0], [0, 1], [-1, 0], [0, -1]][d & 3]; }
        segBlocked(x, y, rider, dist) {
            const R = this.rect; if (x < R.x0 + 6 || x > R.x1 - 6 || y < R.y0 + 6 || y > R.y1 - 6) return true;
            for (const o of this.riders) {
                if (!o.alive && o.path.length < 2) continue;
                const pts = o.path.concat(o.alive ? [{ x: o.x, y: o.y }] : []);
                const n = pts.length - (o === rider ? 2 : 1);
                for (let i = 0; i < n; i++) {
                    const a = pts[i], b = pts[i + 1];
                    const minx = Math.min(a.x, b.x) - 7, maxx = Math.max(a.x, b.x) + 7, miny = Math.min(a.y, b.y) - 7, maxy = Math.max(a.y, b.y) + 7;
                    if (x >= minx && x <= maxx && y >= miny && y <= maxy) return true;
                }
            }
            return false;
        }
        ray(r, dir, dist) { const v = this.dirVec(dir); for (let d = 12; d <= dist; d += 10) if (this.segBlocked(r.x + v[0] * d, r.y + v[1] * d, r, dist)) return d; return dist; }
        turn(r, s) { r.dir = (r.dir + s + 4) & 3; r.path.push({ x: r.x, y: r.y }); }
        derez(r) {
            r.alive = false; const g = this.g;
            g.particles.voxels(r.x, r.y - 10, r.color, 36, 4); g.particles.ring(r.x, r.y, r.color, 120); TG.sound.discHit(); g.camera.shake(10);
            r.path = [];
            if (r.isP) { g.player.invuln = 0; g.player.shieldT = 0; g.player.takeDamage(9999, g); }
        }
        update(dt) {
            if (!this.active) return;
            const g = this.g, input = g.input, k = dt * 60; this.time += dt;
            const P = this.riders[0];
            if (!this.over) {
                const l = input.down('ArrowLeft') || input.down('KeyA'), r = input.down('ArrowRight') || input.down('KeyD');
                if (P.alive) {
                    if (l && !this.prev.l) this.turn(P, -1); if (r && !this.prev.r) this.turn(P, 1);
                    const brake = input.down('ArrowDown') || input.down('KeyS'), boost = input.down('ArrowUp') || input.down('KeyW');
                    P.sp = boost ? 9.2 : brake ? 5.2 : 7.2;
                }
                this.prev = { l, r };
                for (const r of this.riders) {
                    if (!r.alive) continue;
                    if (!r.isP) {
                        r.turnCd -= dt;
                        const ahead = this.ray(r, r.dir, 150);
                        if (ahead < 150 && r.turnCd <= 0) {
                            const L = this.ray(r, r.dir - 1, 190), Rr = this.ray(r, r.dir + 1, 190);
                            if (L > 40 || Rr > 40) { this.turn(r, L > Rr ? -1 : 1); r.turnCd = 0.25; }
                        } else if (Math.random() < 0.006 && r.turnCd <= 0) { const dd = Math.random() < 0.5 ? -1 : 1; if (this.ray(r, r.dir + dd, 160) > 120) { this.turn(r, dd); r.turnCd = 0.6; } }
                    }
                    const v = this.dirVec(r.dir), steps = Math.max(1, Math.ceil(r.sp * k / 4));
                    for (let s = 0; s < steps; s++) {
                        r.x += v[0] * r.sp * k / steps; r.y += v[1] * r.sp * k / steps;
                        if (this.segBlocked(r.x, r.y, r, 0)) { this.derez(r); break; }
                    }
                    if (r.isP && r.alive) { g.player.x = r.x; g.player.y = r.y; g.player.angle = r.dir * Math.PI / 2; g.player.f = v[0] >= 0 ? 1 : -1; }
                    if (r.alive && Math.random() < 0.5) g.particles.emit(r.x - v[0] * 24, r.y - v[1] * 24, r.color, 1, 1.2, { angle: Math.atan2(-v[1], -v[0]), spread: 0.8 });
                }
                const aiAlive = this.riders.filter(r => !r.isP && r.alive).length;
                if (!P.alive) this.finish(false);
                else if (aiAlive === 0) this.finish(true);
                else if (this.time > 120) { TG.Toast.show('Tiempo agotado.', 'warn'); this.finish(false); }
            }
        }
        finish(win) {
            const g = this.g; this.over = true; this.active = false;
            const p = g.player; { const b = this.bet; this.bet = 0; g.economy.settleBet(b, win); }
            if (win) {
                g.economy.add(250); TG.sound.reward(); TG.Toast.show('🏆 ¡BATALLA DE CICLOS GANADA! +250 Bits', 'good', 4200);
                g.particles.ring(p.x, p.y, p.color, 160);
                g.quests.event('arena', { mode: 'cycle' });
            }
            // devolver al jugador a pie fuera del campo (si murió, el respawn global lo reubica)
            if (!p.dead) { p.mode = 'foot'; p.x = this.loc.x; p.y = this.loc.y + this.loc.r + 70; g.camera.snap(g.currentBounds().w, g.currentBounds().h); }
            else p.mode = 'foot';
            this.riders = [];
        }
        cancel() { if (!this.active) return; this.active = false; this.riders = []; const p = this.g.player; p.mode = 'foot'; const b = this.bet; this.bet = 0; this.g.economy.settleBet(b, false); }
        render(ctx, cam, t) {
            if (!this.active && !this.riders.length) return;
            const R = this.rect, g = this.g, th = G.THEME[g.era];
            const x0 = R.x0 - cam.ox, y0 = R.y0 - cam.oy, x1 = R.x1 - cam.ox, y1 = R.y1 - cam.oy;
            ctx.save();
            ctx.fillStyle = U.rgba(th.glow, 0.05); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.strokeStyle = U.rgba(th.glow, 0.13); ctx.lineWidth = 1; ctx.beginPath();
            for (let x = Math.ceil(R.x0 / 60) * 60; x < R.x1; x += 60) { ctx.moveTo(x - cam.ox, y0); ctx.lineTo(x - cam.ox, y1); }
            for (let y = Math.ceil(R.y0 / 60) * 60; y < R.y1; y += 60) { ctx.moveTo(x0, y - cam.oy); ctx.lineTo(x1, y - cam.oy); }
            ctx.stroke();
            // muros del campo
            const h = 46;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath(); G.stroke(ctx, th.glow, 2.6, 1);
            ctx.fillStyle = U.rgba(th.glow, 0.1); ctx.fillRect(x0, y0 - h, x1 - x0, h);
            ctx.beginPath(); ctx.moveTo(x0, y0 - h); ctx.lineTo(x1, y0 - h); G.stroke(ctx, th.glow, 1.6, 0.8);
            ctx.restore();
            for (const r of this.riders) {
                const pts = r.path.concat(r.alive ? [{ x: r.x - this.dirVec(r.dir)[0] * 22, y: r.y - this.dirVec(r.dir)[1] * 22 }] : []);
                // paredes de luz a tramos
                ctx.save(); ctx.globalCompositeOperation = 'lighter';
                for (let i = 1; i < pts.length; i++) {
                    const a = pts[i - 1], b = pts[i]; const ax = a.x - cam.ox, ay = a.y - cam.oy, bx = b.x - cam.ox, by = b.y - cam.oy;
                    ctx.fillStyle = U.rgba(r.color, 0.3); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx, by - 24); ctx.lineTo(ax, ay - 24); ctx.closePath(); ctx.fill();
                }
                ctx.restore();
                if (pts.length > 1) {
                    ctx.beginPath(); ctx.moveTo(pts[0].x - cam.ox, pts[0].y - cam.oy - 24); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x - cam.ox, pts[i].y - cam.oy - 24); G.stroke(ctx, r.color, 1.8, 0.95);
                    ctx.beginPath(); ctx.moveTo(pts[0].x - cam.ox, pts[0].y - cam.oy); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x - cam.ox, pts[i].y - cam.oy); G.stroke(ctx, r.color, 1.2, 0.6);
                }
                if (r.alive) G.cycle(ctx, r.x - cam.ox, r.y - cam.oy, r.dir * Math.PI / 2, r.color, { t, fire: r.isP && g.player.skills.mrUBike, form: r.isP ? g.player.form : undefined });
            }
        }
        hudText() {
            if (!this.active) return '';
            const n = this.riders.filter(r => !r.isP && r.alive).length;
            return `BATALLA DE CICLOS · RIVALES: ${n} · ${Math.max(0, Math.ceil(120 - this.time))}s`;
        }
    }
    TG.CycleBattle = CycleBattle;

    // ================================================================ EVENTS
    class Events {
        constructor(game) { this.g = game; this.timer = 55 + Math.random() * 35; }
        update(dt) {
            const g = this.g, p = g.player;
            if (g.player.interior || g.duel.active || g.battle.active || p.mode !== 'foot' || p.dead || g.state !== 'play') return;
            this.timer -= dt;
            if (this.timer > 0) return;
            this.timer = 70 + Math.random() * 50;
            const r = Math.random(), era = g.era;
            if (r < 0.45 && g.combat.enemies.length < 4 && !(era === '2010' && g.phase2010() === 'pre')) {
                const n = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; g.combat.spawn(TG.makeEnemy(i === 0 && Math.random() < 0.4 ? 'ranged' : 'guard', era, p.x + Math.cos(a) * 620, p.y + Math.sin(a) * 620, { tag: 'patrol' })); }
                TG.Toast.show('⚠ Patrulla enemiga detectada', 'warn'); TG.sound.eventAlert();
            } else if (r < 0.8) {
                for (let i = 0; i < 10; i++) g.combat.pickups.push({ x: p.x + (Math.random() - 0.5) * 700, y: p.y + (Math.random() - 0.5) * 500, kind: 'bit', v: 5 + Math.floor(Math.random() * 6), life: 22 });
                TG.Toast.show('✨ Lluvia de Bits: recógelos antes de que se desintegren', 'good'); TG.sound.eventAlert();
            } else {
                g.combat.pickups.push({ x: p.x + (Math.random() - 0.5) * 400, y: p.y + (Math.random() - 0.5) * 300, kind: 'health', life: 30 });
                TG.Toast.show('💠 Cápsula de energía cercana', 'good'); TG.sound.eventAlert();
            }
        }
    }
    TG.Events = Events;

})(window.TG = window.TG || {});
