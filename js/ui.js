/* ==========================================================================
   TRON: LAS TRES GRIDS — ui.js
   HUD, minimapa, Atlas (lugares y personajes), modal de arena, menú y boot.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;

    // ================================================================== HUD
    class HUD {
        constructor(g) {
            this.g = g; this.mm = document.getElementById('minimap'); this.mctx = this.mm.getContext('2d');
            this.$ = (id) => document.getElementById(id);
            this.lastSkills = '';
        }
        applyTheme(era) {
            const th = G.THEME[era], grid = TG.GRIDS[era], r = document.documentElement.style;
            r.setProperty('--theme-primary', grid.color); r.setProperty('--theme-accent', grid.accent); r.setProperty('--theme-danger', grid.danger);
            document.body.dataset.era = era;
        }
        refreshSkills() {
            const p = this.g.player, s = p.skills, out = [];
            if (s.dualDisc) out.push(['🔵', 'Doble Disco', 'clic derecho lanza el segundo disco']);
            if (s.staticMastery) out.push(['⚡', 'Maestría Electrostática', 'quieto = carga · disco eléctrico en cadena']);
            if (s.analyticMind) out.push(['📐', 'Mente Analítica', 'trayectoria, rebotes perfectos, inducción']);
            if (s.mrUBike) out.push(['🔥', 'Bicicleta de Mr. U', 'el ciclo más rápido, estela de fuego']);
            if (s.permanence) out.push(['✨', 'Código de Permanencia', '+50 vida · +20% resistencia']);
            const sig = JSON.stringify(out) + [p.speedMultiplier, p.damageMultiplier, p.resistanceMultiplier, p.attackSpeedMultiplier].join();
            if (sig === this.lastSkills) return; this.lastSkills = sig;
            const box = this.$('skills-list'); box.innerHTML = '';
            if (!out.length) box.innerHTML = '<span class="no-buffs">Sin habilidades · cumple misiones</span>';
            for (const [ic, n, d] of out) { const e = document.createElement('div'); e.className = 'skill'; e.innerHTML = `<b>${ic} ${U.esc(n)}</b><span>${U.esc(d)}</span>`; box.appendChild(e); }
            const st = []; const f = (v) => Math.round((v - 1) * 100);
            if (p.speedMultiplier > 1.001) st.push(`VEL +${f(p.speedMultiplier)}%`); if (p.damageMultiplier > 1.001) st.push(`DAÑO +${f(p.damageMultiplier)}%`);
            if (p.resistanceMultiplier > 1.001) st.push(`RES +${f(p.resistanceMultiplier)}%`); if (p.attackSpeedMultiplier > 1.001) st.push(`ATQ +${f(p.attackSpeedMultiplier)}%`);
            this.$('stats-line').textContent = st.join(' · ');
        }
        update() {
            const g = this.g, p = g.player;
            const hp = Math.max(0, p.health / p.maxHealth);
            this.$('health-fill').style.width = (hp * 100) + '%'; this.$('health-text').textContent = Math.ceil(p.health) + '/' + p.maxHealth;
            this.$('health-fill').classList.toggle('low', hp < 0.3);
            this.$('player-name').textContent = p.name; this.$('diff-line').textContent = g.difficulty.label();
            this.$('grid-name').textContent = g.grid.name;
            const mode = p.mode === 'cycle' ? (g.battle.active ? 'BATALLA DE CICLOS' : 'CICLO DE LUZ') : p.mode === 'sailer' ? 'SOLAR SAILER' : 'A PIE';
            this.$('mode-text').textContent = mode;
            const loc = p.interior ? p.interior.name : (g.nearLocation() ? g.nearLocation().name : 'Grid abierta');
            this.$('loc-text').textContent = loc;
            const cb = this.$('charge-wrap'); cb.style.display = p.skills.staticMastery ? 'block' : 'none';
            if (p.skills.staticMastery) { this.$('charge-fill').style.width = (p.charge * 100) + '%'; this.$('charge-fill').classList.toggle('full', p.charge >= 0.99); }
            // aviso superior
            const ban = this.$('banner'); const t = g.battle.active ? g.battle.hudText() : (g.duel.active ? `DUELO DE DISCOS · OLEADA ${g.duel.wave}/3 · ENEMIGOS: ${g.combat.enemies.filter(e => e.tag === 'duel').length}` : '');
            ban.textContent = t; ban.style.display = t ? 'block' : 'none';
            // prompt de interacción
            const it = g.interactTarget(); const pr = this.$('interact-prompt');
            if (it) { pr.textContent = it.text; pr.style.display = 'block'; } else pr.style.display = 'none';
            // discos
            const d = g.combat.discs; this.$('disc1').classList.toggle('ready', d[0].state === 'ready');
            const d2 = this.$('disc2'); d2.style.display = p.skills.dualDisc ? 'inline-block' : 'none'; d2.classList.toggle('ready', d[1].state === 'ready');
            this.refreshSkills(); g.market.refreshBar();
            this.minimap();
        }
        minimap() {
            const g = this.g, c = this.mctx, S = 200, p = g.player;
            c.clearRect(0, 0, S, S); c.fillStyle = 'rgba(0,6,12,0.85)'; c.fillRect(0, 0, S, S);
            const th = G.THEME[g.era];
            if (p.interior) {
                const it = p.interior, k = (S - 20) / Math.max(it.w, it.h), ox = (S - it.w * k) / 2, oy = (S - it.h * k) / 2;
                c.strokeStyle = th.glow; c.strokeRect(ox, oy, it.w * k, it.h * k);
                for (const e of it.elements) { c.fillStyle = U.rgba(th.glow, 0.25); if (e.t === 'box') c.fillRect(ox + e.x * k, oy + e.y * k, e.w * k, e.h * k); else { c.beginPath(); c.arc(ox + e.x * k, oy + e.y * k, e.r * k, 0, 7); c.fill(); } }
                c.fillStyle = '#7DFF9B'; c.fillRect(ox + it.exit.x * k - 4, oy + it.exit.y * k - 2, 8, 4);
                for (const n of g.visibleNPCs()) { c.fillStyle = n.special ? '#FFD84A' : '#fff'; c.fillRect(ox + n.x * k - 2, oy + n.y * k - 2, 4, 4); }
                c.fillStyle = p.color; c.beginPath(); c.arc(ox + p.x * k, oy + p.y * k, 3.5, 0, 7); c.fill();
                return;
            }
            const b = g.grid, k = S / Math.max(b.w, b.h);
            for (const r of b.regions) { c.fillStyle = r.type === 'sea' ? 'rgba(10,80,140,0.55)' : 'rgba(80,50,140,0.4)'; c.fillRect(r.rect[0] * k, r.rect[1] * k, (r.rect[2] - r.rect[0]) * k, (r.rect[3] - r.rect[1]) * k); }
            for (const l of TG.LOCATIONS[g.era]) {
                if (l.hidden && !g.discovered.has(l.id)) continue;
                c.fillStyle = G.facColor(l, th, g.era); c.globalAlpha = g.discovered.has(l.id) ? 1 : 0.55;
                c.beginPath(); c.arc(l.x * k, l.y * k, Math.max(2, l.r * k * 0.5), 0, 7); c.fill(); c.globalAlpha = 1;
            }
            for (const pt of TG.PORTALS[g.era]) { c.strokeStyle = pt.color; c.beginPath(); c.moveTo(pt.x * k, pt.y * k - 4); c.lineTo(pt.x * k + 4, pt.y * k); c.lineTo(pt.x * k, pt.y * k + 4); c.lineTo(pt.x * k - 4, pt.y * k); c.closePath(); c.stroke(); }
            for (const e of g.combat.enemies) { c.fillStyle = '#FF3A3A'; c.fillRect(e.x * k - 1.5, e.y * k - 1.5, 3, 3); }
            for (const n of g.visibleNPCs()) if (n.special && g.discovered.has(n.interiorId)) { c.fillStyle = '#FFD84A'; c.fillRect(n.x * k - 2, n.y * k - 2, 4, 4); }
            if (g.special.mrU.active && g.special.mrU.era === g.era) { c.fillStyle = '#FF7A1A'; c.beginPath(); c.arc(g.special.mrU.x * k, g.special.mrU.y * k, 3, 0, 7); c.fill(); }
            // vista
            const cam = g.camera; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.strokeRect(cam.ox * k, cam.oy * k, cam.w * k, cam.h * k);
            c.fillStyle = p.color; c.beginPath(); c.arc(p.x * k, p.y * k, 3.5, 0, 7); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.arc(p.x * k, p.y * k, 5.5, 0, 7); c.stroke(); c.lineWidth = 1;
        }
    }
    TG.HUD = HUD;

    // ================================================================= ATLAS
    class Atlas {
        constructor(g) {
            this.g = g; this.tab = 'places';
            document.getElementById('atlas-close').addEventListener('click', () => TG.Modals.close('atlas-modal'));
            document.querySelectorAll('#atlas-tabs button').forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); }));
        }
        open() { this.render(); TG.Modals.open('atlas-modal'); if (this.g.tutorial) this.g.tutorial.event('atlas'); }
        render() {
            const g = this.g, box = document.getElementById('atlas-list'); box.innerHTML = '';
            document.querySelectorAll('#atlas-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === this.tab));
            const total = TG.totalLocations, seen = g.discovered.size;
            const totalN = TG.NPCS.length + 1, met = g.met.size;
            document.getElementById('atlas-count').textContent = this.tab === 'places' ? `Lugares descubiertos: ${seen}/${total}` : `Personajes conocidos: ${met}/${totalN}`;
            for (const era of TG.WORLD_ORDER) {
                const h = document.createElement('h3'); h.textContent = TG.ERA_NAME[era].toUpperCase(); h.style.color = TG.GRIDS[era].color; box.appendChild(h);
                if (this.tab === 'places') {
                    const bySrc = {};
                    for (const l of TG.LOCATIONS[era]) (bySrc[l.src] = bySrc[l.src] || []).push(l);
                    for (const src of Object.keys(bySrc)) {
                        const s = document.createElement('div'); s.className = 'atlas-src'; s.textContent = src; box.appendChild(s);
                        for (const l of bySrc[src]) {
                            const known = g.discovered.has(l.id), secret = l.hidden && !known;
                            const d = document.createElement('div'); d.className = 'atlas-row' + (known ? ' seen' : '');
                            d.innerHTML = `<b>${known ? '◆' : '◇'} ${U.esc(secret ? '??? (lugar secreto)' : l.name)}</b><span>${U.esc(secret ? 'Rumores hablan de un sitio oculto en esta Grid…' : l.desc)}</span>`;
                            box.appendChild(d);
                        }
                    }
                } else {
                    const list = TG.NPCS.filter(n => n.grid === era);
                    for (const n of list) {
                        const known = g.met.has(n.id), d = document.createElement('div'); d.className = 'atlas-row' + (known ? ' seen' : '');
                        d.innerHTML = `<b>${known ? n.avatar : '❔'} ${U.esc(known ? n.name : '???')}</b><span>${U.esc(known ? n.role + ' · ' + n.src : 'Aún no lo has conocido')}</span>`;
                        box.appendChild(d);
                    }
                    if (era === '2025') {
                        const known = g.met.has('mr_u'), d = document.createElement('div'); d.className = 'atlas-row' + (known ? ' seen' : '');
                        d.innerHTML = `<b>${known ? '🔥' : '❔'} ${known ? 'Mr. U' : '???'}</b><span>${known ? 'Jinete de la última cabalgata · aparece en cualquier Grid' : 'Dicen que aparece al azar en cualquier Grid…'}</span>`;
                        box.appendChild(d);
                    }
                }
            }
        }
    }
    TG.Atlas = Atlas;

    // ============================================================ ARENA MODAL
    class ArenaUI {
        constructor(g) {
            this.g = g; this.loc = null; this.bet = 0;
            document.getElementById('arena-close').addEventListener('click', () => TG.Modals.close('arena-modal'));
const go = (fn) => { const bet = this.bet; if (bet > 0 && !g.economy.stake(bet)) { TG.Toast.show('No tienes bits para esa apuesta.', 'warn'); return; } TG.Modals.close('arena-modal'); fn(bet); };
            document.getElementById('arena-disc').addEventListener('click', () => go((b) => g.duel.start(this.loc, b)));
            document.getElementById('arena-cycle').addEventListener('click', () => go((b) => g.battle.start(this.loc, b)));
            document.querySelectorAll('#bet-row button').forEach(b => b.addEventListener('click', () => { this.bet = +b.dataset.bet; this.refreshBets(); TG.sound.ui(); }));
        }
        refreshBets() { const bits = this.g.player.bits; document.querySelectorAll('#bet-row button').forEach(b => { const v = +b.dataset.bet; b.disabled = v > bits; b.classList.toggle('on', v === this.bet); }); }
        open(loc) {
            this.loc = loc; this.bet = 0; this.refreshBets();
            document.getElementById('arena-title').textContent = loc.name.toUpperCase();
            document.getElementById('arena-desc').textContent = loc.desc;
            document.getElementById('arena-disc').style.display = loc.arena === 'cycle' ? 'none' : '';
            document.getElementById('arena-cycle').style.display = loc.arena === 'disc' ? 'none' : '';
            TG.Modals.open('arena-modal');
        }
    }
    TG.ArenaUI = ArenaUI;

    // ================================================================== MENÚ / PERSONALIZACIÓN
    const COLORS = ['#00D4FF', '#FF8A1F', '#7DFF9B', '#E04DFF', '#FFE54A', '#FF1744', '#FFFFFF'];
    const PREFS = 'tron_prefs';
    const HEX = /^#[0-9a-fA-F]{6}$/;
    TG.Menu = {
        color: COLORS[0], form: 'human', cv: null,
        loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS)) || {}; } catch (e) { return {}; } },
        savePrefs() { try { localStorage.setItem(PREFS, JSON.stringify({ name: document.getElementById('name-input').value.trim(), color: this.color, form: this.form, skip: document.getElementById('skip-tutorial').checked })); } catch (e) { /* sin almacenamiento */ } },
        setColor(c) {
            if (!HEX.test(c)) return; this.color = c; document.documentElement.style.setProperty('--theme-primary', c);
            document.querySelectorAll('.color-opt').forEach(x => x.classList.toggle('on', x.dataset.c.toLowerCase() === c.toLowerCase()));
            const pick = document.getElementById('color-custom'); if (pick && pick.value.toLowerCase() !== c.toLowerCase()) pick.value = c;
        },
        setForm(f) { this.form = G.validForm(f); document.querySelectorAll('.form-opt').forEach(x => x.classList.toggle('on', x.dataset.f === this.form)); },
        init(onStart, onContinue, hasSave) {
            const pr = this.loadPrefs();
            const box = document.getElementById('color-options'); box.innerHTML = '';
            COLORS.forEach((c) => {
                const b = document.createElement('button'); b.className = 'color-opt'; b.dataset.c = c; b.style.setProperty('--c', c); b.title = c;
                b.addEventListener('click', () => { this.setColor(c); TG.sound.ui(); }); box.appendChild(b);
            });
            const pick = document.getElementById('color-custom'); pick.addEventListener('input', () => this.setColor(pick.value));
            const fb = document.getElementById('form-options'); fb.innerHTML = '';
            for (const f of G.FORMS) {
                const b = document.createElement('button'); b.className = 'form-opt'; b.dataset.f = f.id; b.title = f.name; b.innerHTML = `<i>${f.glyph}</i><span>${f.name}</span>`;
                b.addEventListener('click', () => { this.setForm(f.id); TG.sound.ui(); }); fb.appendChild(b);
            }
            if (pr.name) document.getElementById('name-input').value = pr.name;
            document.getElementById('skip-tutorial').checked = !!pr.skip;
            this.setColor(HEX.test(pr.color || '') ? pr.color : COLORS[0]); this.setForm(pr.form || 'human');
            this.cv = document.getElementById('preview-canvas'); this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.cv.width = Math.round(240 * this.dpr); this.cv.height = Math.round(240 * this.dpr);
            document.getElementById('start-btn').addEventListener('click', () => {
                TG.sound.ensure(); this.savePrefs();
                onStart(document.getElementById('name-input').value.trim() || 'User_Alpha', this.color, this.form, document.getElementById('skip-tutorial').checked, document.getElementById('diff-select').value);
            });
            const cb = document.getElementById('continue-btn'); cb.style.display = hasSave ? 'inline-block' : 'none';
            cb.addEventListener('click', () => { TG.sound.ensure(); onContinue(); });
            const stat = document.getElementById('ai-status');
            const upd = () => { stat.textContent = '🧠 ' + TG.AI.label(); stat.className = TG.AI.online ? 'ok' : 'off'; };
            TG.AI.health().then(upd); document.getElementById('ai-retry').addEventListener('click', () => { stat.textContent = 'Comprobando…'; TG.AI.health().then(upd); });
        },
        // vista previa en vivo del programa con el color y la forma elegidos
        drawPreview(t) {
            const cv = this.cv; if (!cv || document.getElementById('menu-screen').classList.contains('hidden')) return;
            const c = cv.getContext('2d'), W = 240, H = 240; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, W, H);
            const bg = c.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.62, 150); bg.addColorStop(0, U.rgba(this.color, 0.22)); bg.addColorStop(1, 'rgba(0,0,0,0.0)'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
            c.beginPath(); c.ellipse(W / 2, 188, 76, 22, 0, 0, Math.PI * 2); G.stroke(c, this.color, 1.4, 0.55);
            c.beginPath(); c.ellipse(W / 2, 188, 50, 14, 0, 0, Math.PI * 2); G.stroke(c, this.color, 1, 0.35);
            const f = Math.floor(t / 2.6) % 2 ? 1 : -1;
            G.playerSprite(c, W / 2, 186, { form: this.form, c: this.color, a: '#ffffff', f, t, ph: 0, moving: false, look: 'visor', s: this.form === 'human' ? 1.75 : 1.85 });
        },
        show() { document.getElementById('menu-screen').classList.remove('hidden'); },
        hide() { document.getElementById('menu-screen').classList.add('hidden'); }
    };

})(window.TG = window.TG || {});
