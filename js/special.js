/* ==========================================================================
   TRON: LAS TRES GRIDS — special.js
   · Mr. U  : aparición aleatoria, diálogo y minijuego "La Última Cabalgata"
              (se abre en OTRA VENTANA; si el navegador la bloquea, en un panel).
   · Mr. C  : cámara oculta (Grid 1982). Nodos de equilibrio, pilones, sondas.
              Habilidad: Maestría Electrostática.
   · Mr. L  : observatorio oculto (Grid 2010). Blancos de rebote y problemas.
              Habilidad: Mente Analítica.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;

    let PID = 1;
    const MRU_FIRST_SPAWN = 30;   // segundos hasta que Mr. U aparece por primera vez (igual que en tu versión original)
    TG.MRU_FIRST_SPAWN = MRU_FIRST_SPAWN;
    class Special {
        constructor(g) {
            this.g = g; this.props = [];
            // Mr. U
            this.mrU = { active: false, x: 0, y: 0, era: null, timer: MRU_FIRST_SPAWN, life: 0, gone: false, t: 0 };
            // minijuego
            this.mg = { open: false, win: null, poll: null, wasMuted: false };
            // puzzle
            this.pz = { kind: null, cur: null };
            window.addEventListener('message', (e) => this.onMessage(e));
            // precarga del minijuego para poder jugarlo sin conexión (la página ya está abierta)
            try { fetch('minigames/ghost-ride.html').then(r => r.ok ? r.text() : Promise.reject()).then(t => { TG.mgHtml = t; }).catch(() => {}); } catch (e) { /* sin red: se usará la caché */ }
            document.getElementById('puzzle-quit').addEventListener('click', () => this.closePuzzle());
            document.getElementById('minigame-close').addEventListener('click', () => this.endMinigame(false, 'cerrada'));
        }

        // ================================================================ PROPS DE MISIÓN
        areaId() { return this.g.player.interior ? this.g.player.interior.id : null; }
        clearProps(qid) { this.props = this.props.filter(p => p.qid !== qid); }
        activateStep(q, s, st) {
            this.clearProps(q.id);
            if (s.type === 'cnodes') {
                [[230, 330], [870, 330], [550, 640]].forEach(([x, y], i) => this.props.push({ id: PID++, qid: q.id, area: 'mr_c_chamber', kind: 'node', x, y, r: 48, charge: 0, lit: false, i }));
            } else if (s.type === 'cpylons') {
                [[170, 330], [930, 330], [550, 590]].forEach(([x, y], i) => this.props.push({ id: PID++, qid: q.id, area: 'mr_c_chamber', kind: 'pylon', x, y, r: 30, lit: false, glow: 0 }));
            } else if (s.type === 'cprobes') {
                this.spawnProbes(q, st);
            } else if (s.type === 'bounce') {
                this.nextTarget(q.id, -1);
            }
        }
        spawnProbes(q, st) {
            const g = this.g; if (this.areaId() !== 'mr_c_chamber') return;
            const s = TG.QUESTS[q.id].steps[st.step], need = s.n - st.progress;
            const have = g.combat.enemies.filter(e => e.tag === 'cprobe' && e.isAlive).length;
            for (let i = have; i < need; i++) g.combat.spawn(TG.makeEnemy('probe', '1982', 160 + Math.random() * 780, 180 + Math.random() * 300, { tag: 'cprobe', noDespawn: true }));
        }
        nextTarget(qid, last) {
            const spots = [[180, 230], [920, 230], [160, 600], [940, 600], [550, 100], [300, 120], [800, 120]];
            let i; do { i = Math.floor(Math.random() * spots.length); } while (i === last);
            this.clearProps(qid);
            this.props.push({ id: PID++, qid, area: 'mr_l_observatory', kind: 'target', x: spots[i][0], y: spots[i][1], r: 30, spot: i, flash: 0, warn: 0 });
        }
        onAreaChange() {
            const g = this.g;
            for (const st of g.quests.active.values()) {
                const q = TG.QUESTS[st.id], s = g.quests.stepOf(st);
                if (s && s.type === 'cprobes') this.spawnProbes(q, st);
            }
        }
        onQuestDone(q) { this.clearProps(q.id); if (q.id === 'mru_ride') { this.mrU.active = false; this.mrU.gone = true; } }

        discVsProps(d) {
            const g = this.g, area = this.areaId();
            for (const p of this.props) {
                if (p.area !== area) continue;
                if (Math.hypot(d.x - p.x, d.y - p.y) > p.r + 10) continue;
                if (p.kind === 'pylon' && !p.lit) {
                    p.lit = true; p.glow = 1; TG.sound.zap(); g.camera.shake(4);
                    g.particles.emit(p.x, p.y - 30, '#9DFBFF', 18, 4); g.combat.floater(p.x, p.y - 70, 'CARGADO', '#9DFBFF');
                    g.quests.event('cpylon');
                } else if (p.kind === 'target') {
                    const key = 'p' + p.id;
                    if (d.wasBounced) {
                        if (d.hit.has(key)) continue; d.hit.add(key);
                        TG.sound.reward(); g.particles.voxels(p.x, p.y - 10, '#B9A7FF', 30, 4); g.particles.ring(p.x, p.y, '#B9A7FF', 100);
                        g.combat.floater(p.x, p.y - 50, '¡REBOTE PERFECTO!', '#D9CCFF');
                        const qid = p.qid, last = p.spot; this.props = this.props.filter(x => x !== p);
                        g.quests.event('bounce');
                        if (g.quests.active.has(qid) && g.quests.stepOf(g.quests.active.get(qid)).type === 'bounce') this.nextTarget(qid, last);
                    } else if (!d.hit.has(key)) { d.hit.add(key); p.warn = 1; g.combat.floater(p.x, p.y - 50, 'Necesita rebote', '#FF8A8A'); TG.sound.damage(); }
                }
            }
        }

        // ================================================================ HABILIDADES
        updateAbilities(dt) {
            const g = this.g, p = g.player;
            // Maestría Electrostática: la quietud acumula carga; el movimiento la disipa
            if (p.skills.staticMastery) {
                if (p.mode === 'foot' && !p.moving && !p.dead && g.state === 'play') {
                    const was = p.charge; p.charge = Math.min(1, p.charge + dt / 2.0);
                    if (was < 0.99 && p.charge >= 0.99) { TG.sound.charge(); g.particles.ring(p.x, p.y - 20, '#7DFFFF', 70); g.combat.floater(p.x, p.y - 80, 'CARGA COMPLETA', '#7DFFFF'); }
                } else p.charge = Math.max(0, p.charge - dt * (p.mode === 'foot' ? 0.55 : 1.5));
            } else p.charge = 0;
            // nodos de equilibrio (Mr. C)
            const area = this.areaId();
            const nodes = this.props.filter(x => x.kind === 'node' && x.area === area);
            if (nodes.length) {
                for (const n of nodes) {
                    const inside = Math.hypot(p.x - n.x, p.y - n.y) < n.r;
                    if (!n.lit) {
                        if (inside && !p.moving) { n.charge = Math.min(1, n.charge + dt / 3.5); if (Math.random() < 0.4) g.particles.emit(n.x + (Math.random() - 0.5) * 50, n.y, '#7DFFFF', 1, 1.2, { vy: -1.5 }); }
                        else n.charge = Math.max(0, n.charge - dt * (inside ? 0.5 : 0.18));
                        if (n.charge >= 1) { n.lit = true; TG.sound.reward(); g.particles.ring(n.x, n.y, '#7DFFFF', 110); g.combat.floater(n.x, n.y - 40, 'EQUILIBRIO', '#7DFFFF'); }
                    }
                }
                if (nodes.every(n => n.lit)) { for (const q of g.quests.active.keys()) this.clearProps(q); g.quests.event('cnodes'); }
            }
            for (const pr of this.props) { if (pr.glow > 0) pr.glow = Math.max(0, pr.glow - dt * 0.3); if (pr.warn > 0) pr.warn = Math.max(0, pr.warn - dt * 2); }
            this.updateMrU(dt);
        }

        // ================================================================ MR. U
        updateMrU(dt) {
            const g = this.g, m = this.mrU, p = g.player; m.t += dt;
            if (m.gone || p.skills.mrUBike || g.state !== 'play' || g.tutorial.active) { if (p.skills.mrUBike) m.active = false; return; }
            if (!m.active) {
                if (p.interior || g.battle.active || g.duel.active || p.dead) return;
                m.timer -= dt;
                if (m.timer <= 0) this.spawnMrU();
            } else {
                if (m.era !== g.era || p.interior) { if (m.era !== g.era) { m.active = false; m.timer = 25; } return; }
                m.life -= dt;
                if (m.life <= 0 && Math.hypot(p.x - m.x, p.y - m.y) > 700) { m.active = false; m.timer = 70 + Math.random() * 60; }
            }
        }
        spawnMrU(force) {
            const g = this.g, m = this.mrU, p = g.player, b = g.currentBounds();
            const a = Math.random() * 6.28, d = force ? 120 : 480 + Math.random() * 200;
            m.x = U.clamp(p.x + Math.cos(a) * d, 120, b.w - 120); m.y = U.clamp(p.y + Math.sin(a) * d, 160, b.h - 120);
            m.active = true; m.era = g.era; m.life = 110;
            TG.Toast.show('🔥 Una silueta con estela de fuego aparece cerca… ¿será Mr. U?', 'warn', 5200); TG.sound.eventAlert();
            g.particles.ring(m.x, m.y, '#FF7A1A', 120);
        }
        nearMrU() { const m = this.mrU; return m.active && m.era === this.g.era && !this.g.player.interior && Math.hypot(this.g.player.x - m.x, this.g.player.y - m.y) < 75; }
        talkMrU() {
            const g = this.g, q = g.quests;
            const has = q.isActive('mru_ride');
            TG.Reveal.show({
                kicker: 'MR. U', title: has ? '¿Intentamos otra vez?' : '¿Estás listo para una última cabalgata, compañero?',
                html: '<p>Un solo camino, dos motos y la noche cayendo sobre el desierto digital. Cabalga a mi lado, esquiva lo que se cruce y mantén el ritmo junto a mí.</p>' +
                    '<p class="reward-line">RECOMPENSA: 🔥 La Bicicleta de Mr. U — el ciclo de luz más rápido, con estela de fuego.</p>' +
                    '<p class="dim">Se abrirá en una ventana aparte. Controles: ↑ ↓ cambian de carril · ← → ajustan la distancia · ESPACIO enciende la llama.</p>',
                button: 'ACEPTAR LA CABALGATA', color: '#FF7A1A',
                secondary: { text: 'Ahora no', onClick: () => { } }
            }, () => { if (!q.isActive('mru_ride')) q.accept('mru_ride'); q.event('talk', { npc: 'mr_u' }); this.launchMinigame('ghost_ride'); });
        }

        // ================================================================ MINIJUEGO EN OTRA VENTANA
        launchMinigame(id) {
            if (this.mg.open) return;
            const p = this.g.player;
            const url = `minigames/ghost-ride.html?c=${encodeURIComponent(p.color)}&n=${encodeURIComponent(p.name)}`;
            this.mg = { open: true, win: null, poll: null, wasMuted: TG.sound.muted, id, frame: null };
            let w = null;
            const touch = !!(TG.platform && TG.platform.touch);   // en teléfono no hay ventanas emergentes: se juega dentro del mismo juego
            if (!touch) { try { w = window.open(url, 'tron_ghost_ride', 'popup=yes,width=1120,height=660,left=80,top=60'); } catch (e) { w = null; } }
            if (w && !w.closed) {
                this.mg.win = w; TG.Toast.show('🏍 La cabalgata se abrió en otra ventana.', 'info', 4200);
                this.mg.poll = setInterval(() => { if (this.mg.win && this.mg.win.closed) this.endMinigame(false, 'ventana cerrada'); }, 600);
            } else {   // ventana emergente bloqueada → panel interno
                const f = document.getElementById('minigame-frame'); this.mg.frame = f;
                const qs = url.slice(url.indexOf('?')) + (touch ? '&touch=1' : '');
                if (TG.mgHtml) { f.removeAttribute('src'); f.srcdoc = TG.mgHtml.replace('<head>', '<head><script>window.__MG_QS = ' + JSON.stringify(qs) + ';<\/script>'); }   // sin red: el minijuego ya está en memoria
                else f.src = url + (touch ? '&touch=1' : '');
                TG.Modals.open('minigame-overlay'); if (!touch) TG.Toast.show('El navegador bloqueó la ventana emergente: se abrió como panel.', 'warn', 5200);
            }
            this.g.paused = true; TG.sound.setMuted(true);
        }
        onMessage(e) {
            const d = e.data; if (!d || d.type !== 'tron-minigame') return;
            const f = this.mg.frame || document.getElementById('minigame-frame');
            const ok = (this.mg.win && e.source === this.mg.win) || (f && e.source === f.contentWindow);
            if (!ok || !this.mg.open) return;
            if (d.event === 'result') this.endMinigame(!!d.success, d.success ? 'completada' : 'fallida', d);
            else if (d.event === 'close') this.endMinigame(false, 'cerrada');
        }
        endMinigame(success, why, data) {
            if (!this.mg.open) return;
            const g = this.g, mg = this.mg; mg.open = false;
            if (mg.poll) clearInterval(mg.poll);
            try { if (mg.win && !mg.win.closed) mg.win.close(); } catch (e) { /* nada */ }
            const f = document.getElementById('minigame-frame'); f.src = 'about:blank'; TG.Modals.close('minigame-overlay');
            g.paused = false; TG.sound.setMuted(mg.wasMuted);
            window.focus();
            if (success) {
                TG.Reveal.show({ kicker: 'LA ÚLTIMA CABALGATA', title: 'Mr. U te hace un gesto de aprobación', html: `<p>Cabalgaron juntos hasta el final del camino. Mr. U levanta el pulgar, sonríe y su silueta se desvanece entre llamas.</p>${data && data.sync != null ? `<p class="dim">Sincronía: ${Math.round(data.sync * 100)}% · Puntaje: ${data.score || 0}</p>` : ''}`, button: 'CONTINUAR', color: '#FF7A1A' }, () => g.quests.event('minigame', { id: mg.id, success: true }));
            } else TG.Toast.show('La cabalgata terminó antes de tiempo (' + why + '). Habla con Mr. U para reintentar.', 'warn', 5200);
        }

        // ================================================================ PUZZLES (Mr. L)
        startPuzzle(kind) { this.pz.kind = kind; this.nextPuzzle(); TG.Modals.open('puzzle-modal'); }
        closePuzzle() { TG.Modals.close('puzzle-modal'); this.pz.cur = null; }
        makePuzzle(kind) {
            const R = (a, b) => Math.floor(a + Math.random() * (b - a + 1)), P = U.pick;
            let q, ans, hint, unit = '';
            if (kind === 'math') {
                const t = R(0, 5);
                if (t === 0) { const a = R(2, 9), d = R(2, 7); q = `Secuencia: ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, … ¿Qué número sigue?`; ans = a + 4 * d; hint = `La diferencia constante es ${d}.`; }
                else if (t === 1) { const n = R(3, 5); q = `Secuencia: ${[1, 2, 3, 4].map(i => i * (i + 1)).join(', ')}, … (cada término es n·(n+1)). ¿Qué sigue?`; ans = 5 * 6; hint = 'El quinto término es 5·6.'; }
                else if (t === 2) { const x = R(2, 12), a = R(2, 7), b = R(1, 15); q = `Resuelve: ${a}x + ${b} = ${a * x + b}. ¿Cuánto vale x?`; ans = x; hint = `Resta ${b} y divide entre ${a}.`; }
                else if (t === 3) { const tr = P([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]]); q = `Un triángulo rectángulo tiene catetos ${tr[0]} y ${tr[1]}. ¿Cuánto mide la hipotenusa?`; ans = tr[2]; hint = 'Teorema de Pitágoras: a² + b² = c².'; }
                else if (t === 4) { const a = R(30, 70), b = R(30, 70); q = `En un triángulo, dos ángulos miden ${a}° y ${b}°. ¿Cuánto mide el tercero (en grados)?`; ans = 180 - a - b; hint = 'Los ángulos de un triángulo suman 180°.'; }
                else { const a = R(1, 3), b = R(1, 4); q = `Fibonacci: ${a}, ${b}, ${a + b}, ${a + 2 * b}, ${2 * a + 3 * b}, … ¿Qué número sigue?`; ans = 3 * a + 5 * b; hint = 'Cada término es la suma de los dos anteriores.'; }
            } else if (kind === 'code') {
                const t = R(0, 5);
                if (t === 0) { const bits = Array.from({ length: 4 }, () => R(0, 1)); if (bits.every(b => b === 0)) bits[3] = 1; q = `Binario → decimal: ¿cuánto vale 0b${bits.join('')}?`; ans = parseInt(bits.join(''), 2); hint = 'Cada bit vale 8, 4, 2 y 1 de izquierda a derecha.'; }
                else if (t === 1) { const n = R(4, 8); q = `suma = 0; para i desde 0 hasta ${n - 1}: suma = suma + i. ¿Cuánto vale suma al final?`; ans = (n - 1) * n / 2; hint = `Suma los enteros de 0 a ${n - 1}.`; }
                else if (t === 2) { const A = R(0, 1), B = R(0, 1), Cc = R(0, 1); q = `Lógica (1 = verdadero, 0 = falso): A=${A}, B=${B}, C=${Cc}. ¿Cuánto vale (A Y B) O (NO C)?`; ans = ((A && B) || !Cc) ? 1 : 0; hint = 'Evalúa primero los paréntesis y recuerda que NO invierte.'; }
                else if (t === 3) { const arr = [R(1, 9), R(1, 9), R(1, 9), R(1, 9)], i = R(0, 3); q = `arreglo = [${arr.join(', ')}]. ¿Qué devuelve arreglo[${i}]? (los índices empiezan en 0)`; ans = arr[i]; hint = 'El primer elemento es el índice 0.'; }
                else if (t === 4) { const h = R(10, 47); q = `Hexadecimal → decimal: ¿cuánto vale 0x${h.toString(16).toUpperCase()}?`; ans = h; hint = 'Multiplica el primer dígito por 16 y suma el segundo.'; }
                else { const a = R(11, 40), b = R(3, 9); q = `¿Cuánto es ${a} % ${b}? (resto de la división entera)`; ans = a % b; hint = 'El resto es lo que sobra tras dividir.'; }
            } else if (kind === 'elec') {
                const t = R(0, 4);
                if (t === 0) { const a = R(2, 9), b = R(2, 9), c = R(1, a + b - 1); q = `Ley de Kirchhoff de corrientes: en un nodo entran ${a} A y ${b} A, y por una rama sale ${c} A. ¿Cuántos A salen por la otra rama?`; ans = a + b - c; unit = ' A'; hint = 'Corriente que entra = corriente que sale.'; }
                else if (t === 1) { const r1 = P([10, 20, 30]), r2 = P([20, 30, 60]), V = (r1 + r2) * P([1, 2]); q = `Divisor de tensión: ${r1} Ω y ${r2} Ω en serie con una fuente de ${V} V. ¿Cuántos voltios caen en la de ${r2} Ω?`; ans = V * r2 / (r1 + r2); unit = ' V'; hint = 'V₂ = V · R₂ / (R₁ + R₂).'; }
                else if (t === 2) { const I = R(2, 6), Rr = R(2, 10); q = `Potencia en una resistencia: ${I} A circulan por ${Rr} Ω. ¿Cuántos watts disipa? (P = I²·R)`; ans = I * I * Rr; unit = ' W'; hint = 'P = I² × R.'; }
                else if (t === 3) { const a = R(2, 9), b = R(2, 9); q = `Dos condensadores de ${a} µF y ${b} µF en PARALELO. ¿Capacidad total?`; ans = a + b; unit = ' µF'; hint = 'En paralelo, las capacidades se suman.'; }
                else { const f = P([50, 25, 100, 200]); q = `Una señal alterna de ${f} Hz. ¿Cuántos milisegundos dura su período? (T = 1/f)`; ans = 1000 / f; unit = ' ms'; hint = 'T = 1000 / f (en ms).'; }
            } else if (kind === 'ctrl') {
                const t = R(0, 6);
                if (t === 0) { const sp = R(50, 80), pv = sp - R(4, 20); q = `Control de procesos: consigna = ${sp} y variable medida = ${pv}. ¿Cuánto vale el error (consigna − medida)?`; ans = sp - pv; hint = 'error = consigna − medida.'; }
                else if (t === 1) { const kp = R(2, 5), e = R(3, 9); q = `Controlador proporcional: Kp = ${kp} y error = ${e}. ¿Cuánto vale la salida P?`; ans = kp * e; hint = 'Salida P = Kp × error.'; }
                else if (t === 2) { const f = R(2, 6), m = R(2, 4); q = `Un caudal constante de ${f} L/s durante ${m} minutos. ¿Cuántos litros circulan?`; ans = f * m * 60; hint = 'Pasa los minutos a segundos y multiplica.'; }
                else if (t === 3) { const tau = R(3, 9); q = `Sistema de primer orden con constante de tiempo τ = ${tau} s. Tras 4τ alcanza ~98% del valor final. ¿Cuántos segundos son 4τ?`; ans = 4 * tau; hint = 'Multiplica τ por 4.'; }
                else if (t === 4) { q = 'Realimentación negativa: la medida está POR ENCIMA de la consigna. ¿El controlador debe aumentar (1) o disminuir (0) su salida?'; ans = 0; hint = 'Debe corregir el error en sentido contrario.'; }
                else if (t === 5) { const k = R(2, 4), a = R(3, 6) * k; q = `Control de relación ${k}:1 (A:B). Con ${a} L de A, ¿cuántos L de B se necesitan?`; ans = a / k; hint = 'Divide A entre la relación.'; }
                else { const ki = P([0.5, 1, 2]), e = R(2, 6), s = R(2, 5); q = `Acción integral: Ki = ${ki}, error constante ${e} durante ${s} s. ¿Cuánto vale la integral (Ki·e·t)?`; ans = ki * e * s; hint = 'Multiplica Ki por el error y por el tiempo.'; }
            } else {
                const t = R(0, 6);
                if (t === 0) { const I = R(2, 9), Rr = R(3, 15); q = `Ley de Ohm: una corriente de ${I} A atraviesa una resistencia de ${Rr} Ω. ¿Qué voltaje hay? (V = I·R)`; ans = I * Rr; unit = ' V'; hint = 'V = I × R.'; }
                else if (t === 1) { const Rr = R(2, 12), I = R(2, 8); q = `Un circuito de ${Rr * I} V hace circular ${I} A. ¿Cuál es la resistencia? (R = V/I)`; ans = Rr; unit = ' Ω'; hint = 'R = V ÷ I.'; }
                else if (t === 2) { const a = R(2, 20), b = R(2, 20), c = R(2, 20); q = `Tres resistencias en SERIE: ${a} Ω, ${b} Ω y ${c} Ω. ¿Resistencia total?`; ans = a + b + c; unit = ' Ω'; hint = 'En serie se suman.'; }
                else if (t === 3) { const a = P([4, 6, 8, 10, 12, 20]); q = `Dos resistencias IGUALES de ${a} Ω en PARALELO. ¿Resistencia equivalente?`; ans = a / 2; unit = ' Ω'; hint = 'Dos iguales en paralelo: la mitad.'; }
                else if (t === 4) { const V = P([6, 12, 24, 48]), I = R(2, 6); q = `Potencia eléctrica: ${V} V y ${I} A. ¿Cuántos watts? (P = V·I)`; ans = V * I; unit = ' W'; hint = 'P = V × I.'; }
                else if (t === 5) { const pr = P([[6, 3], [12, 4], [10, 15], [20, 5], [30, 15]]); q = `${pr[0]} Ω en paralelo con ${pr[1]} Ω. ¿Resistencia equivalente? (R = R₁·R₂ / (R₁ + R₂))`; ans = Math.round(pr[0] * pr[1] / (pr[0] + pr[1]) * 100) / 100; unit = ' Ω'; hint = 'Producto entre suma.'; }
                else { const Rt = R(3, 15), I = R(2, 6); q = `Un circuito en serie tiene ${Rt} Ω totales y ${I} A. Si la fuente es de ${Rt * I} V, ¿qué corriente circula? (I = V/R)`; ans = I; unit = ' A'; hint = 'I = V ÷ R.'; }
            }
            const opts = new Set([ans]); const sc = Math.max(2, Math.round(Math.abs(ans) * 0.4));
            let guard = 0; while (opts.size < 4 && guard++ < 60) { let o = ans + (Math.random() < 0.5 ? -1 : 1) * R(1, sc + 3); if (Number.isInteger(ans)) o = Math.round(o); else o = Math.round(o * 100) / 100; if (o > 0 && o !== ans) opts.add(o); }
            const arr = [...opts].sort(() => Math.random() - 0.5);
            return { q, ans, hint, unit, opts: arr };
        }
        nextPuzzle() {
            const kind = this.pz.kind, g = this.g;
            const st = [...g.quests.active.values()].find(s => { const x = g.quests.stepOf(s); return x && x.type === 'puzzle' && x.kind === kind; });
            if (!st) { this.closePuzzle(); return; }
            const s = g.quests.stepOf(st), cur = this.makePuzzle(kind); this.pz.cur = cur;
            document.getElementById('puzzle-title').textContent = { math: 'MATEMÁTICA · MR. L', ohm: 'CIRCUITOS · MR. L', code: 'PROGRAMACIÓN · CARLOS', elec: 'ELECTRICIDAD · MR. E', ctrl: 'CONTROL DE PROCESOS · MR. R' }[kind] || 'DESAFÍO';
            document.getElementById('puzzle-progress').textContent = `Problema ${st.progress + 1} de ${s.n}`;
            document.getElementById('puzzle-q').textContent = cur.q; document.getElementById('puzzle-feedback').textContent = ''; document.getElementById('puzzle-feedback').className = '';
            const box = document.getElementById('puzzle-opts'); box.innerHTML = '';
            for (const o of cur.opts) {
                const b = document.createElement('button'); b.className = 'tron-button'; b.textContent = o + cur.unit;
                b.addEventListener('click', () => this.answer(o, b)); box.appendChild(b);
            }
        }
        answer(o, btn) {
            const cur = this.pz.cur, fb = document.getElementById('puzzle-feedback'); if (!cur) return;
            if (o === cur.ans) {
                TG.sound.accept(); fb.textContent = '✔ Correcto.'; fb.className = 'ok';
                document.querySelectorAll('#puzzle-opts button').forEach(b => b.disabled = true);
                const kind = this.pz.kind;
                setTimeout(() => {
                    this.g.quests.event('puzzle', { kind });
                    const still = [...this.g.quests.active.values()].some(s => { const x = this.g.quests.stepOf(s); return x && x.type === 'puzzle' && x.kind === kind; });
                    if (still) this.nextPuzzle(); else { this.closePuzzle(); TG.Toast.show('Desafío completado. Vuelve a hablar con quien te lo encargó.', 'good', 4800); }
                }, 700);
            } else { TG.sound.damage(); fb.textContent = '✘ Incorrecto. Pista: ' + cur.hint; fb.className = 'bad'; btn.disabled = true; }
        }

        // ================================================================ DIBUJO
        // devuelve elementos con profundidad (Mr. U) para mezclar con el resto
        drawables(cam, t) {
            const out = [], g = this.g, m = this.mrU;
            if (m.active && m.era === g.era && !g.player.interior) {
                out.push({ y: m.y, draw: (ctx) => {
                    const x = m.x - cam.ox, y = m.y - cam.oy;
                    ctx.save(); ctx.globalCompositeOperation = 'lighter';
                    for (let i = 0; i < 8; i++) { const a = t * 2 + i; ctx.fillStyle = U.rgba(i % 2 ? '#FFD040' : '#FF6A1A', 0.5); ctx.beginPath(); ctx.arc(x - 40 + Math.cos(a) * 22, y - 10 - ((t * 40 + i * 12) % 50), 3 + (i % 3), 0, 7); ctx.fill(); }
                    ctx.restore();
                    G.glow(ctx, x - 20, y - 20, 120, '#FF7A1A', 0.35 + 0.1 * Math.sin(t * 4));
                    G.cycle(ctx, x - 44, y + 8, 0, '#FF7A1A', { t, fire: true });
                    G.humanoid(ctx, x + 22, y + 14, { c: '#FF9A3A', a: '#FFE080', f: -1, look: 'skull', t });
                    G.nameplate(ctx, x, y - 92, 'Mr. U', '#FF7A1A');
                    G.questMark(ctx, x, y - 116, g.quests.isDone('mru_ride') ? '?' : '!', t);
                } });
            }
            return out;
        }
        renderProps(ctx, cam, t) {
            const area = this.areaId(), g = this.g;
            for (const p of this.props) {
                if (p.area !== area) continue;
                const x = p.x - cam.ox, y = p.y - cam.oy;
                if (p.kind === 'node') {
                    ctx.beginPath(); ctx.ellipse(x, y, p.r, p.r * 0.75, 0, 0, Math.PI * 2); ctx.fillStyle = U.rgba('#7DFFFF', p.lit ? 0.3 : 0.07 + p.charge * 0.18); ctx.fill(); G.stroke(ctx, '#7DFFFF', 1.8, 0.8);
                    ctx.beginPath(); ctx.ellipse(x, y, p.r * 0.72, p.r * 0.54, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.lit ? 1 : p.charge)); G.stroke(ctx, '#fff', 2.6, 1);
                    ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0); ctx.closePath(); G.stroke(ctx, p.lit ? '#9DFF9D' : '#7DFFFF', 1.8, 1); ctx.restore();
                    ctx.font = '10px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8ffff'; ctx.fillText(p.lit ? 'EN EQUILIBRIO' : 'QUÉDATE QUIETO', x, y + p.r * 0.75 + 16);
                } else if (p.kind === 'pylon') {
                    const v = [(x - cam.w / 2) * 0.0004 * 90, -74 + (y - cam.h / 2) * 0.0004 * 90];
                    G.extrude(ctx, G.ngon(x, y, 17, 13, 8, 0), v[0], v[1], { side: '#04141c', lit: p.lit ? '#2aa0b0' : '#0a3a4a', roof: '#062430', edge: p.lit ? '#BFFFFF' : '#2ad0e0', bands: 2 });
                    const tx = x + v[0], ty = y + v[1];
                    G.glow(ctx, tx, ty, 34 + p.glow * 40, '#9DFBFF', 0.25 + p.glow * 0.6 + (p.lit ? 0.2 : 0));
                    if (p.lit) { ctx.beginPath(); ctx.moveTo(tx, ty); for (let i = 1; i < 5; i++) ctx.lineTo(tx + (Math.random() - 0.5) * 30, ty - i * 12); G.stroke(ctx, '#BFFFFF', 1.4, 0.9); }
                    ctx.font = '10px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8ffff'; ctx.fillText(p.lit ? 'CARGADO' : 'PILÓN', x, y + 30);
                } else if (p.kind === 'target') {
                    const col = p.warn > 0 ? '#FF6A6A' : '#B9A7FF', bob = Math.sin(t * 3 + p.id) * 4;
                    G.glow(ctx, x, y - 30 + bob, 54, col, 0.35);
                    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y - 30 + bob, 26 - i * 8, 26 - i * 8, 0, 0, Math.PI * 2); G.stroke(ctx, i === 1 ? '#fff' : col, 1.8, 0.95); }
                    ctx.fillStyle = col; ctx.font = 'bold 14px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('θ', x, y - 25 + bob);
                    ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 8, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
                }
            }
            // anillo de carga estática alrededor del jugador (Maestría Electrostática)
            const p = g.player;
            if (p.skills.staticMastery && p.charge > 0.02 && p.mode === 'foot' && !p.dead) {
                const x = p.x - cam.ox, y = p.y - cam.oy;
                ctx.beginPath(); ctx.ellipse(x, y + 4, 30, 11, 0, 0, Math.PI * 2 * p.charge); G.stroke(ctx, '#7DFFFF', 2.2, 0.95);
                if (p.charge >= 0.99) {
                    for (let i = 0; i < 3; i++) { ctx.beginPath(); let px = x + (Math.random() - 0.5) * 24, py = y - 4; ctx.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (Math.random() - 0.5) * 12; py -= 14; ctx.lineTo(px, py); } G.stroke(ctx, '#BFFFFF', 1.2, 0.85); }
                    G.glow(ctx, x, y - 24, 52, '#7DFFFF', 0.28);
                }
            }
        }
    }
    TG.Special = Special;

})(window.TG = window.TG || {});
