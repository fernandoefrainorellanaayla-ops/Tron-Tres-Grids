/* TRON — missions.js: collect · defend · boss · escort · hackterms · valves · ecoils · eprobes · process (con `timer` opcional). */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;
    TG.NEW_STEP_TYPES = ['collect', 'defend', 'boss', 'escort', 'hackterms', 'valves', 'ecoils', 'eprobes', 'process'];
    const ROOM = { hackterms: 'carlos_compile_room', valves: 'process_control_room', ecoils: 'transformer_hall', eprobes: 'transformer_hall' };
    class Missions {
        constructor(g) {
            this.g = g; this.props = []; this.cur = null; this.warnT = 0; this.proc = null;
            document.getElementById('process-close').addEventListener('click', () => this.closeProcess(false));
            document.getElementById('proc-valve').addEventListener('input', (e) => { if (this.proc) this.proc.valve = +e.target.value; });
        }
        area() { return this.g.player.interior ? this.g.player.interior.id : null; }
        reset() { this.props = []; this.cur = null; this.g.combat.enemies = this.g.combat.enemies.filter(e => !['def', 'boss', 'hprobe', 'eprobe'].includes(e.tag)); this.g.companions.dropTemp(); }
        activate(q, s, st) {
            const g = this.g; this.props = this.props.filter(p => p.qid !== q.id); g.companions.dropTemp();
            const c = this.cur = { qid: q.id, type: s.type, s, t: 0, n: 0 };
            if (s.type === 'collect') { const l = TG.locById[s.loc]; for (let i = 0; i < s.n; i++) { const a = (i / s.n) * Math.PI * 2 + 0.4, d = l.r + 160 + (i % 3) * 120; this.props.push({ qid: q.id, kind: 'shard', era: l.era, area: null, x: l.x + Math.cos(a) * d, y: l.y + Math.sin(a) * d * 0.85, r: 34 }); } }
            else if (s.type === 'defend') { c.loc = TG.locById[s.loc]; c.waveT = 4; }
            else if (s.type === 'boss') { c.spawned = false; }
            else if (s.type === 'escort') { c.from = TG.locById[s.from]; c.to = TG.locById[s.to]; }
            else if (s.type === 'hackterms') { c.hold = [0, 0, 0]; [[205, 190], [895, 190], [205, 510]].forEach(([x, y], i) => this.props.push({ qid: q.id, kind: 'term', area: ROOM.hackterms, x, y, r: 70, i })); }
            else if (s.type === 'valves') { const seq = [1, 2, 3, 4].sort(() => Math.random() - 0.5); c.seq = seq; c.idx = 0; st.note = 'Orden: ' + seq.join(' → '); [[200, 330], [420, 620], [700, 620], [900, 330]].forEach(([x, y], i) => this.props.push({ qid: q.id, kind: 'valve', area: ROOM.valves, x, y, r: 60, i: i + 1, done: false })); }
            else if (s.type === 'ecoils') { c.next = 0; [[130, 200], [970, 200], [130, 560]].forEach(([x, y], i) => this.props.push({ qid: q.id, kind: 'coil', area: ROOM.ecoils, x, y, r: 55, i, lit: false })); }
            this.onAreaChange();
        }
        restart() { const c = this.cur; if (!c) return; const q = TG.QUESTS[c.qid], st = this.g.quests.active.get(c.qid); if (q && st && q.steps[st.step]) this.activate(q, q.steps[st.step], st); }
        onAreaChange() {
            const g = this.g, c = this.cur; if (!c || !ROOM[c.type] || this.area() !== ROOM[c.type]) return;
            const tag = c.type === 'eprobes' ? 'eprobe' : 'hprobe', want = c.type === 'eprobes' ? c.s.n - c.n : (c.type === 'hackterms' ? 3 : 0), have = g.combat.enemies.filter(e => e.tag === tag && e.isAlive).length;
            for (let i = have; i < want; i++) g.combat.spawn(TG.makeEnemy('probe', g.era, 160 + Math.random() * 780, 180 + Math.random() * 360, { tag, noDespawn: true, name: c.type === 'eprobes' ? 'Sonda de Sobrecarga' : 'Sonda Centinela' }));
        }
        done(type) { if (this.cur && this.cur.type === type) { const t = this.cur; this.cur = null; this.props = this.props.filter(p => p.qid !== t.qid); this.g.quests.event('stepdone', { type }); } }
        note(txt) { const st = this.cur && this.g.quests.active.get(this.cur.qid); if (st && st.note !== txt) { st.note = txt; this.g.quests.refresh(); } }
        onKill(e) { const c = this.cur; if (c && c.type === 'eprobes' && e.tag === 'eprobe') { c.n++; this.note(`${c.n}/${c.s.n}`); if (c.n >= c.s.n) this.done('eprobes'); } }
        discHit(d) {
            const c = this.cur; if (!c || c.type !== 'ecoils' || this.area() !== ROOM.ecoils) return;
            for (const p of this.props) {
                if (p.kind !== 'coil' || Math.hypot(d.x - p.x, d.y - p.y) > p.r + 10) continue; const key = 'c' + p.i; if (d.hit.has(key)) continue; d.hit.add(key);
                if (p.i === c.next) { p.lit = true; c.next++; TG.sound.zap(); this.g.particles.emit(p.x, p.y - 40, '#FFE45C', 16, 4); this.note(`${c.next}/3`); if (c.next >= 3) this.done('ecoils'); }
                else { for (const q of this.props) q.lit = false; c.next = 0; TG.sound.damage(); TG.Toast.show('Orden incorrecto: el circuito se reinicia.', 'warn', 2200); this.note('0/3'); }
            }
        }
        tryInteract() {
            const c = this.cur, p = this.g.player; if (!c || c.type !== 'valves' || this.area() !== ROOM.valves) return false;
            const v = this.props.filter(q => q.kind === 'valve').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; if (!v || Math.hypot(v.x - p.x, v.y - p.y) > v.r + 30) return false;
            if (v.i === c.seq[c.idx]) { v.done = true; c.idx++; TG.sound.accept(); this.g.particles.ring(v.x, v.y, '#FFB347', 80); this.note(`Orden: ${c.seq.join(' → ')} · ${c.idx}/4`); if (c.idx >= 4) this.done('valves'); }
            else { c.idx = 0; this.props.forEach(q => { if (q.kind === 'valve') q.done = false; }); TG.sound.damage(); p.takeDamage(10, this.g); TG.Toast.show('¡Válvula equivocada! Se reinicia la secuencia.', 'warn', 2200); this.note(`Orden: ${c.seq.join(' → ')} · 0/4`); }
            return true;
        }
        hasValvePrompt() { const c = this.cur; if (!c || c.type !== 'valves' || this.area() !== ROOM.valves) return null; const p = this.g.player, v = this.props.find(q => q.kind === 'valve' && Math.hypot(q.x - p.x, q.y - p.y) < q.r + 30); return v ? `[E] Accionar válvula ${v.i}` : null; }
        update(dt) {
            const g = this.g, p = g.player, c = this.cur; if (!c) return; const era = g.era;
            if (c.type === 'collect') {
                for (const pr of this.props) if (pr.kind === 'shard' && pr.era === era && !p.interior && Math.hypot(p.x - pr.x, p.y - pr.y) < pr.r) { pr.gone = true; c.n++; TG.sound.pickup(); g.particles.ring(pr.x, pr.y, '#7DFFFF', 70); this.note(`${c.n}/${c.s.n}`); }
                this.props = this.props.filter(x => !x.gone); if (c.n >= c.s.n) this.done('collect');
            } else if (c.type === 'defend') {
                const l = c.loc; if (era !== l.era || p.interior) { this.note('Vuelve al lugar'); return; }
                if (Math.hypot(p.x - l.x, p.y - l.y) > l.r + 750) { this.warnT -= dt; if (this.warnT <= 0) { this.warnT = 4; TG.Toast.show('¡Vuelve a la zona que defiendes!', 'warn', 2000); } this.note('fuera de la zona'); return; }
                c.t += dt; c.waveT -= dt; this.note(`${Math.floor(c.t)}/${c.s.seconds}s`);
                if (c.waveT <= 0) { c.waveT = 9; const n = 3 + g.difficulty.extra(); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = l.r + 600 + Math.random() * 200; g.combat.spawn(TG.makeEnemy(i % 3 === 2 ? 'ranged' : 'guard', era, l.x + Math.cos(a) * r, l.y + Math.sin(a) * r * 0.8, { tag: 'def', noDespawn: true, aggro: 1800, reward: 8 })); } }
                if (c.t >= c.s.seconds) { g.combat.enemies.filter(e => e.tag === 'def').forEach(e => { e.isAlive = false; g.particles.voxels(e.x, e.y - 20, e.color, 12); }); this.done('defend'); }
            } else if (c.type === 'boss') {
                if (!c.spawned && !p.interior) {
                    c.spawned = true; g.combat.spawn(TG.makeEnemy('brute', era, p.x + 520, p.y - 140, { name: c.s.name, hp: c.s.hp, tag: 'boss', noDespawn: true, aggro: 2500, reward: 120, big: true, boss: true, speed: 1.9 }));
                    for (let i = 0; i < (c.s.minions || 0); i++) { const a = Math.random() * 6.28; g.combat.spawn(TG.makeEnemy(i % 3 === 0 ? 'ranged' : 'guard', era, p.x + Math.cos(a) * 700, p.y + Math.sin(a) * 600, { tag: 'boss', noDespawn: true, aggro: 2500, reward: 10 })); }
                    if (c.s.ally) g.companions.addTemp(c.s.ally, { strong: true }); TG.sound.eventAlert(); TG.Toast.show(c.s.ally ? `¡${c.s.name} ataca! Tron lucha a tu lado.` : `¡${c.s.name} aparece!`, 'warn', 4000);
                }
                if (c.spawned) { const left = g.combat.enemies.filter(e => e.tag === 'boss' && e.isAlive).length; this.note(`enemigos: ${left}`); if (left === 0) { g.companions.dropTemp(); this.done('boss'); } }
            } else if (c.type === 'escort') {
                const f = g.companions.temp.find(a => a.id === c.s.npc);
                if (!f && era === c.from.era && !p.interior) { g.companions.addTemp(c.s.npc, { at: { x: c.from.x + 90, y: c.from.y + c.from.r + 40 }, escort: true }); TG.Toast.show('Tu protegido te sigue. ¡Mantenlo a salvo!', 'info', 3200); }
                else if (f) { if (era === c.to.era && !p.interior) { const d = Math.hypot(f.x - c.to.x, f.y - c.to.y), dp = Math.hypot(p.x - c.to.x, p.y - c.to.y); this.note(`distancia ${Math.round(d)}`); if (d < c.to.r + 140 && dp < c.to.r + 260) { g.companions.dropTemp(); this.done('escort'); } } else this.note('sigue el camino'); }
            } else if (c.type === 'hackterms' && this.area() === ROOM.hackterms) {
                const holding = g.input.down('KeyE'); let any = false;
                for (const t of this.props) if (t.kind === 'term') { const near = Math.hypot(t.x - p.x, t.y - p.y) < t.r; if (near && holding && c.hold[t.i] < 1) { c.hold[t.i] = Math.min(1, c.hold[t.i] + dt / 3); any = true; } t.p = c.hold[t.i]; }
                if (any && Math.random() < 0.1) TG.sound.ui(); const n = c.hold.filter(h => h >= 1).length; this.note(`${n}/3`); if (n >= 3) this.done('hackterms');
            }
        }
        onFail() { const g = this.g, c = this.cur; if (!c) return; this.props = this.props.filter(p => p.qid !== c.qid); g.combat.enemies = g.combat.enemies.filter(e => !['def', 'boss', 'hprobe', 'eprobe'].includes(e.tag)); g.companions.dropTemp(); }
        renderProps(ctx, cam, t, outdoor) {
            const g = this.g, area = this.area();
            for (const p of this.props) {
                if (outdoor ? (p.area !== null || p.era !== g.era) : p.area !== area) continue; const x = p.x - cam.ox, y = p.y - cam.oy; if (x < -80 || y < -120 || x > cam.w + 80 || y > cam.h + 80) continue;
                if (p.kind === 'shard') { G.glow(ctx, x, y - 20, 40, '#7DFFFF', 0.45); ctx.save(); ctx.translate(x, y - 20 + Math.sin(t * 3 + x) * 4); ctx.rotate(t * 1.6); ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath(); G.stroke(ctx, '#BFFFFF', 1.8, 1); ctx.restore(); }
                else if (p.kind === 'term') { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 40, y - 24, 80, 40); ctx.strokeStyle = '#6AFFB0'; ctx.lineWidth = 1.6; ctx.strokeRect(x - 40, y - 24, 80, 40); ctx.beginPath(); ctx.arc(x, y - 4, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.p || 0)); G.stroke(ctx, '#fff', 2.4, 1); ctx.font = '10px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8fff0'; ctx.fillText((p.p || 0) >= 1 ? 'HACKEADA' : 'MANTÉN E', x, y + 34); }
                else if (p.kind === 'valve') { const col = p.done ? '#9DFF9D' : '#FFB347'; ctx.beginPath(); ctx.arc(x, y - 18, 24, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); G.stroke(ctx, col, 2.2, 1); for (let i = 0; i < 4; i++) { const a = t * (p.done ? 0 : 1.2) + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + Math.cos(a) * 20, y - 18 + Math.sin(a) * 20); G.stroke(ctx, col, 1.6, 0.9); } ctx.font = 'bold 14px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText('V' + p.i, x, y + 18); }
                else if (p.kind === 'coil') { const col = p.lit ? '#FFE45C' : '#8a7a2a'; G.glow(ctx, x, y - 34, p.lit ? 70 : 34, col, p.lit ? 0.6 : 0.2); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y - 6 - i * 12, 24, 8, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.8, 0.95); } ctx.font = 'bold 13px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE45C'; ctx.fillText(String(p.i + 1), x, y + 16); }
            }
            const c = this.cur; if (outdoor && c && c.type === 'defend' && c.loc && c.loc.era === g.era) { const lx = c.loc.x - cam.ox, ly = c.loc.y - cam.oy; ctx.beginPath(); ctx.ellipse(lx, ly, c.loc.r + 700, (c.loc.r + 700) * 0.8, 0, 0, Math.PI * 2); ctx.setLineDash([14, 12]); ctx.lineDashOffset = -t * 20; ctx.strokeStyle = 'rgba(255,216,74,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
        }
        guide() {
            const g = this.g, c = this.cur; if (!c) return null;
            if (c.type === 'escort') return TG.locById[c.s.to].era === g.era ? { x: TG.locById[c.s.to].x, y: TG.locById[c.s.to].y, label: 'DESTINO' } : null;
            if (c.type === 'collect') { const p = this.props.find(q => q.kind === 'shard' && q.era === g.era); return p ? { x: p.x, y: p.y - 20, label: 'FRAGMENTO' } : null; }
            if (c.type === 'defend' && c.loc.era === g.era) return { x: c.loc.x, y: c.loc.y, label: 'DEFIENDE' };
            return null;
        }
        // ---- minijuego de control de procesos (Mr. R)
        startProcess() { const sp = 55 + Math.floor(Math.random() * 20); this.proc = { level: 35, sp, valve: 50, qin: 45, ok: 0, t: 0, dist: 6, run: true }; document.getElementById('proc-valve').value = 50; TG.Modals.open('process-modal'); this.procTimer = setInterval(() => this.procStep(0.05), 50); }
        procStep(dt) {
            const p = this.proc; if (!p || !p.run) return; p.t += dt; p.dist -= dt;
            if (p.dist <= 0) { p.dist = 5 + Math.random() * 4; p.qin = U.clamp(p.qin + (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 12), 28, 72); }
            p.level = U.clamp(p.level + (p.qin - p.valve * 0.6) * 0.5 * dt, 0, 100); if (Math.abs(p.level - p.sp) <= 8) p.ok += dt; this.drawProcess();
            if (p.ok >= 12) this.closeProcess(true); else if (p.t >= 55) this.closeProcess(false, true);
        }
        drawProcess() {
            const cv = document.getElementById('proc-canvas'), c = cv.getContext('2d'), p = this.proc, W = cv.width, H = cv.height; if (!p) return;
            c.clearRect(0, 0, W, H); c.fillStyle = '#04080e'; c.fillRect(0, 0, W, H); const tx = 60, tw = 150, ty = 20, th = 250;
            c.strokeStyle = '#FFB347'; c.lineWidth = 2; c.strokeRect(tx, ty, tw, th); const ly = ty + th * (1 - p.level / 100); c.fillStyle = Math.abs(p.level - p.sp) <= 8 ? 'rgba(125,255,155,.55)' : 'rgba(255,179,71,.5)'; c.fillRect(tx + 2, ly, tw - 4, ty + th - ly - 2);
            const sy = ty + th * (1 - p.sp / 100), band = th * 0.08; c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(tx, sy - band, tw, band * 2); c.strokeStyle = '#fff'; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(tx - 12, sy); c.lineTo(tx + tw + 12, sy); c.stroke(); c.setLineDash([]);
            c.fillStyle = '#fff'; c.font = '12px monospace'; c.fillText('CONSIGNA ' + p.sp + '%', tx + tw + 16, sy + 4); c.fillStyle = '#9fe'; c.fillText('NIVEL ' + p.level.toFixed(0) + '%', tx + tw + 16, ly + 4);
            c.fillText('Caudal de entrada: ' + p.qin.toFixed(0), 300, 50); c.fillText('Apertura de válvula: ' + p.valve + '%', 300, 74); c.fillStyle = '#FFD84A'; c.fillText('Tiempo estable: ' + p.ok.toFixed(1) + ' / 12 s', 300, 110); c.fillStyle = '#89a'; c.fillText('Tiempo: ' + p.t.toFixed(0) + ' / 55 s', 300, 134);
            c.fillStyle = '#FFB347'; c.fillRect(300, 160, 160 * (p.valve / 100), 10); c.strokeStyle = '#FFB347'; c.strokeRect(300, 160, 160, 10);
        }
        closeProcess(ok, timeout) {
            clearInterval(this.procTimer); const had = !!this.proc; if (this.proc) this.proc.run = false; this.proc = null; TG.Modals.close('process-modal'); if (!had) return;
            if (ok) { TG.Toast.show('✔ Proceso estabilizado.', 'good'); this.g.quests.event('stepdone', { type: 'process' }); } else if (timeout) TG.Toast.show('El proceso se descontroló. Habla con Mr. R para intentarlo otra vez.', 'warn', 4200);
        }
    }
    TG.Missions = Missions;
})(window.TG = window.TG || {});
