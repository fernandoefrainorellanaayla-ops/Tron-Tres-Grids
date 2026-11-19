/* TRON — abilities.js: SHIFT Esquiva (Tron) · Y Reescritura (Flynn) · F Jaula de Faraday (Mr. E) · H Inyección de Script (Carlos)
   Pasivas: Protocolo de Seguridad (Tron), Control PID (Mr. R). P = DISCO DE SALTO de Flynn (3 cargas). */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;
    const DEFS = [{ id: 'dash', skill: 'dash', key: 'SHIFT', icon: '🌀', name: 'Esquiva Táctica', cd: 3 }, { id: 'rewrite', skill: 'rewrite', key: 'Y', icon: '✍', name: 'Reescritura', cd: 30 }, { id: 'faraday', skill: 'faraday', key: 'F', icon: '🔌', name: 'Jaula de Faraday', cd: 24 }, { id: 'code', skill: 'codeMastery', key: 'H', icon: '💻', name: 'Inyección de Script', cd: 10 }];
    TG.PORTAL_MAX = 3; const PORTAL_RECHARGE = 75, PORTAL_CD = 8;
    class Abilities {
        constructor(g) { this.g = g; this.cd = { dash: 0, rewrite: 0, faraday: 0, code: 0 }; this.dashT = 0; this.dashV = { x: 0, y: 0 }; this.faradayT = 0; this.farTick = 0; this.shPrev = false; this.virusT = 0; this.lastBar = ''; this.charges = TG.PORTAL_MAX; this.rechargeT = 0; this.portalCd = 0; this.visited = new Set(['1982']); document.getElementById('portal-close').addEventListener('click', () => TG.Modals.close('portal-modal')); }
        has(skill) { return !!this.g.player.skills[skill]; }
        use(id) {
            const g = this.g, p = g.player; if (g.state !== 'play' || g.transition || p.dead || g.paused || p.mode !== 'foot' || g.battle.active) return;
            const d = DEFS.find(x => x.id === id); if (!d || !this.has(d.skill) || this.cd[id] > 0) return;
            if (id === 'dash') { const v = g.input.moveVec, dx = v.x || p.f, dy = v.x || v.y ? v.y : 0, mm = Math.hypot(dx, dy) || 1; this.dashV = { x: dx / mm * 1550, y: dy / mm * 1550 }; this.dashT = 0.16; p.invuln = Math.max(p.invuln, 0.45); TG.sound.throwDisc(); g.particles.voxels(p.x, p.y - 20, p.color, 14, 3); }
            else if (id === 'rewrite') { let best = null, bd = 430; for (const e of g.combat.enemies) { if (!e.isAlive || e.ally || e.boss || e.kind === 'dummy') continue; const dd = Math.hypot(e.x - p.x, e.y - p.y); if (dd < bd) { bd = dd; best = e; } } if (!best) { TG.Toast.show('No hay un enemigo al alcance para reescribir.', 'warn', 2000); return; } best.ally = true; best.allyT = 12; best.color = p.color; g.particles.ring(best.x, best.y, '#FFFFFF', 100); g.combat.floater(best.x, best.y - 70, 'REESCRITO', '#FFFFFF'); TG.sound.zap(); }
            else if (id === 'faraday') { this.faradayT = 6; this.farTick = 0; g.particles.ring(p.x, p.y, '#FFE45C', 240); TG.sound.charge(); g.camera.shake(6); }
            else if (id === 'code') { let best = null, bd = 540; for (const e of g.combat.enemies) { if (!e.isAlive || e.ally || e.kind === 'dummy') continue; const dd = Math.hypot(e.x - p.x, e.y - p.y); if (dd < bd) { bd = dd; best = e; } } if (!best) { TG.Toast.show('Sin objetivo para inyectar el script.', 'warn', 2000); return; } best.virus = 6; g.combat.floater(best.x, best.y - 70, '</> VIRUS', '#6AFFB0'); g.combat.arcs.push({ x1: p.x, y1: p.y - 24, x2: best.x, y2: best.y - 24, life: 0.3 }); TG.sound.zap(); }
            this.cd[id] = d.cd; this.lastBar = '';
        }
        update(dt) {
            const g = this.g, p = g.player, inp = g.input;
            for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt); this.portalCd = Math.max(0, this.portalCd - dt);
            if (this.charges < TG.PORTAL_MAX) { this.rechargeT += dt; if (this.rechargeT >= PORTAL_RECHARGE) { this.rechargeT = 0; this.charges++; this.lastBar = ''; TG.Toast.show('🌀 Disco de Salto: carga recuperada', 'good', 2000); } }
            const sh = inp.down('ShiftLeft') || inp.down('ShiftRight'); if (sh && !this.shPrev) this.use('dash'); this.shPrev = sh;
            if (this.dashT > 0) { this.dashT -= dt; const b = g.currentBounds(); p.x = U.clamp(p.x + this.dashV.x * dt, 24, b.w - 24); p.y = U.clamp(p.y + this.dashV.y * dt, 40, b.h - 24); if (Math.random() < 0.7) g.particles.emit(p.x, p.y - 18, p.color, 1, 1.5, { decay: 0.06 }); }
            if (this.faradayT > 0) { this.faradayT -= dt; this.farTick -= dt; if (this.farTick <= 0) { this.farTick = 0.5; for (const e of g.combat.enemies) if (e.isAlive && !e.ally && Math.hypot(e.x - p.x, e.y - p.y) < 240) { e.hit(14 * p.damageMultiplier, g, { stun: 0.4 }); g.combat.arcs.push({ x1: p.x, y1: p.y - 26, x2: e.x, y2: e.y - 24, life: 0.22 }); } TG.sound.zap(); } }
            p.faraday = this.faradayT > 0; this.virusT -= dt;
            if (this.virusT <= 0) { this.virusT = 1; for (const e of g.combat.enemies) if (e.isAlive && e.virus > 0) { e.virus--; e.hit(8 * p.damageMultiplier, g, {}); g.particles.emit(e.x, e.y - 24, '#6AFFB0', 4, 2); for (const o of g.combat.enemies) if (o !== e && o.isAlive && !o.ally && !(o.virus > 0) && Math.hypot(o.x - e.x, o.y - e.y) < 170) { o.virus = 4; g.combat.arcs.push({ x1: e.x, y1: e.y - 24, x2: o.x, y2: o.y - 24, life: 0.2 }); } } }
            if (p.skills.tronGuard && !p.dead && p.health < p.maxHealth * 0.4) p.health = Math.min(p.maxHealth, p.health + dt * 1.5);
            if (p.skills.pid && !p.dead) { p.health = Math.min(p.maxHealth, p.health + dt * 0.025 * (p.maxHealth - p.health)); if (p.dmgBuf > 0) { const take = Math.min(p.dmgBuf, p.dmgRate * dt); p.dmgBuf -= take; p.health -= take; if (p.health <= 0 && !p.dead) { p.health = 0; p.dead = true; g.onPlayerDeath(); } } }
            this.refreshBar();
        }
        openPortal() {
            const g = this.g; if (g.state !== 'play' || g.transition) return;
            if (!this.has('portalDisc')) { TG.Toast.show('Aún no tienes el Disco de Salto (misión «El Exilio de Flynn»).', 'warn', 3000); return; }
            if (g.tutorial.active || g.battle.active || g.duel.active) { TG.Toast.show('No puedes usar el Disco de Salto en pleno combate o actividad.', 'warn', 2800); return; }
            if (g.player.interior) { TG.Toast.show('Sal al exterior para usar el Disco de Salto.', 'warn', 2400); return; }
            this.renderPortal(); TG.Modals.open('portal-modal');
        }
        renderPortal() {
            const g = this.g, box = document.getElementById('portal-list'); box.innerHTML = ''; document.getElementById('portal-charges').textContent = `Cargas: ${this.charges}/${TG.PORTAL_MAX}` + (this.charges < TG.PORTAL_MAX ? ` · próxima en ${Math.ceil(PORTAL_RECHARGE - this.rechargeT)} s` : '');
            for (const era of TG.WORLD_ORDER) { if (era === g.era) continue; const known = this.visited.has(era), b = document.createElement('button'); b.className = 'tron-button'; b.style.setProperty('--theme-primary', TG.GRIDS[era].color); b.innerHTML = `${U.esc(TG.ERA_NAME[era])}<small>${known ? (TG.GRIDS[era].rw ? 'Mundo real' : 'Grid') : 'Aún no visitado: búscalo por un portal'}</small>`; b.disabled = !known || this.charges <= 0 || this.portalCd > 0; b.addEventListener('click', () => this.usePortal(era)); box.appendChild(b); }
        }
        usePortal(era) { const g = this.g; if (this.charges <= 0 || this.portalCd > 0 || g.transition) return; this.charges--; this.portalCd = PORTAL_CD; this.lastBar = ''; TG.Modals.close('portal-modal'); g.switchGrid(era, true); }
        refreshBar() {
            const p = this.g.player, box = document.getElementById('ability-bar'); if (!box) return;
            const sig = DEFS.map(d => this.has(d.skill) ? Math.ceil(this.cd[d.id]) : -1).join(',') + '|' + this.charges + '|' + (this.has('portalDisc') ? 1 : 0) + '|' + (p.skills.pid ? 1 : 0) + (p.skills.tronGuard ? 1 : 0); if (sig === this.lastBar) return; this.lastBar = sig; box.innerHTML = '';
            const add = (icon, key, cd, title, extra) => { const d = document.createElement('div'); d.className = 'ab' + (cd > 0 ? ' cd' : ''); d.title = title; d.innerHTML = `<kbd>${key}</kbd><i>${icon}</i>${cd > 0 ? `<b>${Math.ceil(cd)}</b>` : (extra ? `<b class="x">${extra}</b>` : '')}`; box.appendChild(d); };
            for (const d of DEFS) if (this.has(d.skill)) add(d.icon, d.key, this.cd[d.id], d.name); if (this.has('portalDisc')) add('🌀', 'P', this.portalCd, 'Disco de Salto', this.charges + '/' + TG.PORTAL_MAX); if (p.skills.pid) add('⚙', 'PID', 0, 'Control PID (pasiva)'); if (p.skills.tronGuard) add('🛡', 'TRON', 0, 'Protocolo de Seguridad (pasiva)');
        }
        render(ctx, cam, t) { const p = this.g.player; if (this.faradayT <= 0 || p.dead) return; const x = p.x - cam.ox, y = p.y - cam.oy - 20, a = Math.min(1, this.faradayT); ctx.save(); ctx.globalAlpha = a; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y, 52 + i * 8, 64 + i * 8, t * (i % 2 ? 1 : -1) * 0.8, 0, Math.PI * 1.6); G.stroke(ctx, '#FFE45C', 1.8, 0.85); } G.glow(ctx, x, y, 90, '#FFE45C', 0.18); ctx.restore(); }
        serialize() { return { charges: this.charges, visited: [...this.visited] }; }
        restore(d) { if (!d) return; this.charges = d.charges == null ? TG.PORTAL_MAX : d.charges; this.visited = new Set(d.visited || ['1982']); }
    }
    TG.Abilities = Abilities;
    Object.assign(TG.REWARD_FX, { dash: p => { p.skills.dash = true; }, tronGuard: p => { p.skills.tronGuard = true; p.resistanceMultiplier *= 1.1; }, rewrite: p => { p.skills.rewrite = true; }, portalDisc: p => { p.skills.portalDisc = true; }, codeMastery: p => { p.skills.codeMastery = true; }, faraday: p => { p.skills.faraday = true; }, pid: p => { p.skills.pid = true; } });
})(window.TG = window.TG || {});
