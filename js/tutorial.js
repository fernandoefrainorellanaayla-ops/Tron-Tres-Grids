/* ==========================================================================
   TRON: LAS TRES GRIDS — tutorial.js
   ENTRENAMIENTO. Tras personalizar el programa, Julian Dillinger lo "programa"
   y lo pone a combatir para entrenarlo, como hace con Ares en Tron: Ares.
   Cada módulo que Julian carga enseña un control real del juego:
   movimiento · disco · combate · ciclo de luz · diálogo (E) · misiones (Q) · atlas (M).
   Ocurre en el Campo de Entrenamiento de la Grid de Dillinger (2025).
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;
    const RADIUS = 820;   // límite de la zona de entrenamiento

    class Tutorial {
        constructor(g) {
            this.g = g; this.active = false; this.running = false; this.i = -1; this.flags = {};
            this.rings = []; this.target = null; this.doneT = 0; this.tc = 0; this.ts = 0; this.fullCode = ''; this.fullSay = ''; this.idle = 0; this.warnT = 0;
            this.el = { panel: document.getElementById('julian-panel'), code: document.getElementById('jp-code'), say: document.getElementById('jp-say'), prog: document.getElementById('jp-progress'),
                step: document.getElementById('jp-step'), skip: document.getElementById('jp-skip'), go: document.getElementById('jp-go') };
            this.el.skip.addEventListener('click', () => this.g.finishTutorial(true));
            this.el.go.addEventListener('click', () => { this.flags.go = true; });
            this.steps = this.makeSteps();
        }
        get center() { return TG.locById.ares_training; }
        arm() { this.active = true; this.running = false; }                  // activa las restricciones del entrenamiento
        begin() {
            const p = this.g.player; this.running = true; this.i = -1; this.flags = {}; this.start = { x: p.x, y: p.y };
            this.el.panel.classList.remove('hidden'); this.el.go.classList.add('hidden'); this.next();
        }
        hide() { this.running = false; this.el.panel.classList.add('hidden'); this.target = null; this.rings = []; }
        // tras morir y reaparecer, el respawn limpia a los enemigos: se vuelve a preparar el paso actual
        resetStep() { if (!this.running) return; const st = this.steps[this.i]; if (st && !st.final) { this.flags.kills = 0; st.setup(); } }
        stop() { this.hide(); this.active = false; this.g.combat.enemies = this.g.combat.enemies.filter(e => e.tag !== 'tut'); }

        // ---------------------------------------------------------------- pasos
        makeSteps() {
            const g = this.g, C = () => this.center, nm = () => g.player.name;
            const formName = () => (G.FORMS.find(f => f.id === g.player.form) || { name: 'Humanoide' }).name.toLowerCase();
            return [
                { code: () => `ares = crear_programa("${nm()}", forma="${formName()}")`,
                  say: () => `Programa ${nm()}, soy Julian Dillinger. Voy a entrenarte hasta que seas el mejor programa de mi Grid. Arriba a la izquierda están tu VIDA y tus BITS; a la derecha, el minimapa. Primero, muévete: usa W A S D hasta la baliza luminosa.`,
                  keys: 'W A S D', setup: () => { this.target = () => ({ x: this.start.x + 380, y: this.start.y - 40, label: 'BALIZA' }); },
                  check: () => { const t = this.target(); return Math.hypot(g.player.x - t.x, g.player.y - t.y) < 62; } },
                { code: () => 'ares.cargar_modulo("disco_de_identidad")',
                  say: () => 'Tu disco es tu arma. Apunta con el ratón y pulsa clic izquierdo o ESPACIO: el disco vuelve solo a tu mano. Destruye las 3 dianas.',
                  keys: 'CLIC / ESPACIO', setup: () => { this.flags.kills = 0; const c = C(); [[-330, -90], [330, -60], [20, -340]].forEach(([dx, dy]) => g.combat.spawn(TG.makeEnemy('dummy', '2025', c.x + dx, c.y + dy, { tag: 'tut' })));
                      this.target = () => { const d = g.combat.enemies.filter(e => e.kind === 'dummy' && e.isAlive).sort((a, b) => Math.hypot(a.x - g.player.x, a.y - g.player.y) - Math.hypot(b.x - g.player.x, b.y - g.player.y))[0]; return d ? { x: d.x, y: d.y - 20, label: 'DIANA' } : null; }; },
                  progress: () => `Dianas destruidas: ${this.flags.kills || 0}/3`, check: () => (this.flags.kills || 0) >= 3 },
                { code: () => 'ares.simular_combate(enemigo="soldado_dillinger")',
                  say: () => 'Un soldado de entrenamiento va por ti. Muévete para esquivar, lanza tu disco y vigila tu barra de VIDA. Si caes, regresas aquí sin perder nada.',
                  keys: 'WASD + CLIC', setup: () => { const c = C(); this.target = null; g.combat.spawn(TG.makeEnemy('guard', '2025', c.x + 420, c.y + 260, { tag: 'tut', noDespawn: true, hp: 48, dmg: 5, aggro: 2000, reward: 0, name: 'Soldado de Entrenamiento' })); },
                  progress: () => 'Derrota al soldado', check: () => !!this.flags.soldier },
                { code: () => 'ares.cargar_modulo("ciclo_de_luz")',
                  say: () => 'En la Grid se viaja en ciclos de luz. Pulsa V para montar. Con ← → giras, con ↑ aceleras y con ↓ frenas (también sirven W A S D).',
                  keys: 'V', setup: () => { this.target = null; }, progress: () => 'Pulsa V para montar', check: () => g.player.mode === 'cycle' },
                { code: () => 'ares.entrenar("maniobras", aros=3)',
                  say: () => 'Cruza los 3 aros de luz con el ciclo. Deja un muro de luz a su paso: en las batallas de ciclos de las arenas, ¡no toques los muros!',
                  keys: '← → ↑ ↓', setup: () => { const c = C(); this.rings = [[-330, 250], [-330, -240], [330, -240]].map(([dx, dy], i) => ({ x: c.x + dx, y: c.y + dy, n: i + 1, passed: false }));
                      this.target = () => { const r = this.rings.find(q => !q.passed); return r ? { x: r.x, y: r.y - 30, label: 'ARO ' + r.n } : null; }; },
                  progress: () => `Aros cruzados: ${this.rings.filter(r => r.passed).length}/3`, check: () => this.rings.length && this.rings.every(r => r.passed) },
                { code: () => 'ares.desmontar()', say: () => 'Pulsa V otra vez para bajar del ciclo.', keys: 'V', setup: () => { this.target = null; this.rings = []; },
                  progress: () => 'Pulsa V para bajar', check: () => g.player.mode === 'foot' },
                { code: () => 'ares.cargar_modulo("comunicacion")',
                  say: () => 'Los programas hablan. Acércate a Athena y pulsa E: puedes escribirle lo que quieras (responde con IA si el servidor está conectado). Cierra con Esc. Con E también entras a edificios y cruzas portales hacia otras Grids.',
                  keys: 'E', setup: () => { this.target = () => { const n = g.npcs.find(q => q.id === 'athena_2025'); return n ? { x: n.x, y: n.y - 20, label: 'ATHENA' } : null; }; },
                  progress: () => this.flags.talked ? 'Cierra la conversación con Esc' : 'Habla con Athena (E)', check: () => this.flags.talked && !TG.state.modalOpen },
                { code: () => 'ares.cargar_modulo("misiones")',
                  say: () => 'Tus misiones están en el diario: pulsa Q. Los programas con un ! sobre la cabeza tienen algo para ti. Cierra con Esc.',
                  keys: 'Q', setup: () => { this.target = null; }, progress: () => this.flags.quests ? 'Cierra con Esc' : 'Pulsa Q', check: () => this.flags.quests && !TG.state.modalOpen },
                { code: () => 'ares.cargar_modulo("atlas")',
                  say: () => 'El Atlas guarda los lugares y programas que descubras en las tres Grids. Ábrelo con M y ciérralo con Esc.',
                  keys: 'M', setup: () => { this.target = null; }, progress: () => this.flags.atlas ? 'Cierra con Esc' : 'Pulsa M', check: () => this.flags.atlas && !TG.state.modalOpen },
                { code: () => 'ares.evaluar()   // rendimiento: 100%',
                  say: () => `Evaluación completada. Eres el mejor programa que he creado, ${nm()}. Te envío a la Grid: hay tres, programas secretos y mucho por descubrir. No me decepciones.`,
                  keys: '', final: true, setup: () => { this.target = null; this.el.go.classList.remove('hidden'); this.idle = 0; }, progress: () => '', check: () => this.flags.go || this.idle > 16 }
            ];
        }
        next() {
            this.i++; this.doneT = 0;
            if (this.i >= this.steps.length) { this.g.finishTutorial(false); return; }
            const st = this.steps[this.i]; this.flags.done = false; this.flags.soldier = false;
            st.setup(); this.fullCode = st.code(); this.fullSay = st.say(); this.tc = 0; this.ts = 0;
            this.el.step.textContent = `ENTRENAMIENTO ${this.i + 1}/${this.steps.length}`; this.el.panel.classList.remove('ok');
            this.el.code.textContent = ''; this.el.say.textContent = ''; this.el.prog.textContent = '';
            if (this.i > 0) { TG.sound.digitize(0.5); const p = this.g.player; this.g.particles.ring(p.x, p.y, '#FF1744', 110); }
        }
        event(type, d) {
            if (!this.running) return;
            const st = this.steps[this.i]; if (!st) return;
            if (type === 'kill') { if (d.kind === 'dummy') this.flags.kills = (this.flags.kills || 0) + 1; else if (d.tag === 'tut') this.flags.soldier = true; }
            else if (type === 'talk' && d === 'athena_2025') this.flags.talked = true;
            else if (type === 'quests') this.flags.quests = true;
            else if (type === 'atlas') this.flags.atlas = true;
        }
        // ---------------------------------------------------------------- bucle
        update(dt) {
            if (!this.active) return;
            const g = this.g, p = g.player, c = this.center;
            // límite de la zona de entrenamiento
            const d = Math.hypot(p.x - c.x, p.y - c.y);
            if (d > RADIUS) { p.x = c.x + (p.x - c.x) / d * RADIUS; p.y = c.y + (p.y - c.y) / d * RADIUS; if (g.activeVehicle) g.activeVehicle.speed *= 0.5; this.warnT -= dt; if (this.warnT <= 0) { this.warnT = 4; TG.Toast.show('Límite de la zona de entrenamiento', 'warn', 2000); } }
            if (!this.running) return;
            const st = this.steps[this.i]; if (!st) return;
            // Julian "escribe": primero la línea de código, luego la instrucción
            if (this.tc < this.fullCode.length) { this.tc = Math.min(this.fullCode.length, this.tc + dt * 70); this.el.code.textContent = this.fullCode.slice(0, Math.floor(this.tc)); }
            else if (this.ts < this.fullSay.length) { this.ts = Math.min(this.fullSay.length, this.ts + dt * 120); this.el.say.textContent = this.fullSay.slice(0, Math.floor(this.ts)); }
            else if (st.progress) this.el.prog.textContent = st.progress();
            if (st.final) this.idle += dt;
            // anillos del ciclo
            if (this.rings.length && p.mode === 'cycle') for (const r of this.rings) if (!r.passed && Math.hypot(p.x - r.x, p.y - r.y) < 74) { r.passed = true; TG.sound.reward(); g.particles.ring(r.x, r.y, '#7DFF9B', 120); g.combat.floater(r.x, r.y - 70, 'ARO ' + r.n, '#7DFF9B'); }
            if (this.doneT > 0) { this.doneT -= dt; if (this.doneT <= 0) this.next(); return; }
            if (this.tc >= this.fullCode.length && this.ts >= this.fullSay.length - 1 && st.check()) {
                this.doneT = st.final ? 0.2 : 1.1; this.el.panel.classList.add('ok'); if (!st.final) { this.el.prog.textContent = '✔ MÓDULO COMPLETADO'; this.el.code.textContent += '   // [ok]'; TG.sound.reward(); }
            }
        }
        // ---------------------------------------------------------------- dibujo
        renderWorld(ctx, cam, t) {
            if (!this.active) return;
            const c = this.center, th = G.THEME['2025'];
            // frontera de la zona
            ctx.save(); ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.arc(c.x - cam.ox, c.y - cam.oy, RADIUS, 0, Math.PI * 2); ctx.strokeStyle = U.rgba('#FF1744', 0.32); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
            // aros de luz
            for (const r of this.rings) {
                const x = r.x - cam.ox, y = r.y - cam.oy, col = r.passed ? '#7DFF9B' : '#FFD84A';
                ctx.beginPath(); ctx.ellipse(x, y + 4, 40, 13, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.6, 0.6);
                for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y - 42, 18 - i * 4, 58 - i * 6, 0, 0, Math.PI * 2); G.stroke(ctx, i === 1 ? '#fff' : col, 2.2, 0.9); }
                G.glow(ctx, x, y - 42, 80, col, r.passed ? 0.2 : 0.35 + 0.15 * Math.sin(t * 5));
                ctx.font = 'bold 12px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(String(r.n), x, y - 108);
            }
            // marcador del objetivo + flecha si está fuera de pantalla
            const tg = this.target && this.target(); if (!tg) return;
            const x = tg.x - cam.ox, y = tg.y - cam.oy, col = '#FFD84A';
            if (x > 30 && y > 30 && x < cam.w - 30 && y < cam.h - 30) {
                ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g2 = ctx.createLinearGradient(0, y + 30, 0, y - 260); g2.addColorStop(0, U.rgba(col, 0.55)); g2.addColorStop(1, U.rgba(col, 0)); ctx.fillStyle = g2; ctx.fillRect(x - 5, y - 260, 10, 290); ctx.restore();
                const pr = (t * 1.4) % 1; ctx.beginPath(); ctx.ellipse(x, y + 28, 20 + pr * 30, (20 + pr * 30) * 0.4, 0, 0, Math.PI * 2); G.stroke(ctx, col, 2, 1 - pr);
                ctx.font = '11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText('▼ ' + tg.label, x, y - 30 + Math.sin(t * 4) * 3);
            } else {
                const ang = Math.atan2(y - cam.h / 2, x - cam.w / 2), m = 60, ex = U.clamp(cam.w / 2 + Math.cos(ang) * cam.w, m, cam.w - m), ey = U.clamp(cam.h / 2 + Math.sin(ang) * cam.h, m + 80, cam.h - m);
                ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill(); G.stroke(ctx, col, 2, 1); ctx.restore();
                ctx.font = '11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(tg.label, ex, ey + 28);
            }
        }
    }
    TG.Tutorial = Tutorial;

})(window.TG = window.TG || {});
