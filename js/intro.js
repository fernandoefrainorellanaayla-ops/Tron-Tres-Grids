/* ==========================================================================
   TRON: LAS TRES GRIDS — intro.js
   Introducción estilo Tron: Ares.
   FASE 1 · Terminal: Julian Dillinger "escribe". El usuario pulsa CUALQUIER tecla
            y la terminal teclea por él un guion ya preparado.
   FASE 2 · Génesis: cada Grid se va creando (rejilla que se expande, estructuras
            que se alzan desde el suelo) con la estética de su era.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;

    // Guion de la terminal (texto original, inspirado en la premisa de Ares)
    const SCRIPT = [
        '// DILLINGER SYSTEMS // TERMINAL SEGURA v9.2',
        '// operador: Julian Dillinger · acceso: NIVEL 9',
        '> ssh root@dillinger-core --sin-registro',
        '  conexión establecida ............ [ok]',
        '> cd /grid/genesis && ls',
        '  ares.core   athena.core   permanencia.lock   plantillas/',
        '> nano genesis.cfg',
        '  GRIDS_A_CREAR    = 3',
        '  MATERIALIZAR     = verdadero',
        '  PERMANENCIA      = pendiente',
        '  LIMITE_DE_VIDA   = 29 minutos',
        '// Mi abuelo empezó esto. Yo voy a terminarlo.',
        '> cat plantillas/crear_grid.fn',
        '  funcion crear_grid(era, estilo):',
        '      rejilla = trazar(era.mapa)',
        '      ciudad  = alzar(era.estructuras)',
        '      luz     = encender(estilo.neon)',
        '      return digitalizar(rejilla, ciudad, luz)',
        '> compilar genesis.cfg',
        '  analizando plantillas ........... [ok]',
        '  verificando firmas .............. [ok]',
        '  desactivando limites ............ [ok]',
        '> crear_grid("ENCOM 1982",     estilo.vectorial_azul)',
        '> crear_grid("FLYNN 2010",     estilo.cristal_cian)',
        '> crear_grid("DILLINGER 2025", estilo.hexagonal_rojo)',
        '  sembrando programas ............. [ok]',
        '  enlazando portales .............. [ok]',
        '// Que empiece la simulación.',
        '> ejecutar genesis --todo'
    ].join('\n');

    const ERAS = [
        { era: '1982', title: 'GRID ENCOM · 1982', sub: 'El sistema original del Programa de Control Maestro', cx: 1150, cy: 1150, steps: ['trazando rejilla vectorial', 'alzando estructuras del MCP', 'encendiendo neón azul', 'sembrando programas', 'enlazando portales'] },
        { era: '2010', title: 'GRID DE FLYNN · 2010', sub: 'Tron City, Argón y las Outlands', cx: 2800, cy: 2300, steps: ['pulimentando suelo de cristal', 'alzando Tron City y Argón', 'encendiendo neón cian', 'sembrando programas', 'enlazando portales'] },
        { era: '2025', title: 'GRID DE DILLINGER · 2025', sub: 'Dillinger Systems y el mundo real', cx: 2300, cy: 1450, steps: ['tejiendo teselas hexagonales', 'alzando la torre Dillinger', 'encendiendo rojo de combate', 'sembrando programas', 'enlazando portales'] }
    ];
    const T_ERA = 5.2;   // segundos por Grid

    class Intro {
        constructor(game) {
            this.g = game; this.phase = 'idle'; this.pos = 0; this.done = null; this.t = 0; this.idle = 0; this.lastType = 0;
            this.el = {
                scr: document.getElementById('terminal-screen'), out: document.getElementById('term-out'), hint: document.getElementById('term-hint'),
                skip: document.getElementById('intro-skip'), pct: document.getElementById('term-pct'), box: document.getElementById('term-box'),
                gut: document.getElementById('term-gutter'), mode: document.getElementById('term-mode'), ln: document.getElementById('term-ln'), cv: document.getElementById('term-ares'), log: document.getElementById('term-log'),
                mComp: document.getElementById('m-comp'), mInt: document.getElementById('m-int'), mMem: document.getElementById('m-mem')
            };
            this.auto = false; this.autoAcc = 0; this.logs = []; this.logT = 0; this.cdT = 0;
            this._key = (e) => this.onKey(e);
            this._ptr = (e) => { if (e.target === this.el.skip) return; this.press(false); };
            this.el.skip.addEventListener('click', () => this.finish());
        }
        start(onDone) {
            this.done = onDone; this.phase = 'term'; this.pos = 0; this.t = 0; this.idle = 0; this.auto = !!(TG.platform && TG.platform.touch); this.autoAcc = 0; this.logs = []; this.logT = 0; this.cdT = 0;
            this.g.state = 'intro'; this.el.scr.classList.remove('hidden', 'fadeout'); this.el.skip.classList.remove('hidden');
            this.setMode(this.auto); this.render_term();
            window.addEventListener('keydown', this._key); this.el.scr.addEventListener('pointerdown', this._ptr);
        }
        // ------------------------------------------------------------- teclado
        onKey(e) {
            if (this.phase !== 'term' && this.phase !== 'ready') return;
            if (e.code === 'Escape') { this.finish(); return; }
            if (e.code === 'Tab') { e.preventDefault(); this.setMode(!this.auto); return; }
            if (['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock', 'Tab'].includes(e.code) || /^F\d+$/.test(e.code)) return;
            e.preventDefault();
            this.press(e.code === 'Enter');
        }
        setMode(auto) {
            this.auto = auto; this.el.mode.textContent = auto ? 'MODO: AUTOMÁTICO' : 'MODO: MANUAL';
            if (this.phase === 'term') this.el.hint.textContent = auto ? 'La terminal escribe sola… (toca o pulsa una tecla para acelerar · Tab: modo manual)' : 'Teclea cualquier cosa… (mantén una tecla para ir más rápido · Tab: escritura automática)';
        }
        startCountdown() { if (this.phase !== 'ready') return; this.phase = 'count'; this.cdT = 3.2; this.el.hint.classList.add('blink'); TG.sound.tone(520, 0.12, 'square', 0.04); }
        press(enter) {
            TG.sound.ensure();
            if (this.phase === 'ready') { this.startCountdown(); return; }
            if (this.phase === 'count') return;
            if (this.phase !== 'term') return;
            this.idle = 0;
            let n = 5 + Math.floor(Math.random() * 6);                 // 5 a 10 caracteres por pulsación
            if (enter) { const nl = SCRIPT.indexOf('\n', this.pos); n = nl < 0 ? SCRIPT.length - this.pos : nl - this.pos + 1; }
            this.pos = Math.min(SCRIPT.length, this.pos + n);
            TG.sound.tone(1500 + Math.random() * 900, 0.025, 'square', 0.02);
            this.render_term();
            if (this.pos >= SCRIPT.length) {
                this.phase = 'ready'; this.el.hint.textContent = this.auto ? '▮ LISTO · EJECUTANDO EN UN MOMENTO…' : '▮ PULSA CUALQUIER TECLA PARA EJECUTAR'; this.readyT = 0;
                this.el.hint.classList.add('blink');
            }
        }
        tok(s) {
            let out = '', last = 0, m; const re = /("[^"]*"?)|(\[ok\])|(--[\wñ-]+)|(\b\d+\b)|(\b(?:funcion|return|verdadero|falso|pendiente|todo)\b)|([A-Za-z_]\w*)(?=\()/g;
            while ((m = re.exec(s))) { out += U.esc(s.slice(last, m.index)); const cls = m[1] ? 't-str' : m[2] ? 't-ok' : m[3] ? 't-flag' : m[4] ? 't-num' : m[5] ? 't-kw' : 't-fn'; out += `<span class="${cls}">${U.esc(m[0])}</span>`; last = m.index + m[0].length; }
            return out + U.esc(s.slice(last));
        }
        hl(ln) {
            if (/^\s*\/\//.test(ln)) return `<span class="t-cmt">${U.esc(ln)}</span>`;
            const m = ln.match(/^(>)(\s*)(\S+)(.*)$/);
            if (m) return `<span class="t-prompt">&gt;</span>${m[2]}<span class="t-cmd">${U.esc(m[3])}</span>${this.tok(m[4])}`;
            return this.tok(ln);
        }
        render_term() {
            const typed = SCRIPT.slice(0, this.pos), lines = typed.split('\n');
            let html = '';
            lines.forEach((ln, i) => { const last = i === lines.length - 1; html += this.hl(ln) + (last ? '<span class="t-cursor">█</span>' : '\n'); });
            this.el.out.innerHTML = html; this.el.gut.textContent = lines.map((_, i) => String(i + 1).padStart(2, '0')).join('\n');
            this.el.ln.textContent = 'Ln ' + lines.length + ', Col ' + (lines[lines.length - 1].length + 1);
            this.el.box.scrollTop = this.el.box.scrollHeight;
            this.el.pct.textContent = Math.round(this.pos / SCRIPT.length * 100) + '%';
        }
        // ------------------------------------------------------------- panel lateral: Ares se construye en wireframe
        logLine() {
            const L = ['asignando bloque 0x' + Math.floor(Math.random() * 0xfffff).toString(16).toUpperCase().padStart(5, '0'), 'firma ENCOM … verificada', 'compilando núcleo ares.core', 'enlazando athena.core', 'sembrando semilla de comportamiento', 'cargando plantilla vectorial_azul', 'cargando plantilla cristal_cian', 'cargando plantilla hexagonal_rojo', 'permanencia.lock … RECHAZADO', 'reintentando con credencial NIVEL 9', 'integridad del programa: ' + (92 + Math.floor(Math.random() * 8)) + '%', 'impresora de partículas: en espera', 'límite de vida: 29 min (desactivar)'];
            const d = new Date(); const ts = [d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
            this.logs.push('[' + ts + '] ' + U.pick(L)); if (this.logs.length > 9) this.logs.shift(); this.el.log.textContent = this.logs.join('\n');
        }
        drawAres(t) {
            const cv = this.el.cv; if (!cv || !cv.offsetParent) return; const c = cv.getContext('2d'), w = cv.width, h = cv.height, prog = U.clamp(this.pos / SCRIPT.length, 0, 1) * (this.phase === 'exec' || this.phase === 'count' ? 1 : 1);
            c.clearRect(0, 0, w, h); c.fillStyle = '#0a0105'; c.fillRect(0, 0, w, h);
            c.fillStyle = 'rgba(255,23,68,.18)'; for (let x = 10; x < w; x += 20) for (let y = 10; y < h; y += 20) c.fillRect(x, y, 1.5, 1.5);
            const cx = w / 2, base = h - 36, S = h / 300, sx = 0.55 + 0.45 * Math.cos(t * 0.9);
            const P = { head: [0, -222], neck: [0, -198], shL: [-27, -190], shR: [27, -190], elL: [-42, -140], elR: [42, -140], haL: [-46, -92], haR: [46, -92], chest: [0, -168], waist: [0, -112], hpL: [-16, -104], hpR: [16, -104], knL: [-19, -54], knR: [19, -54], ftL: [-22, -2], ftR: [22, -2] };
            const SEG = [['hpL', 'knL', 0, 0.12], ['knL', 'ftL', 0.1, 0.22], ['hpR', 'knR', 0.05, 0.17], ['knR', 'ftR', 0.15, 0.27], ['hpL', 'hpR', 0.27, 0.32], ['waist', 'chest', 0.3, 0.4], ['shL', 'shR', 0.4, 0.46], ['chest', 'neck', 0.44, 0.5], ['hpL', 'waist', 0.3, 0.35], ['hpR', 'waist', 0.3, 0.35], ['shL', 'elL', 0.5, 0.6], ['elL', 'haL', 0.58, 0.68], ['shR', 'elR', 0.55, 0.65], ['elR', 'haR', 0.63, 0.73], ['neck', 'head', 0.72, 0.8]];
            const pt = (k, f) => [cx + P[k][0] * S * sx, base + P[k][1] * S];
            c.save(); c.shadowColor = '#ff1744'; c.shadowBlur = 10; c.lineCap = 'round';
            for (const [a, b, t0, t1] of SEG) {
                const f = U.clamp((prog - t0) / (t1 - t0), 0, 1); if (f <= 0) continue; const A = pt(a), B = pt(b);
                c.strokeStyle = prog >= 0.99 ? '#ff6a80' : '#ff1744'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f); c.stroke();
                c.fillStyle = '#fff'; c.fillRect(A[0] - 2, A[1] - 2, 4, 4); if (f >= 1) c.fillRect(B[0] - 2, B[1] - 2, 4, 4);
            }
            if (prog > 0.8) { const H = pt('head'), r = 14 * S * Math.min(1, (prog - 0.8) / 0.1); c.strokeStyle = '#ff1744'; c.lineWidth = 2; c.beginPath(); c.ellipse(H[0], H[1] - 2, r * sx + 3, r, 0, 0, Math.PI * 2); c.stroke(); if (prog > 0.9) { c.beginPath(); c.moveTo(H[0] - r * sx, H[1] - r * 0.1); c.lineTo(H[0] + r * sx, H[1] - r * 0.1); c.stroke(); } }
            if (prog > 0.9) { const k = (prog - 0.9) / 0.1, D = pt('haR'); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.globalAlpha = k; c.beginPath(); c.ellipse(D[0], D[1], 16 * S * sx + 2, 16 * S, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
            c.restore();
            // plano de escaneo y anillo bajo los pies
            const sy = base - prog * 240 * S; c.fillStyle = 'rgba(255,60,90,.55)'; c.fillRect(cx - 95 * S, sy, 190 * S, 2); c.fillStyle = 'rgba(255,23,68,.12)'; c.fillRect(cx - 95 * S, sy - 14, 190 * S, 14);
            c.strokeStyle = 'rgba(255,60,90,.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, base + 4 * S, 70 * S, 14 * S, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(cx, base + 4 * S, 46 * S + 5 * Math.sin(t * 3), 9 * S, 0, 0, Math.PI * 2); c.stroke();
            c.fillStyle = '#ff8a9a'; c.font = '11px "Share Tech Mono", monospace'; c.fillText('ares.core ▸ ' + Math.round(prog * 100) + '%', 8, 16); if (prog >= 1) { c.fillStyle = '#7DFF9B'; c.fillText('PROGRAMA COMPLETO', 8, h - 8); }
            this.el.mComp.style.width = Math.round(prog * 100) + '%'; this.el.mInt.style.width = Math.round(U.clamp(52 + 46 * prog + 2 * Math.sin(t * 4), 0, 100)) + '%'; this.el.mMem.style.width = Math.round(28 + 56 * prog) + '%';
        }
        execute() {
            this.phase = 'exec'; this.t = 0;
            this.el.hint.classList.remove('blink'); this.el.hint.textContent = '';
            this.el.out.insertAdjacentHTML('beforeend', '\n<span class="t-warn">▓▓▓  GENESIS EN EJECUCIÓN  ▓▓▓</span>');
            this.el.box.scrollTop = this.el.box.scrollHeight;
            TG.sound.digitize(1.2); this.el.scr.classList.add('glitch');
            setTimeout(() => { if (this.phase !== 'exec') return; this.el.scr.classList.add('fadeout'); setTimeout(() => { this.el.scr.classList.add('hidden'); this.el.scr.classList.remove('glitch'); this.beginGenesis(); }, 600); }, 1100);
        }
        // ------------------------------------------------------------- génesis
        beginGenesis() {
            if (this.phase !== 'exec') return;
            this.phase = 'genesis'; this.t = 0; this.cur = -1; this.flash = 0; this.feed = [];
            window.removeEventListener('keydown', this._key); this.el.scr.removeEventListener('pointerdown', this._ptr);
            window.addEventListener('keydown', this._skipKey = (e) => { if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') this.finish(); });
        }
        update(dt) {
            this.t += (this.phase === 'term' || this.phase === 'ready' || this.phase === 'count' || this.phase === 'exec') ? dt : 0;
            if (['term', 'ready', 'count', 'exec'].includes(this.phase)) { this.logT -= dt; if (this.logT <= 0) { this.logT = 0.55 + Math.random() * 0.4; this.logLine(); } this.drawAres(this.t); }
            if (this.phase === 'term' && this.auto) { this.autoAcc += dt * 42; if (this.autoAcc >= 1) { const n = Math.floor(this.autoAcc); this.autoAcc -= n; this.pos = Math.min(SCRIPT.length, this.pos + n); if (Math.random() < 0.4) TG.sound.tone(1400 + Math.random() * 900, 0.02, 'square', 0.012); this.render_term(); if (this.pos >= SCRIPT.length) { this.phase = 'ready'; this.readyT = 0; this.el.hint.textContent = '▮ LISTO · EJECUTANDO EN UN MOMENTO…'; this.el.hint.classList.add('blink'); } } }
            if (this.phase === 'ready' && this.auto) { this.readyT += dt; if (this.readyT > 1.3) this.startCountdown(); }
            if (this.phase === 'count') { const before = Math.ceil(this.cdT); this.cdT -= dt; const n = Math.max(1, Math.ceil(this.cdT)); this.el.hint.textContent = '▮ EJECUTANDO GENESIS EN ' + n + '…'; if (Math.ceil(this.cdT) !== before && this.cdT > 0) TG.sound.tone(520 + (3 - n) * 160, 0.12, 'square', 0.045); if (this.cdT <= 0) this.execute(); }
            if (this.phase === 'term' && !this.auto) { this.idle += dt; if (this.idle > 14 && this.pos === 0) this.el.hint.textContent = 'Pulsa cualquier tecla (o toca la pantalla) para que Julián escriba · Tab: escritura automática'; }
            if (this.phase !== 'genesis') return;
            this.t += dt;
            const idx = Math.min(ERAS.length, Math.floor(this.t / T_ERA));
            if (idx >= ERAS.length) { if (this.t > T_ERA * ERAS.length + 2.6) this.finish(); return; }
            if (idx !== this.cur) {
                this.cur = idx; this.flash = 1; const e = ERAS[idx]; this.feed = [];
                this.g.hud.applyTheme(e.era); this.g.ambient.reset(e.era); TG.sound.digitize(1.6); TG.sound.setAmbient(e.era);
            }
            this.flash = Math.max(0, this.flash - dt * 2.2);
            const lt = this.t - this.cur * T_ERA, e = ERAS[this.cur];
            const want = Math.min(e.steps.length, Math.floor(lt / 0.8));
            while (this.feed.length < want) { this.feed.push(e.steps[this.feed.length]); TG.sound.tone(700 + this.feed.length * 140, 0.06, 'triangle', 0.03); }
        }
        render() {
            const g = this.g, cm = g.cm, ctx = cm.ctx, cam = g.camera;
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cm.w, cm.h);
            if (this.phase !== 'genesis') return;
            const total = T_ERA * ERAS.length;
            if (this.t >= total) { this.renderFinale(ctx, cm); return; }
            const e = ERAS[this.cur], grid = TG.GRIDS[e.era], th = G.THEME[e.era], lt = this.t - this.cur * T_ERA, T = g.time;
            cam.x = e.cx - cam.w / 2 + lt * 22; cam.y = e.cy - cam.h / 2 - lt * 10; cam.ox = cam.x; cam.oy = cam.y;
            document.body.dataset.era = e.era;
            const R = U.easeOut(lt / 2.0) * Math.hypot(cam.w, cam.h) * 0.62;
            ctx.save(); ctx.beginPath(); ctx.arc(cam.w / 2, cam.h / 2, R, 0, Math.PI * 2); ctx.clip();
            G.drawFloor(ctx, grid, cam, T);
            const locs = TG.LOCATIONS[e.era].filter(l => !l.hidden && cam.onScreen(l.x, l.y, l.r + 360));
            for (const l of locs) G.drawLocationBase(ctx, l, grid, cam, T, true);
            locs.sort((a, b) => a.y - b.y);
            for (const l of locs) {
                const dist = Math.hypot(l.x - (cam.ox + cam.w / 2), l.y - (cam.oy + cam.h / 2));
                const gp = U.clamp((lt - (0.7 + dist / 1100 * 1.4)) / 1.15, 0, 1); if (gp <= 0) continue;
                const sx = l.x - cam.ox, sy = l.y - cam.oy, hgt = U.easeOut(gp) * (l.r + 560), baseY = sy + l.r * 0.85;
                ctx.save(); ctx.beginPath(); ctx.rect(sx - l.r * 2.4 - 120, baseY - hgt, l.r * 4.8 + 240, hgt + 80); ctx.clip();
                G.drawStructure(ctx, l, grid, cam, T, true); ctx.restore();
                if (gp < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = U.rgba('#ffffff', 0.9); ctx.fillRect(sx - l.r * 1.3, baseY - hgt, l.r * 2.6, 2); ctx.fillStyle = U.rgba(th.glow, 0.35); ctx.fillRect(sx - l.r * 1.3, baseY - hgt - 8, l.r * 2.6, 10); ctx.restore(); }
            }
            if (lt > 3.2) { ctx.globalAlpha = U.clamp((lt - 3.2) / 1.0, 0, 1); G.drawAirborne(ctx, grid, cam, T); ctx.globalAlpha = 1; }
            ctx.restore();
            // frente de onda de la creación
            if (R < Math.hypot(cam.w, cam.h) * 0.6) { ctx.beginPath(); ctx.arc(cam.w / 2, cam.h / 2, R, 0, Math.PI * 2); G.stroke(ctx, th.glow, 3, 0.95); }
            g.ambient.era = e.era; g.ambient.render(cam, T, false);
            g.post.apply(e.era, 1);
            this.renderOverlay(ctx, cm, e, lt, th);
            if (this.flash > 0.01) {
                ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.85})`; ctx.fillRect(0, 0, cm.w, cm.h);
                ctx.fillStyle = U.rgba(th.glow, this.flash * 0.5); for (let i = 0; i < 7; i++) ctx.fillRect(0, Math.random() * cm.h, cm.w, 3 + Math.random() * 10);
            }
        }
        renderOverlay(ctx, cm, e, lt, th) {
            ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.font = '12px "Share Tech Mono", monospace';
            ctx.fillStyle = U.rgba('#FF1744', 0.9); ctx.fillText('● J. DILLINGER · genesis --todo', 24, 28);
            for (let i = 0; i < this.feed.length; i++) { ctx.fillStyle = U.rgba(th.major, 0.9); ctx.fillText('> ' + this.feed[i] + ' ..... [ok]', 24, cm.h - 150 + i * 18); }
            const alpha = U.clamp(lt / 0.7, 0, 1) * (lt > T_ERA - 0.5 ? U.clamp((T_ERA - lt) / 0.5, 0, 1) : 1);
            ctx.globalAlpha = alpha; ctx.textAlign = 'center';
            ctx.font = `800 ${Math.round(Math.min(44, cm.w * 0.036))}px Orbitron, sans-serif`; ctx.fillStyle = '#fff'; ctx.shadowColor = th.glow; ctx.shadowBlur = 26; ctx.fillText(e.title, cm.w / 2, cm.h * 0.14);
            ctx.shadowBlur = 0; ctx.font = '14px "Share Tech Mono", monospace'; ctx.fillStyle = U.rgba(th.major, 0.95); ctx.fillText(e.sub, cm.w / 2, cm.h * 0.14 + 34);
            const nL = TG.LOCATIONS[e.era].length, nN = TG.NPCS.filter(n => n.grid === e.era).length;
            ctx.font = '12px "Share Tech Mono", monospace'; ctx.fillStyle = U.rgba('#ffffff', 0.7); ctx.fillText(`lugares: ${Math.round(nL * U.clamp(lt / 3.4, 0, 1))}   programas: ${Math.round(nN * U.clamp(lt / 3.4, 0, 1))}`, cm.w / 2, cm.h * 0.14 + 58);
            ctx.globalAlpha = 1;
            // indicador de Grids
            for (let i = 0; i < ERAS.length; i++) { const x = cm.w / 2 + (i - 1) * 56; ctx.fillStyle = i <= this.cur ? G.THEME[ERAS[i].era].glow : 'rgba(255,255,255,0.18)'; ctx.fillRect(x - 20, cm.h - 40, 40, 4); }
            ctx.restore();
        }
        renderFinale(ctx, cm) {
            const lt = this.t - T_ERA * ERAS.length, T = this.g.time;
            const a = U.clamp(lt / 0.8, 0, 1), out = U.clamp((lt - 1.9) / 0.7, 0, 1);
            ctx.save(); ctx.globalAlpha = a * (1 - out); ctx.textAlign = 'center';
            for (let i = 0; i < 3; i++) { const th = G.THEME[ERAS[i].era], x = cm.w / 2 + (i - 1) * Math.min(260, cm.w * 0.22), y = cm.h * 0.5 + 70;
                G.glow(ctx, x, y - 70, 120, th.glow, 0.35 * a); ctx.fillStyle = th.glow; ctx.font = '800 30px Orbitron, sans-serif'; ctx.shadowColor = th.glow; ctx.shadowBlur = 24; ctx.fillText(ERAS[i].era, x, y - 64); ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '11px "Share Tech Mono", monospace'; ctx.fillText('ONLINE', x, y - 38); }
            ctx.fillStyle = '#fff'; ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 30; ctx.font = `800 ${Math.round(Math.min(64, cm.w * 0.06))}px Orbitron, sans-serif`;
            ctx.fillText('LAS TRES GRIDS', cm.w / 2, cm.h * 0.5 - 40); ctx.shadowBlur = 0;
            ctx.font = '13px "Share Tech Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('simulación iniciada', cm.w / 2, cm.h * 0.5 + 12);
            ctx.restore();
        }
        // ------------------------------------------------------------- fin
        finish() {
            if (this.phase === 'idle') return;
            this.phase = 'idle'; this.cur = -1;
            window.removeEventListener('keydown', this._key); if (this._skipKey) window.removeEventListener('keydown', this._skipKey);
            this.el.scr.removeEventListener('pointerdown', this._ptr);
            this.el.scr.classList.add('hidden'); this.el.skip.classList.add('hidden');
            this.g.era = '1982'; this.g.setEra('1982'); this.g.hud.applyTheme('1982'); this.g.ambient.reset('1982'); TG.sound.setAmbient('1982');
            this.g.state = 'menu';
            if (this.done) { const d = this.done; this.done = null; d(); }
        }
    }
    TG.Intro = Intro;

})(window.TG = window.TG || {});
