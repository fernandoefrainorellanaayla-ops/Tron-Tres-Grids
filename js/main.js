/* ==========================================================================
   TRON: LAS TRES GRIDS — main.js
   Clase Game: bucle principal, mundo, interiores, portales con digitalización,
   muerte/respawn y guardado. Arranque al final del archivo.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;
    const SAVE_KEY = 'tron_three_grids_v2';

    class Game {
        constructor() {
            TG.game = this;
            this.cm = new TG.CanvasManager(); this.ctx = this.cm.ctx;
            this.camera = new TG.Camera(); this.camera.resize(this.cm.w, this.cm.h);
            this.cm.onResize.push((w, h) => this.camera.resize(w, h));
            TG.sound = this.sound = new TG.Sound();
            this.input = new TG.Input(this.cm.canvas);
            this.particles = new TG.Particles(); this.post = new TG.PostFX(this.cm); this.ambient = new TG.Ambient(this.cm); this.digi = new TG.Digitizer(this.cm);
            TG.resolveNPCs(); this.npcs = TG.NPCS.map(d => new TG.NPC(Object.assign({}, d)));
            this.player = new TG.Player(); this.era = '1982'; this.grid = TG.GRIDS['1982']; G.prepareGrid(this.grid);
            this.discovered = new Set(); this.met = new Set();
            this.state = 'intro'; this.time = 0; this.paused = false; this.transition = false; this.activeVehicle = null;
            this.raise = null; this.fadeA = 0; this.deathT = 0; this.autoSaveT = 45; this.last = performance.now(); this.slowFrames = 0;
            try { if (localStorage.getItem('tron_bloom') === '0') this.post.enabled = false; } catch (e) { /* sin almacenamiento */ }

            this.economy = new TG.Economy(this); this.quests = new TG.QuestEngine(this); this.shop = new TG.Shop(this);
            this.dialogue = new TG.Dialogue(this); this.combat = new TG.Combat(this); this.duel = new TG.DiscDuel(this);
            this.battle = new TG.CycleBattle(this); this.events = new TG.Events(this); this.special = new TG.Special(this);
            this.hud = new TG.HUD(this); this.atlas = new TG.Atlas(this); this.arenaUI = new TG.ArenaUI(this); this.intro = new TG.Intro(this); this.tutorial = new TG.Tutorial(this); this.difficulty = new TG.Difficulty(this); this.missions = new TG.Missions(this); this.companions = new TG.Companions(this); this.abilities = new TG.Abilities(this); this.betrayalFx = 0; this.market = new TG.Market(this); this.auraT = 0;
            this.camera.follow(this.player);

            const inp = this.input;
            inp.on.mount = () => this.toggleMount();
            inp.on.interact = () => this.interact();
            inp.on.quests = () => { if (this.state === 'play') this.quests.open(); };
            inp.on.atlas = () => { if (this.state === 'play') this.atlas.open(); };
            inp.on.mute = () => this.toggleMute();
            inp.on.bloom = () => this.toggleBloom(true);
            inp.on.abY = () => this.abilities.use('rewrite'); inp.on.abF = () => this.abilities.use('faraday'); inp.on.abH = () => this.abilities.use('code'); inp.on.portal = () => this.abilities.openPortal(); inp.on.contacts = () => this.companions.open();
            inp.on.market = () => this.market.open();
            ['heal', 'emp', 'shield', 'boost'].forEach((id, i) => { inp.on['item' + (i + 1)] = () => this.market.useItem(id); });
            inp.on.disc1 = () => this.fireDisc(0);
            inp.on.disc2 = () => this.fireDisc(1);
            inp.on.escape = () => { TG.Modals.closeTop(); };
            inp.on.debugU = () => { if (this.state === 'play') this.special.spawnMrU(true); };
            const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
            on('btn-quests', () => this.quests.open()); on('btn-atlas', () => this.atlas.open()); on('btn-mute', () => this.toggleMute());
            on('btn-save', () => this.saveGame(false)); on('quest-close', () => TG.Modals.close('quest-modal'));
            window.addEventListener('beforeunload', () => { if (this.state === 'play') this.saveGame(true); });
            requestAnimationFrame((ts) => this.loop(ts));
        }

        // ------------------------------------------------------------------ utilidades
        currentBounds() { const p = this.player; return p.interior ? { w: p.interior.w, h: p.interior.h } : { w: this.grid.w, h: this.grid.h }; }
        areaKey() { return this.player.interior ? this.player.interior.id : this.era; }
        // ---- fases de la Grid de 2010: antes y después de la traición de Clu
        phase2010() { return this.quests.isDone('fb_betrayal') ? 'post' : 'pre'; }
        cluLevel() { if (this.phase2010() === 'post') return 1; return Math.min(0.85, TG.CLU_STAGE_QUESTS.filter(id => this.quests.isDone(id)).length * 0.17); }
        applyPhase() {
            G.clu = this.cluLevel(); const th = G.THEME['2010'];
            if (this.phase2010() === 'post') Object.assign(th, { bg2: '#0a121a', vignette: '8,4,0', major: '#7ffaff' }); else Object.assign(th, { bg2: '#0a2433', vignette: '0,6,14', major: '#c9fdff' });
        }
        triggerBetrayal() {
            this.betrayalFx = 3.2; this.camera.shake(26); TG.sound.eventAlert(); TG.sound.digitize(1.5); this.applyPhase();
            TG.Reveal.show({ kicker: 'LA TRAICIÓN DE CLU', title: 'La Grid cambia para siempre', html: '<p>Clu ha tomado el control. Tron cae en combate y lo dan por muerto; Flynn debe huir. Los estandartes de Clu cubren Tron City, los Guardias Negros patrullan las calles y los ISO son perseguidos.</p><p class="dim">La Grid de 2010 sigue siendo la Grid de Flynn, pero ahora con la presencia de Clu en cada rincón. Escolta a Flynn hasta su refugio.</p>', color: '#FF9A1F', button: 'CONTINUAR' });
        }
        onQuestComplete(q) {
            this.applyPhase(); this.difficulty.recalc(); this.abilities.lastBar = ''; this.hud.lastSkills = '';
            if (q.id === 'fb_betrayal') { this.triggerBetrayal(); this.companions.addFriend('tron_2010', 30); }
            if (['fa_1', 'fa_2'].includes(q.id)) this.companions.addFriend('tron_82', 25);
            if (['fa_1', 'fa_3'].includes(q.id)) this.companions.addFriend('flynn_82', 25);
        }
        visibleNPCs() { const a = this.player.interior ? this.player.interior.id : null; return this.npcs.filter(n => n.grid === this.era && n.interiorId === a && (!n.phase || this.era !== '2010' || n.phase === this.phase2010())); }
        nearLocation() {
            if (this.player.interior) return null; const p = this.player; let best = null, bd = 1e9;
            for (const l of TG.LOCATIONS[this.era]) { if (l.hidden && !this.discovered.has(l.id)) continue; const d = Math.hypot(p.x - l.x, p.y - l.y) - l.r; if (d < 80 && d < bd) { bd = d; best = l; } }
            return best;
        }
        dockNear() { const p = this.player; if (p.interior) return null; return TG.LOCATIONS[this.era].find(l => l.dock && Math.hypot(p.x - l.x, p.y - l.y) < l.r + 80) || null; }
        setEra(era) { this.era = era; this.grid = TG.GRIDS[era]; G.prepareGrid(this.grid); }
        toggleBloom(announce) {
            this.post.enabled = !this.post.enabled; this.slowFrames = 0;
            try { localStorage.setItem('tron_bloom', this.post.enabled ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
            if (announce) TG.Toast.show(this.post.enabled ? '✨ Bloom activado (calidad alta)' : 'Bloom desactivado (más rápido)', 'info');
        }
        toggleMute() { this.sound.ensure(); this.sound.setMuted(!this.sound.muted); const b = document.getElementById('btn-mute'); if (b) b.textContent = this.sound.muted ? '🔇' : '🔊'; }

        // ------------------------------------------------------------------ inicio / carga
        startNew(name, color, form, skipTutorial, diff) {
            const p = this.player = new TG.Player(); p.name = name; p.color = color; p.form = G.validForm(form); this.camera.follow(p);
            this.quests = new TG.QuestEngine(this); this.discovered = new Set(); this.met = new Set();
            this.shop = new TG.Shop(this); this.special.mrU = { active: false, x: 0, y: 0, era: null, timer: TG.MRU_FIRST_SPAWN, life: 0, gone: false, t: 0 };
            this.special.props = []; this.combat.reset(); this.economy.updateHUD(); this.missions.reset(); this.companions.list = []; this.companions.temp = []; this.companions.friend = {}; this.abilities.charges = TG.PORTAL_MAX; this.abilities.visited = new Set(); this.difficulty.minutes = 0; this.difficulty.set(diff || 'normal'); this.applyPhase();
            if (skipTutorial) { this.setEra('1982'); p.x = this.grid.spawn.x; p.y = this.grid.spawn.y; this.tutorial.stop(); for (const id of TG.AUTO_QUESTS) this.quests.accept(id, true); this.begin(true); }
            else { this.setEra('2025'); p.x = this.grid.spawn.x; p.y = this.grid.spawn.y; this.tutorial.arm(); this.begin(true, { tutorial: true }); }
        }
        // El entrenamiento termina (o se salta): se envía al programa a la Grid de 1982 con digitalización
        finishTutorial(skipped) {
            if (this.transition || !this.tutorial.active) return;
            this.tutorial.hide(); TG.Modals.closeAll(); this.dialogue.close(); this.transition = true; TG.sound.portal();
            this.digi.start({
                mode: 'transfer', from: '2025', to: '1982', label: skipped ? 'ENVIANDO PROGRAMA A LA GRID' : 'ENTRENAMIENTO COMPLETADO', sub: `${this.player.name.toUpperCase()}  →  ${TG.ERA_NAME['1982'].toUpperCase()}`,
                onMid: () => this.enterRealGame(),
                onDone: () => { this.transition = false; TG.Toast.show(TG.platform && TG.platform.touch ? 'Joystick: moverte · DISCO: atacar (apunta solo) · E: interactuar · CICLO: moto · MISIONES / MAPA arriba' : 'WASD mover · clic/ESPACIO disco · E interactuar · V ciclo · Q misiones · M atlas · I mejoras · 1-4 consumibles', 'info', 9000); this.saveGame(true); }
            });
        }
        enterRealGame() {
            const p = this.player; this.tutorial.stop(); this.duel.cancel(); this.battle.cancel();
            this.setEra('1982'); p.mode = 'foot'; p.interior = null; this.activeVehicle = null; p.dead = false; p.maxHealth = 100; p.health = 100; p.bits = 0; p.charge = 0; p.cycleDist = 0; p.invuln = 0;
            p.x = this.grid.spawn.x; p.y = this.grid.spawn.y; this.combat.reset(); this.missions.reset(); this.abilities.visited = new Set(['1982']);
            this.discovered = new Set(); this.met = new Set(); this.quests = new TG.QuestEngine(this); for (const id of TG.AUTO_QUESTS) this.quests.accept(id, true);
            this.special.mrU = { active: false, x: 0, y: 0, era: null, timer: TG.MRU_FIRST_SPAWN, life: 0, gone: false, t: 0 }; this.special.props = [];
            this.economy.updateHUD(); const b = this.currentBounds(); this.camera.snap(b.w, b.h);
            this.ambient.reset('1982'); this.hud.applyTheme('1982'); this.sound.setAmbient('1982'); this.hud.lastSkills = ''; this.hud.refreshSkills(); this.quests.refresh();
        }
        hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
        loadGame() {
            let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { d = null; }
            if (!d || (d.v !== 2 && d.v !== 3)) return false;
            if (d.v === 2) { d.x *= 2; d.y *= 2; d.v = 3; }   // los mapas ahora son el doble de grandes
            const p = this.player = new TG.Player(); this.camera.follow(p);
            p.name = d.name; p.color = d.color; p.form = G.validForm(d.form); p.bits = d.bits; p.maxHealth = d.maxHealth; p.health = d.maxHealth;
            p.speedMultiplier = d.mult.speed; p.damageMultiplier = d.mult.damage; p.resistanceMultiplier = d.mult.res; p.attackSpeedMultiplier = d.mult.atk;
            Object.assign(p.skills, d.skills); p.fragments = d.fragments; p.cycleSpeed = d.cycleSpeed; this.market.restore(d.eco); this.difficulty.restore(d.diff); this.companions.restore(d.comp); this.abilities.restore(d.abil);
            this.era = d.era; this.setEra(d.era); p.x = d.x; p.y = d.y;
            this.quests = new TG.QuestEngine(this); this.quests.restore(d.quests || {});
            this.discovered = new Set(d.discovered || []); this.met = new Set(d.met || []);
            this.shop = new TG.Shop(this); (d.bought || []).forEach(x => this.shop.bought.add(x));
            this.special.mrU = { active: false, x: 0, y: 0, era: null, timer: TG.MRU_FIRST_SPAWN, life: 0, gone: !!d.mruGone, t: 0 };
            this.special.props = []; this.combat.reset(); this.economy.updateHUD(); this.tutorial.stop(); this.begin(false); return true;
        }
        saveGame(silent) {
            if (this.state !== 'play') return; if (this.tutorial.active) { if (!silent) TG.Toast.show('Termina el entrenamiento para poder guardar.', 'warn'); return; }
            const p = this.player;
            const pos = p.interior ? { x: p.interior.loc.x, y: p.interior.loc.y + p.interior.loc.r + 45 } : { x: p.x, y: p.y };
            const d = { v: 3, name: p.name, color: p.color, form: p.form, era: this.era, x: pos.x, y: pos.y, bits: p.bits, maxHealth: p.maxHealth, mult: { speed: p.speedMultiplier, damage: p.damageMultiplier, res: p.resistanceMultiplier, atk: p.attackSpeedMultiplier },
                skills: p.skills, fragments: p.fragments, cycleSpeed: p.cycleSpeed, eco: this.market.serialize(), diff: this.difficulty.serialize(), comp: this.companions.serialize(), abil: this.abilities.serialize(), quests: this.quests.serialize(), discovered: [...this.discovered], met: [...this.met], bought: [...this.shop.bought], mruGone: this.special.mrU.gone };
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); if (!silent) TG.Toast.show('💾 Partida guardada', 'good'); } catch (e) { if (!silent) TG.Toast.show('No se pudo guardar (almacenamiento bloqueado)', 'warn'); }
        }
        begin(isNew, opts) {
            opts = opts || {};
            TG.Menu.hide(); this.state = 'play'; document.body.classList.add('playing');
            const p = this.player; p.mode = 'foot'; p.interior = null; this.activeVehicle = null; p.dead = false; p.health = p.maxHealth; this.market.rollDeal(); this.market.lastBar = ''; if (TG.platform && TG.platform.low && !this._lowSet) { this._lowSet = true; this.post.enabled = false; }   // teléfono: gráficos algo más ligeros this.applyPhase(); this.difficulty.recalc(); this.abilities.visited.add(this.era);
            this.hud.applyTheme(this.era); this.ambient.reset(this.era); this.sound.ensure(); this.sound.setAmbient(this.era);
            const b = this.currentBounds(); this.camera.snap(b.w, b.h);
            this.hud.lastSkills = ''; this.hud.refreshSkills(); this.quests.refresh(); this.sound.setMuted(this.sound.muted);
            this.transition = true;
            this.digi.start({
                mode: 'boot', to: this.era, label: opts.tutorial ? 'CARGANDO ENTORNO DE ENTRENAMIENTO' : 'DIGITALIZANDO USUARIO',
                sub: opts.tutorial ? `${p.name.toUpperCase()} · DILLINGER SYSTEMS · CAMPO DE ENTRENAMIENTO` : `${p.name.toUpperCase()} · ${TG.ERA_NAME[this.era].toUpperCase()}`,
                beam: { x: p.x - this.camera.ox, y: p.y - this.camera.oy + 6 },
                onDone: () => { this.transition = false; if (opts.tutorial) this.tutorial.begin(); else if (isNew) TG.Toast.show(TG.platform && TG.platform.touch ? 'Joystick: moverte · DISCO: atacar (apunta solo) · E: interactuar · CICLO: moto · MISIONES / MAPA arriba' : 'WASD mover · clic izq / ESPACIO lanzar disco · E interactuar · V ciclo de luz · Q misiones · M atlas', 'info', 9000); }
            });
        }

        // ------------------------------------------------------------------ interacción
        fireDisc(slot) {
            if (this.state !== 'play' || this.transition || this.paused || this.battle.active) return;
            const wx = this.input.mouse.x + this.camera.ox, wy = this.input.mouse.y + this.camera.oy;
            this.combat.throwDisc(slot, wx, wy);
        }
        toggleMount() {
            const p = this.player; if (this.state !== 'play' || this.transition || p.dead || this.battle.active) return;
            if (p.interior) { TG.Toast.show('No puedes montar en el interior.', 'warn'); return; }
            if (p.mode === 'foot') {
                const dock = this.dockNear();
                if (dock) { p.mode = 'sailer'; this.activeVehicle = new TG.SolarSailer(p); TG.sound.portal(); TG.Toast.show('⛵ Solar Sailer: ← → girar · ↑ avanzar · V desmontar', 'info', 4000); }
                else { p.mode = 'cycle'; this.activeVehicle = new TG.LightCycle(p, p.skills.mrUBike); TG.sound.cycleStart(); TG.Toast.show(p.skills.mrUBike ? '🔥 Bicicleta de Mr. U: ← → girar · ↑ acelerar · ↓ frenar' : '🏍 Ciclo de luz: ← → girar · ↑ acelerar · ↓ frenar', 'info', 3800); }
            } else { p.mode = 'foot'; this.activeVehicle = null; }
        }
        interactTarget() {
            const p = this.player;
            if (this.state !== 'play' || this.transition || p.dead || this.paused || p.mode !== 'foot' || this.battle.active || TG.state.modalOpen) return null;
            const cands = []; const vp = this.missions.hasValvePrompt(); if (vp) cands.push({ d: -50, text: vp, run: () => this.missions.tryInteract() });
            if (!p.interior && this.special.nearMrU()) cands.push({ d: 0, text: '[E] Hablar con Mr. U', run: () => { this.met.add('mr_u'); this.special.talkMrU(); } });
            const area = p.interior ? p.interior.id : null;
            for (const n of this.npcs) {
                if (n.grid !== this.era || n.interiorId !== area) continue;
                const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < 95) cands.push({ d: d - 30, text: `[E] Hablar con ${n.name}`, run: () => { this.met.add(n.id); this.dialogue.open(n); } });
            }
            if (p.interior) {
                const ex = p.interior.exit; const d = Math.hypot(ex.x - p.x, ex.y - p.y);
                if (d < 70) cands.push({ d: d - 20, text: '[E] Salir', run: () => this.exitInterior() });
            } else {
                if (!this.tutorial.active) for (const pt of TG.PORTALS[this.era]) { const d = Math.hypot(pt.x - p.x, pt.y - p.y); if (d < 90) cands.push({ d: d - 40, text: `[E] ${pt.name}`, run: () => this.switchGrid(pt.to) }); }
                for (const l of TG.LOCATIONS[this.era]) {
                    if (l.hidden && !this.discovered.has(l.id)) continue;
                    const d = Math.hypot(l.x - p.x, l.y - p.y) - l.r; if (d > 48) continue;
                    if (l.interior) cands.push({ d, text: `[E] Entrar: ${l.name}`, run: () => this.enterInterior(l) });
                    else if (l.arena) cands.push({ d, text: `[E] ${l.name}: elegir combate`, run: () => this.arenaUI.open(l) });
                    else if (l.dock) cands.push({ d, text: '[V] Subir al Solar Sailer', run: () => this.toggleMount() });
                }
            }
            if (!cands.length) return null; cands.sort((a, b) => a.d - b.d); return cands[0];
        }
        interact() { if (this.state !== 'play') return; const t = this.interactTarget(); if (t) t.run(); }

        enterInterior(loc) {
            const p = this.player; if (this.battle.active || p.interior) return;
            const def = TG.getInterior(loc); p.interior = def; p.x = def.entry.x; p.y = def.entry.y; p.mode = 'foot'; this.activeVehicle = null;
            if (this.duel.active) this.duel.cancel();
            this.combat.reset(); this.missions.restart(); this.camera.snap(def.w, def.h); this.fadeA = 1; TG.sound.portal();
            const first = !this.discovered.has(loc.id); this.discovered.add(loc.id);
            TG.Toast.show(loc.hidden && first ? '✨ ¡LUGAR SECRETO DESCUBIERTO! ' + loc.name : 'Entras: ' + loc.name, loc.hidden && first ? 'good' : 'info', loc.hidden && first ? 5200 : 2600);
            this.quests.spawnT = 0.5; this.special.onAreaChange();
        }
        exitInterior() {
            const p = this.player, loc = p.interior.loc; this.dialogue.close();
            p.interior = null; p.x = loc.x; p.y = loc.y + loc.r + 48; this.combat.reset(); this.missions.restart();
            const b = this.currentBounds(); this.camera.snap(b.w, b.h); this.fadeA = 1; TG.sound.portal(); this.quests.spawnT = 0.5; this.special.onAreaChange();
        }
        switchGrid(to) {
            if (this.transition || this.state !== 'play') return;
            if (this.battle.active || this.duel.active) { TG.Toast.show('Termina el combate antes de cruzar un portal.', 'warn'); return; }
            const from = this.era, p = this.player; this.transition = true; this.dialogue.close(); TG.Modals.closeAll();
            if (p.mode !== 'foot') { p.mode = 'foot'; this.activeVehicle = null; }
            // ANTES de cruzar: el programa levanta el disco bajo un haz de luz (como Tron en el póster)
            this.raise = { t: 0, dur: 2.2, from, to }; TG.sound.portal(); TG.sound.charge(); TG.sound.tone(180, 2.0, 'sawtooth', 0.045, { slide: 1100 });
            this.particles.ring(p.x, p.y, TG.GRIDS[to] ? TG.GRIDS[to].color : p.color, 140);
        }
        updateRaise(dt) {
            const r = this.raise, p = this.player; r.t += dt; this.fadeA = 0;
            const k = U.smooth(r.t / 1.4), col = TG.GRIDS[r.to] ? TG.GRIDS[r.to].color : p.color;
            if (Math.random() < 0.9) this.particles.emit(p.x + U.rand(-18, 18), p.y - U.rand(0, 60), Math.random() < 0.4 ? '#ffffff' : col, 1, 2.2, { vy: -2.4, decay: 0.022 });
            if (r.t > 0.5 && Math.floor(r.t * 3) !== Math.floor((r.t - dt) * 3)) this.particles.ring(p.x, p.y + 4, col, 60 + 160 * k);
            this.camera.shake(r.t > 1.1 ? 3 + 7 * k : 0);
            if (r.t >= r.dur) {
                const { from, to } = r; this.raise = null; this.camera.shakeMag = 0;
                this.digi.start({
                    mode: 'transfer', from, to, label: 'TRANSFIRIENDO USUARIO', sub: `${TG.ERA_NAME[from].toUpperCase()}  →  ${TG.ERA_NAME[to].toUpperCase()}`,
                    onMid: () => this.doSwitch(to, from),
                    onDone: () => { this.transition = false; TG.Toast.show('Bienvenido a la ' + TG.ERA_NAME[to], 'good', 3800); this.saveGame(true); }
                });
            }
        }
        // anillo de luz + haz desde el cielo sobre el programa (póster de Tron / Legacy)
        drawRaise(ctx, cam, t) {
            const r = this.raise, p = this.player; if (!r) return;
            const cm = this.cm, x = p.x - cam.ox, y = p.y - cam.oy, col = TG.GRIDS[r.to] ? TG.GRIDS[r.to].color : p.color;
            const ring = U.smooth((r.t - 0.25) / 0.7), beam = U.smooth((r.t - 0.6) / 0.9), white = U.smooth((r.t - 1.75) / 0.45);
            const ry = y - 140 - 40 * ring;
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            if (beam > 0) {   // haz vertical que baja del cielo hasta el disco
                const w = 10 + 46 * beam, g = ctx.createLinearGradient(0, -200, 0, y - 60); g.addColorStop(0, U.rgba(col, 0.0)); g.addColorStop(0.35, U.rgba(col, 0.55 * beam)); g.addColorStop(1, U.rgba('#ffffff', 0.95 * beam));
                ctx.fillStyle = g; ctx.fillRect(x - w / 2, -200, w, y + 140); ctx.fillStyle = U.rgba('#ffffff', 0.7 * beam); ctx.fillRect(x - w * 0.18, -200, w * 0.36, y + 140);
                G.glow(ctx, x, y - 70, 130 * beam, '#ffffff', 0.5 * beam); G.glow(ctx, x, y + 6, 120 * beam, col, 0.45 * beam);
            }
            ctx.restore();
            if (ring > 0) {   // anillos concéntricos flotando sobre el disco
                for (let i = 0; i < 3; i++) { const rx = (70 - i * 17) * ring, ryy = rx * 0.26; ctx.beginPath(); ctx.ellipse(x, ry, rx, ryy, 0, 0, Math.PI * 2); G.stroke(ctx, i === 1 ? '#ffffff' : col, 2.6 - i * 0.5, 0.95 * ring); }
                G.glow(ctx, x, ry, 110 * ring, col, 0.35 * ring);
                for (let i = 0; i < 10; i++) { const a = t * 1.6 + i * 0.63, d = ((t * 0.9 + i * 0.17) % 1); ctx.fillStyle = U.rgba('#ffffff', (1 - d) * ring); ctx.fillRect(x + Math.cos(a) * 60 * (1 - d) - 1.5, ry + d * 150 - 1.5, 3, 3); }
            }
            if (!this.player.dead && white < 0.5) { ctx.save(); ctx.globalAlpha = 1 - white * 1.4; this.drawPlayer(ctx, cam, t); ctx.restore(); }   // la silueta se recorta contra la luz
            if (white > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,255,255,${0.95 * white})`; ctx.fillRect(0, 0, cm.canvas.width, cm.canvas.height); ctx.restore(); }
        }
        doSwitch(to, from) {
            const p = this.player; this.setEra(to); p.mode = 'foot'; p.interior = null; this.activeVehicle = null;
            const pt = TG.PORTALS[to].find(x => x.to === from);
            if (pt) { p.x = pt.x; p.y = pt.y + 120; } else { p.x = this.grid.spawn.x; p.y = this.grid.spawn.y; }
            this.combat.reset(); this.abilities.visited.add(to); this.applyPhase(); const b = this.currentBounds(); this.camera.snap(b.w, b.h);
            this.ambient.reset(to); this.hud.applyTheme(to); this.sound.setAmbient(to);
            this.quests.event('grid', { to }); this.quests.spawnT = 0.5; this.special.onAreaChange();
            if (this.special.mrU.active && this.special.mrU.era !== to) { this.special.mrU.active = false; this.special.mrU.timer = 30; }
        }

        // ------------------------------------------------------------------ eventos de juego
        onEnemyKilled(e) {
            this.missions.onKill(e);
            this.tutorial.event('kill', e);
            this.player.stats.kills++;
            if (e.reward) { const v = this.economy.earn(e.reward); this.combat.floater(e.x, e.y - 74, '+' + v + ' ◈', '#FFD84A'); }
            if (Math.random() < 0.25) this.combat.pickups.push({ x: e.x, y: e.y, kind: Math.random() < 0.6 ? 'bit' : 'health', v: 5, life: 14 });
            this.quests.event('kill', { enemy: e });
            if (e.kind === 'probe') this.quests.event('cprobe');
        }
        onPlayerDeath() {
            TG.sound.damage(); this.deathT = 2.4; TG.Toast.show('☠ Programa desintegrado… regenerando', 'bad', 3000);
            this.particles.voxels(this.player.x, this.player.y - 24, this.player.color, 40, 4); this.particles.ring(this.player.x, this.player.y, this.player.color, 140);
            this.camera.shake(14); this.dialogue.close();
        }
        respawn() {
            const p = this.player; p.dead = false; p.health = p.maxHealth; p.bits = Math.floor(p.bits * 0.85); p.charge = 0; p.invuln = 2;
            this.duel.cancel(); this.battle.cancel(); this.combat.reset(); this.missions.restart();
            p.interior = null; p.mode = 'foot'; this.activeVehicle = null; p.x = this.grid.spawn.x; p.y = this.grid.spawn.y;
            const b = this.currentBounds(); this.camera.snap(b.w, b.h); this.fadeA = 1; this.economy.updateHUD(); this.quests.spawnT = 0.5; this.special.onAreaChange(); this.tutorial.resetStep();
        }
        collideSolids() {
            const p = this.player; if (p.interior || p.dead) return;
            for (const l of TG.LOCATIONS[this.era]) {
                if (!l.solid) continue; const dx = p.x - l.x, dy = p.y - l.y, d = Math.hypot(dx, dy), m = l.r * 0.58 + 18;
                if (d < m && d > 0.01) { p.x = l.x + dx / d * m; p.y = l.y + dy / d * m; if (this.activeVehicle) this.activeVehicle.speed *= (p.skills.pid ? 0.85 : 0.6); }
            }
        }

        // ------------------------------------------------------------------ bucle
        loop(ts) {
            requestAnimationFrame((t) => this.loop(t));
            const raw = (ts - this.last) / 1000 || 0.016;
            const dt = Math.min(0.05, raw); this.last = ts; this.time += dt;
            // PC lento: tras ~3 s seguidos por debajo de 20 fps se desactiva el bloom (la tecla B lo reactiva)
            if (this.state === 'play' && this.post.enabled && raw < 0.5) { this.slowFrames = raw > 0.05 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2); if (this.slowFrames > 90) { this.toggleBloom(false); TG.Toast.show('Rendimiento bajo: bloom desactivado automáticamente (pulsa B para activarlo)', 'warn', 6000); } }
            this.digi.update(dt * 1000);
            document.body.classList.toggle('digitizing', this.digi.active || !!this.raise);
            if (this.state === 'play' && !this.paused) {
                if (this.digi.active) { this.particles.update(); this.ambient.update(this.time); }
                else this.update(dt);
            } else if (this.state === 'menu') { this.ambient.update(this.time); this.particles.update(); }
            else if (this.state === 'intro') { this.intro.update(dt); this.ambient.update(this.time); }
            this.render();
        }
        update(dt) {
            if (this.raise) { this.updateRaise(dt); this.particles.update(); this.ambient.update(this.time); return; }
            const p = this.player, b = this.currentBounds();
            this.fadeA = Math.max(0, this.fadeA - dt * 2.6);
            if (p.dead) { this.deathT -= dt; if (this.deathT <= 0) this.respawn(); }
            else if (this.battle.active) { p.hurt = Math.max(0, p.hurt - dt * 2.2); this.battle.update(dt); }
            else if (p.mode === 'foot') p.update(dt, this.input, b);
            else if (this.activeVehicle) { this.activeVehicle.update(dt, this.input, b, this); p.hurt = Math.max(0, p.hurt - dt * 2.2); p.invuln = Math.max(0, p.invuln - dt); }
            this.collideSolids();
            this.special.updateAbilities(dt); this.tutorial.update(dt); this.missions.update(dt); this.companions.update(dt); this.abilities.update(dt); this.difficulty.update(dt); this.betrayalFx = Math.max(0, this.betrayalFx - dt); this.market.update(dt); this.updateAura(dt);
            this.combat.update(dt); this.duel.update();
            for (const n of this.visibleNPCs()) n.update(dt, this);
            if (!this.tutorial.active) { this.events.update(dt); this.quests.update(dt); this.quests.checkVisits(); }
            if (!p.interior) {
                for (const l of TG.LOCATIONS[this.era]) {
                    if (l.hidden) { if (l.interior && !p.dead && p.mode === 'foot' && Math.hypot(p.x - l.x, p.y - l.y) < l.r * 0.85) this.enterInterior(l); continue; }
                    if (!this.discovered.has(l.id) && Math.hypot(p.x - l.x, p.y - l.y) < l.r + 200) { this.discovered.add(l.id); TG.Toast.show('📍 Descubierto: ' + l.name, 'info', 2600); }
                }
            }
            this.camera.update(b.w, b.h); this.particles.update(); this.ambient.update(this.time); this.hud.update();
            this.autoSaveT -= dt; if (this.autoSaveT <= 0) { this.autoSaveT = 45; this.saveGame(true); }
        }

        // ------------------------------------------------------------------ dibujo
        render() {
            const cm = this.cm, ctx = cm.ctx, cam = this.camera, t = this.time;
            cm.begin();
            if (this.state === 'intro') { this.intro.render(); return; }
            if (this.state === 'menu') {
                cam.x = 700 + t * 28; cam.y = 600 + Math.sin(t * 0.12) * 160; cam.ox = cam.x; cam.oy = cam.y;
                this.renderOutdoor(ctx, cam, t, true); this.ambient.render(cam, t, false); this.post.apply(this.era, 0.9); TG.Menu.drawPreview(t); return;
            }
            const rz = this.raise ? (() => { const pp = this.player; return { x: pp.x - cam.ox, y: pp.y - cam.oy - 50, z: 1 + 0.2 * U.smooth(this.raise.t / 1.8) }; })() : null;
            if (rz) { ctx.save(); ctx.translate(rz.x, rz.y); ctx.scale(rz.z, rz.z); ctx.translate(-rz.x, -rz.y); }
            if (this.player.interior) this.renderInterior(ctx, cam, t); else this.renderOutdoor(ctx, cam, t, false);
            this.combat.renderFx(ctx, cam, t, this.input); this.abilities.render(ctx, cam, t); this.drawGuide(ctx, cam, t);
            this.particles.render(ctx, cam);
            if (rz) { this.drawRaise(ctx, cam, t); ctx.restore(); }
            if (this.era === '2010' && G.clu > 0.1 && !this.player.interior) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,110,10,${0.03 + 0.06 * G.clu})`; ctx.fillRect(0, 0, cm.w, cm.h); ctx.restore(); }   // presencia cálida de Clu
            this.ambient.render(cam, t, !!this.player.interior);
            this.post.apply(this.era, 1);
            const p = this.player;
            if (p.hurt > 0.01) { const g = ctx.createRadialGradient(cm.w / 2, cm.h / 2, cm.h * 0.3, cm.w / 2, cm.h / 2, cm.h * 0.9); g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,20,20,${0.5 * p.hurt})`); ctx.fillStyle = g; ctx.fillRect(0, 0, cm.w, cm.h); }
            if (p.dead) { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.75, (2.4 - this.deathT) * 0.5)})`; ctx.fillRect(0, 0, cm.w, cm.h); }
            if (this.betrayalFx > 0) { const bf = this.betrayalFx / 3.2, R = (1 - bf) * Math.hypot(cm.w, cm.h); const g2 = ctx.createRadialGradient(cm.w / 2, cm.h / 2, Math.max(0, R - 120), cm.w / 2, cm.h / 2, R + 60); g2.addColorStop(0, 'rgba(255,150,30,0)'); g2.addColorStop(0.7, `rgba(255,150,30,${0.5 * bf})`); g2.addColorStop(1, 'rgba(255,150,30,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, cm.w, cm.h); ctx.fillStyle = `rgba(255,120,0,${0.15 * bf})`; for (let i = 0; i < 6; i++) ctx.fillRect(0, Math.random() * cm.h, cm.w, 2 + Math.random() * 9); }
            if (this.fadeA > 0.01) { ctx.fillStyle = `rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0, 0, cm.w, cm.h); }
            if (this.digi.active) this.digi.render();
        }
        renderOutdoor(ctx, cam, t, menu) {
            const era = this.era, grid = this.grid, locs = TG.LOCATIONS[era];
            G.drawFloor(ctx, grid, cam, t);
            for (const l of locs) if (cam.onScreen(l.x, l.y, l.r * 1.6 + 120)) G.drawLocationBase(ctx, l, grid, cam, t, this.discovered.has(l.id));
            if (menu) { for (const l of locs) if (cam.onScreen(l.x, l.y, l.r + 300)) G.drawStructure(ctx, l, grid, cam, t, true); G.drawAirborne(ctx, grid, cam, t); return; }
            this.combat.renderGround(ctx, cam, t); this.battle.render(ctx, cam, t);
            const p = this.player;
            if (p.mode === 'cycle' && this.activeVehicle && !this.battle.active) G.jetwall(ctx, this.activeVehicle.trail, cam, TG.trailColor(p, t), { h: 22, rainbow: !p.skills.mrUBike && TG.trailInfo(p).rainbow, t });
            this.missions.renderProps(ctx, cam, t, true);
            const list = [];
            for (const l of locs) {
                if (!cam.onScreen(l.x, l.y, l.r + 320)) continue;
                if (this.battle.active && this.battle.loc === l) continue;
                list.push({ y: l.y + l.r * 0.35, draw: (c) => G.drawStructure(c, l, grid, cam, t, this.discovered.has(l.id)) });
            }
            for (const pt of TG.PORTALS[era]) if (cam.onScreen(pt.x, pt.y, 300)) list.push({ y: pt.y, draw: (c) => G.drawPortal(c, pt, cam, t) });
            this.pushActors(list, cam, t);
            list.sort((a, b) => a.y - b.y); for (const it of list) it.draw(ctx);
            this.tutorial.renderWorld(ctx, cam, t);
            for (const l of locs) {
                if (l.hidden && !this.discovered.has(l.id)) continue; if (this.battle.active && this.battle.loc === l) continue;
                if (cam.onScreen(l.x, l.y, l.r + 200)) G.drawLabel(ctx, l, grid, cam, Math.hypot(p.x - l.x, p.y - l.y) < l.r + 140);
            }
            G.drawAirborne(ctx, grid, cam, t);
        }
        renderInterior(ctx, cam, t) {
            const it = this.player.interior; G.drawInterior(ctx, it, cam, t, this.era);
            this.combat.renderGround(ctx, cam, t); this.special.renderProps(ctx, cam, t); this.missions.renderProps(ctx, cam, t, false);
            const list = []; this.pushActors(list, cam, t);
            list.sort((a, b) => a.y - b.y); for (const e of list) e.draw(ctx);
        }
        pushActors(list, cam, t) {
            const p = this.player;
            for (const n of this.visibleNPCs()) {
                if (!cam.onScreen(n.x, n.y, 160)) continue;
                list.push({ y: n.y, draw: (c) => {
                    const x = n.x - cam.ox, y = n.y - cam.oy;
                    G.humanoid(c, x, y + 14, { c: n.color, a: '#fff', f: n.f, ph: n.ph, moving: n.moving, look: n.look, t, seed: n.seed, bitState: n.bitState, symbol: ({ mr_c: '⚡', mr_l: 'Σ', mr_e: 'V', mr_r: '⚙', carlos: '</>' })[n.id] || null, acc: n.acc, s: n.look === 'mcp' ? 1.3 : 1 });
                    const top = n.look === 'bit' ? 84 : n.look === 'mcp' ? 120 : 98;
                    G.nameplate(c, x, y - top, n.name, n.color);
                    const avail = this.quests.availableFor(n.id).length > 0;
                    const ready = [...this.quests.active.values()].some(s => { const st = this.quests.stepOf(s); return st && st.type === 'talk' && st.npc === n.id; });
                    if (ready) G.questMark(c, x, y - top - 22, '?', t); else if (avail) G.questMark(c, x, y - top - 22, '!', t);
                } });
            }
            for (const e of this.combat.enemies) if (e.isAlive && cam.onScreen(e.x, e.y, 120)) list.push({ y: e.y, draw: (c) => G.enemy(c, e, cam, t) });
            if (!p.dead && !this.battle.active) list.push({ y: p.y, draw: (c) => this.drawPlayer(c, cam, t) });
            if (!p.interior) for (const d of this.special.drawables(cam, t)) list.push(d);
            for (const d of this.companions.drawables(cam, t)) list.push(d);
        }
        drawGuide(ctx, cam, t) {   // flecha-guía de misión / compañeros
            if (this.tutorial.active || this.battle.active || this.raise) return;
            const tg = this.missions.guide() || this.companions.guide(); if (!tg) return;
            const x = tg.x - cam.ox, y = tg.y - cam.oy, col = '#FFD84A';
            if (x > 40 && y > 40 && x < cam.w - 40 && y < cam.h - 40) { ctx.font = '11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText('▼ ' + tg.label, x, y - 46 + Math.sin(t * 4) * 3); return; }
            const ang = Math.atan2(y - cam.h / 2, x - cam.w / 2), m = 70, ex = U.clamp(cam.w / 2 + Math.cos(ang) * cam.w, m, cam.w - m), ey = U.clamp(cam.h / 2 + Math.sin(ang) * cam.h, m + 80, cam.h - m);
            ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill(); G.stroke(ctx, col, 2, 1); ctx.restore();
            ctx.font = '10px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(tg.label, ex, ey + 28);
        }
        drawPlayer(ctx, cam, t) {
            const p = this.player, x = p.x - cam.ox, y = p.y - cam.oy, blink = p.invuln > 0 && Math.floor(t * 18) % 2;
            if (p.mode === 'foot') G.playerSprite(ctx, x, y + 14, { form: p.form, c: p.color, a: p.cos.accent, f: p.f, ph: p.ph, moving: p.moving && !this.raise, look: 'visor', t, alpha: blink ? 0.4 : 1, armsUp: this.raise ? U.smooth(this.raise.t / 0.7) : 0 });
            else if (p.mode === 'cycle') G.cycle(ctx, x, y + 6, p.angle, p.color, { t, fire: p.skills.mrUBike || TG.trailInfo(p).fire, form: p.form });
            else if (p.mode === 'sailer') G.sailer(ctx, x, y, p.angle, p.color, t);
            if (p.cos.aura === 'orbit') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const a = t * 2.4 + i * Math.PI / 2, ox = Math.cos(a) * 36, oy = Math.sin(a) * 12 - 30; G.glow(ctx, x + ox, y + oy, 12, p.cos.accent, 0.8); ctx.fillStyle = p.cos.accent; ctx.fillRect(x + ox - 2, y + oy - 2, 4, 4); } ctx.restore(); }
            if (p.shieldT > 0) { const a = 0.5 + 0.3 * Math.sin(t * 8); ctx.beginPath(); ctx.ellipse(x, y - 26, 44, 58, 0, 0, Math.PI * 2); ctx.fillStyle = U.rgba('#7DFFFF', 0.07); ctx.fill(); G.stroke(ctx, '#7DFFFF', 2, a); }
            G.nameplate(ctx, x, y - (p.mode === 'foot' ? (p.form === 'human' ? 98 : 88) : 58), p.name, p.color);
        }
        // aura comprada: partículas alrededor del programa
        updateAura(dt) {
            const p = this.player, a = p.cos.aura; if (a === 'none' || a === 'orbit' || p.dead || p.interior && false) return;
            this.auraT -= dt; if (this.auraT > 0) return;
            const col = p.cos.accent === '#ffffff' ? p.color : p.cos.accent;
            if (a === 'sparks') { this.auraT = 0.05; this.particles.emit(p.x + U.rand(-16, 16), p.y - U.rand(0, 40), col, 1, 1.4, { vy: -1.3, decay: 0.03 }); }
            else if (a === 'voxels') { this.auraT = 0.14; this.particles.voxels(p.x, p.y - 20, col, 1, 1.4); }
            else if (a === 'pulse') { this.auraT = 1.5; this.particles.ring(p.x, p.y, col, 70); }
        }
    }

    // ------------------------------------------------------------------ arranque
    TG.boot = function () {
        const game = new Game();
        TG.Menu.init(
            (name, color, form, skip, diff) => game.startNew(name, color, form, skip, diff),
            () => { if (!game.loadGame()) TG.Toast.show('No se encontró una partida válida.', 'warn'); },
            game.hasSave()
        );
        game.intro.start(() => TG.Menu.show());
        if (TG.state.debug) window.GAME = game;
    };
    window.addEventListener('DOMContentLoaded', TG.boot);

})(window.TG = window.TG || {});
