/* ==========================================================================
   TRON: LAS TRES GRIDS — entities.js
   Player, NPC, Enemy, LightCycle, SolarSailer.  (dt en segundos; k = dt*60)
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U;

    // ================================================================= PLAYER
    class Player {
        constructor() {
            this.name = 'User_Alpha'; this.color = '#00D4FF'; this.form = 'human';
            this.x = 600; this.y = 600; this.mode = 'foot'; this.angle = 0; this.f = 1; this.ph = 0; this.moving = false;
            this.health = 100; this.maxHealth = 100; this.bits = 0;
            this.speedMultiplier = 1; this.damageMultiplier = 1; this.resistanceMultiplier = 1; this.attackSpeedMultiplier = 1;
            this.skills = { staticMastery: false, analyticMind: false, dualDisc: false, permanence: false, mrUBike: false };
            this.fragments = 0; this.charge = 0; this.hurt = 0; this.invuln = 0; this.dead = false;
            this.upg = {}; this.items = { heal: 0, emp: 0, shield: 0, boost: 0 }; this.owned = []; this.cos = { trail: 'default', disc: 'default', aura: 'none', accent: '#ffffff' };
            this.lootMult = 1; this.regenBonus = 0; this.magnet = 0; this.shieldT = 0; this.stats = { earned: 0, spent: 0, kills: 0, betsWon: 0, betsLost: 0 };
            this.dmgBuf = 0; this.dmgRate = 0; this.faraday = false;
            this.cycleSpeed = 9; this.baseSpeed = 4.7; this.stillTime = 0; this.cycleDist = 0; this.interior = null; this.stunned = 0;
        }
        get speed() { return this.baseSpeed * this.speedMultiplier; }
        update(dt, input, bounds) {
            const k = dt * 60;
            this.hurt = Math.max(0, this.hurt - dt * 2.2); this.invuln = Math.max(0, this.invuln - dt);
            if (this.dead) return;
            const v = input.moveVec; const len = Math.hypot(v.x, v.y);
            this.moving = len > 0 && !this.stunned;
            if (this.moving) {
                const sp = this.speed * k;
                this.x += (v.x / len) * sp; this.y += (v.y / len) * sp;
                this.angle = Math.atan2(v.y, v.x);
                if (Math.abs(v.x) > 0) this.f = v.x > 0 ? 1 : -1;
                this.ph += dt * 13;
                this.stillTime = 0;
            } else { this.stillTime += dt; this.ph = 0; }
            this.x = U.clamp(this.x, 24, bounds.w - 24); this.y = U.clamp(this.y, 40, bounds.h - 24);
            if (this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + dt * (0.8 + this.regenBonus));
            if (this.stunned > 0) this.stunned -= dt;
        }
        takeDamage(n, game) {
            if (this.invuln > 0 || this.shieldT > 0 || this.dead) return;
            let d = n / this.resistanceMultiplier;
            if (this.skills.staticMastery && this.charge >= 0.99) d *= 0.6;   // campo de equilibrio
            if (this.faraday) d *= 0.4;   // jaula de Faraday
            if (this.skills.pid) { const now = d * 0.4; this.dmgBuf += d - now; this.dmgRate = Math.max(this.dmgRate, this.dmgBuf / 2); d = now; }   // control derivativo
            this.health -= d; this.hurt = 1; this.invuln = 0.45;
            if (game) { game.camera.shake(9); TG.sound.damage(); game.particles.emit(this.x, this.y - 20, this.color, 10, 3); }
            if (this.health <= 0) { this.health = 0; this.dead = true; if (game) game.onPlayerDeath(); }
        }
    }
    TG.Player = Player;

    // ==================================================================== NPC
    class NPC {
        constructor(d) {
            Object.assign(this, d);
            this.r = 28; this.ph = 0; this.moving = false; this.f = Math.random() < 0.5 ? 1 : -1;
            this.tx = this.x; this.ty = this.y; this.wait = Math.random() * 3; this.bitState = 'idle'; this.bitT = 0; this.seed = Math.random() * 10;
            this.talking = false;
        }
        update(dt, game) {
            this.moving = false;
            const p = game.player, dpl = Math.hypot(p.x - this.x, p.y - this.y);
            if (this.bitT > 0) { this.bitT -= dt; if (this.bitT <= 0) this.bitState = 'idle'; }
            if (dpl < 140 && !this.look.startsWith('bit') && this.look !== 'mcp') { this.f = p.x >= this.x ? 1 : -1; }
            if (!this.roam || this.talking || dpl < 90) return;
            if (this.wait > 0) { this.wait -= dt; return; }
            const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
            if (d < 6) {
                this.wait = 1.5 + Math.random() * 3.5;
                const a = Math.random() * Math.PI * 2, rr = Math.random() * this.roam;
                const b = game.currentBounds();
                this.tx = U.clamp(this.homeX + Math.cos(a) * rr, 40, b.w - 40); this.ty = U.clamp(this.homeY + Math.sin(a) * rr, 60, b.h - 40);
                return;
            }
            const sp = 40 * dt; this.x += dx / d * sp; this.y += dy / d * sp; this.moving = true; this.ph += dt * 9;
            if (Math.abs(dx) > 1) this.f = dx > 0 ? 1 : -1;
        }
    }
    TG.NPC = NPC;

    // ================================================================== ENEMY
    let EID = 1;
    class Enemy {
        constructor(s) {
            this.id = EID++; this.name = s.name || 'Guardia'; this.x = s.x; this.y = s.y;
            this.hp = this.maxHp = s.hp || 60; this.speed = s.speed || 2.0; this.dmg = s.dmg || 8; this.color = s.color || '#FF5A1A';
            this.look = s.look || 'helmet'; this.ranged = !!s.ranged; this.big = !!s.big; this.kind = s.kind || 'guard'; this.era = s.era;
            this.angle = 0; this.ph = Math.random() * 6; this.cd = 0.5 + Math.random(); this.rcd = 1 + Math.random() * 2; this.flash = 0; this.stun = 0;
            this.isAlive = true; this.aggro = s.aggro || 700; this.reward = s.reward === undefined ? 12 : s.reward; this.tag = s.tag || null; this.bob = Math.random() * 6;
            this.noDespawn = !!s.noDespawn; this.knock = { x: 0, y: 0 }; this.boss = !!s.boss; this.ally = false; this.allyT = 0; this.virus = 0;
        }
        update(dt, game) {
            if (!this.isAlive) return;
            const k = dt * 60, p = game.player;
            this.flash = Math.max(0, this.flash - dt * 5);
            this.x += this.knock.x * k; this.y += this.knock.y * k; this.knock.x *= 0.85; this.knock.y *= 0.85;
            if (this.kind === 'dummy') return;   // las dianas de entrenamiento no se mueven ni atacan
            if (this.ally) {   // reescrito por Flynn: lucha de tu lado un rato
                this.allyT -= dt; if (this.allyT <= 0) { this.isAlive = false; game.particles.voxels(this.x, this.y - 22, this.color, 14, 3); return; }
                let tg = null, td = 640; for (const o of game.combat.enemies) { if (o === this || !o.isAlive || o.ally) continue; const dd = Math.hypot(o.x - this.x, o.y - this.y); if (dd < td) { td = dd; tg = o; } }
                const gx = tg ? tg.x : p.x - 60, gy = tg ? tg.y : p.y + 50, gd = Math.hypot(gx - this.x, gy - this.y);
                if (gd > 30) { this.x += (gx - this.x) / gd * this.speed * 1.4 * k; this.y += (gy - this.y) / gd * this.speed * 1.4 * k; this.ph += dt * 10; this.angle = Math.atan2(gy - this.y, gx - this.x); }
                this.cd -= dt; if (tg && gd < 44 && this.cd <= 0) { tg.hit(11 * game.player.damageMultiplier, game, { stun: 0.1 }); this.cd = 0.8; }
                return;
            }
            if (this.stun > 0) { this.stun -= dt; return; }
            const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
            this.angle = Math.atan2(dy, dx);
            if (this.kind === 'probe') {   // sondas estáticas: flotan en órbita errática
                this.bob += dt * 3; const wob = Math.sin(this.bob) * 1.3;
                if (d < 520 && !p.dead) { this.x += Math.cos(this.angle + wob) * this.speed * k; this.y += Math.sin(this.angle + wob) * this.speed * k; }
            } else if (d < this.aggro && !p.dead) {
                const keep = this.ranged ? 280 : 24;
                if (d > keep) { this.x += dx / d * this.speed * k; this.y += dy / d * this.speed * k; this.ph += dt * 10; }
                else if (this.ranged && d < keep - 80) { this.x -= dx / d * this.speed * k * 0.7; this.y -= dy / d * this.speed * k * 0.7; }
            }
            const b = game.currentBounds();
            this.x = U.clamp(this.x, 20, b.w - 20); this.y = U.clamp(this.y, 30, b.h - 20);
            this.cd -= dt;
            if (d < (this.kind === 'probe' ? 30 : 34) && this.cd <= 0 && !p.dead) { p.takeDamage(this.dmg, game); this.cd = 1; }
            if (this.ranged) {
                this.rcd -= dt;
                if (this.rcd <= 0 && d < 520 && !p.dead) { this.rcd = 2.2 + Math.random() * 1.2; game.combat.enemyShot(this, p); }
            }
        }
        hit(dmg, game, o = {}) {
            if (!this.isAlive) return;
            this.hp -= dmg; this.flash = 1;
            if (o.knock && this.kind !== 'dummy') { this.knock.x = Math.cos(o.knock) * 6; this.knock.y = Math.sin(o.knock) * 6; }
            if (o.stun) this.stun = Math.max(this.stun, o.stun);
            game.particles.emit(this.x, this.y - 22, this.color, 8, 3);
            if (this.hp <= 0) this.derez(game);
        }
        derez(game) {
            if (!this.isAlive) return;
            this.isAlive = false;
            game.particles.voxels(this.x, this.y - 22, this.color, 26, 3.2); game.particles.ring(this.x, this.y - 10, this.color, 70);
            TG.sound.discHit();
            game.onEnemyKilled(this);
        }
    }
    TG.Enemy = Enemy;

    // Plantillas de enemigos por era
    TG.makeEnemy = function (type, era, x, y, extra = {}) {
        const colors = { '1982': '#FF5A1A', '2010': '#FF8A1F', '2025': '#FF1744' };
        const names = { '1982': 'Guardia del MCP', '2010': 'Guardia Negro', '2025': 'Soldado Dillinger' };
        const c = colors[era] || '#FF5A1A';
        const T = {
            guard: { name: names[era] || 'Guardia', hp: 56, speed: 2.0, dmg: 8, color: c, look: 'helmet' },
            ranged: { name: (names[era] || 'Guardia') + ' (Tirador)', hp: 46, speed: 1.7, dmg: 7, color: c, look: 'helmet', ranged: true },
            gladiator: { name: 'Gladiador', hp: 78, speed: 2.4, dmg: 10, color: c, look: 'mask', aggro: 2000 },
            brute: { name: 'Comandante', hp: 160, speed: 1.6, dmg: 14, color: c, look: 'helmet', big: true, reward: 40 },
            dummy: { name: 'Diana de Entrenamiento', hp: 30, speed: 0, dmg: 0, color: '#FFB347', kind: 'dummy', reward: 0, noDespawn: true },
            probe: { name: 'Sonda Estática', hp: 36, speed: 2.4, dmg: 6, color: '#7DFFFF', look: 'bit', kind: 'probe', aggro: 1500, reward: 15 }
        };
        const e = new Enemy(Object.assign({ era, x, y }, T[type] || T.guard, extra));
        const D = TG.game && TG.game.difficulty;   // dificultad normal que sube poco a poco
        if (D && e.kind !== 'dummy' && !extra.fixed) { const m = D.enemy(); e.hp = e.maxHp = Math.round(e.hp * m.hp); e.dmg = Math.round(e.dmg * m.dmg * 10) / 10; e.speed *= m.spd; }
        return e;
    };

    // =============================================================== VEHÍCULOS
    class LightCycle {
        constructor(p, mrU) {
            this.p = p; this.angle = p.angle || 0; this.speed = 0; this.trail = []; this.fire = !!mrU || !!TG.trailInfo(p).fire; this.t = 0; this.last = { x: p.x, y: p.y };
            this.boost = 0; this.maxSpeed = (mrU ? Math.max(16, p.cycleSpeed) : p.cycleSpeed) * p.speedMultiplier;
        }
        update(dt, input, bounds, game) {
            const p = this.p, k = dt * 60; this.t += dt;
            const left = input.down('ArrowLeft') || input.down('KeyA'), right = input.down('ArrowRight') || input.down('KeyD');
            const up = input.down('ArrowUp') || input.down('KeyW'), down = input.down('ArrowDown') || input.down('KeyS');
            const turn = (0.045 + 0.02 * (1 - this.speed / this.maxSpeed)) * k;
            if (left) this.angle -= turn; if (right) this.angle += turn;
            if (up) this.speed = Math.min(this.maxSpeed, this.speed + 0.22 * k); else if (down) this.speed = Math.max(0, this.speed - 0.5 * k); else this.speed = Math.max(0, this.speed - 0.06 * k);
            if (this.speed < 3.2 && !down) this.speed = Math.max(this.speed, up ? this.speed : 0);
            p.x += Math.cos(this.angle) * this.speed * k; p.y += Math.sin(this.angle) * this.speed * k;
            p.angle = this.angle; p.f = Math.cos(this.angle) >= 0 ? 1 : -1; p.moving = this.speed > 0.5;
            const hitW = p.x < 30 || p.y < 30 || p.x > bounds.w - 30 || p.y > bounds.h - 30;
            p.x = U.clamp(p.x, 30, bounds.w - 30); p.y = U.clamp(p.y, 30, bounds.h - 30);
            if (hitW) this.speed *= (p.skills.pid ? 0.85 : 0.6);
            p.cycleDist += this.speed * k;
            if (Math.hypot(p.x - this.last.x, p.y - this.last.y) > 11) {
                this.trail.push({ x: p.x - Math.cos(this.angle) * 24, y: p.y - Math.sin(this.angle) * 24 }); this.last = { x: p.x, y: p.y };
                if (this.trail.length > 64) this.trail.shift();
            }
            if (this.speed > 2 && game) {
                const cc = this.fire ? (Math.random() < 0.5 ? '#FF7A1A' : '#FFD040') : TG.trailColor(p, this.t, 0);
                game.particles.emit(p.x - Math.cos(this.angle) * 30, p.y - Math.sin(this.angle) * 30, cc, 1, 1.4, { angle: this.angle + Math.PI, spread: 0.7 });
            }
        }
    }
    TG.LightCycle = LightCycle;

    class SolarSailer {
        constructor(p) { this.p = p; this.angle = p.angle || 0; this.speed = 0; this.t = 0; this.maxSpeed = 11 * p.speedMultiplier; this.trail = []; }
        update(dt, input, bounds, game) {
            const p = this.p, k = dt * 60; this.t += dt;
            const left = input.down('ArrowLeft') || input.down('KeyA'), right = input.down('ArrowRight') || input.down('KeyD');
            const up = input.down('ArrowUp') || input.down('KeyW'), down = input.down('ArrowDown') || input.down('KeyS');
            if (left) this.angle -= 0.03 * k; if (right) this.angle += 0.03 * k;
            if (up) this.speed = Math.min(this.maxSpeed, this.speed + 0.1 * k); else if (down) this.speed = Math.max(0, this.speed - 0.25 * k); else this.speed *= 0.992;
            p.x += Math.cos(this.angle) * this.speed * k; p.y += Math.sin(this.angle) * this.speed * k;
            p.angle = this.angle; p.f = Math.cos(this.angle) >= 0 ? 1 : -1; p.moving = this.speed > 0.3;
            p.x = U.clamp(p.x, 40, bounds.w - 40); p.y = U.clamp(p.y, 40, bounds.h - 40);
            if (this.speed > 1.5 && game) game.particles.emit(p.x - Math.cos(this.angle) * 40, p.y - Math.sin(this.angle) * 40, p.color, 1, 1, { angle: this.angle + Math.PI, spread: 0.9 });
        }
    }
    TG.SolarSailer = SolarSailer;

})(window.TG = window.TG || {});
