/* ==========================================================================
   TRON: LAS TRES GRIDS — systems_core.js
   Modals, Economy, Shop, QuestEngine, AI (cliente del servidor Python), Dialogue.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U;

    // ================================================================ MODALS
    TG.Modals = {
        stack: [],
        open(id) {
            const el = document.getElementById(id); if (!el) return;
            el.classList.remove('hidden'); if (!this.stack.includes(id)) this.stack.push(id); this.sync();
        },
        close(id) {
            const el = document.getElementById(id); if (el) el.classList.add('hidden');
            this.stack = this.stack.filter(x => x !== id); this.sync();
        },
        closeAll() { for (const id of [...this.stack]) this.close(id); },
        closeTop() { const id = this.stack[this.stack.length - 1]; if (id && !['reveal-modal', 'puzzle-modal', 'minigame-overlay'].includes(id)) { if (this.onClose && this.onClose[id]) this.onClose[id](); this.close(id); return true; } return false; },
        sync() { TG.state.modalOpen = this.stack.length > 0; if (TG.game) TG.game.input.enabled = !TG.state.modalOpen; },
        onClose: {}
    };

    // =============================================================== REWARDS
    TG.REWARD_FX = {
        dodge10: p => { p.speedMultiplier *= 1.10; }, dmg15: p => { p.damageMultiplier *= 1.15; }, res20: p => { p.resistanceMultiplier *= 1.20; },
        res10: p => { p.resistanceMultiplier *= 1.10; }, atk10: p => { p.attackSpeedMultiplier *= 1.10; }, speed5: p => { p.speedMultiplier *= 1.05; },
        dualDisc: p => { p.skills.dualDisc = true; },
        permanence: p => { p.skills.permanence = true; p.maxHealth += 50; p.health = p.maxHealth; p.resistanceMultiplier *= 1.2; },
        frag1: p => { p.fragments = Math.max(p.fragments, 1); }, frag2: p => { p.fragments = Math.max(p.fragments, 2); },
        mrUBike: p => { p.skills.mrUBike = true; p.cycleSpeed = Math.max(16, p.cycleSpeed); },
        staticMastery: p => { p.skills.staticMastery = true; },
        analyticMind: p => { p.skills.analyticMind = true; }
    };

    // ================================================================ ECONOMY
    class Economy {
        constructor(g) { this.g = g; this.boostT = 0; }
        add(n) { this.g.player.bits += n; this.g.player.stats.earned += n; this.updateHUD(); }
        // ingreso "de botín": aplica la mejora Botín y el Amplificador de Bits
        earn(n) { const p = this.g.player; const v = Math.max(1, Math.round(n * p.lootMult * (this.boostT > 0 ? 2 : 1))); this.add(v); return v; }
        spend(n) { const p = this.g.player; if (p.bits < n) return false; p.bits -= n; p.stats.spent += n; this.updateHUD(); return true; }
        stake(n) { if (n <= 0) return true; return this.spend(n); }
        // liquida una apuesta: si ganas recibes el doble de lo apostado
        settleBet(bet, win) {
            if (bet <= 0) return; const p = this.g.player;
            if (win) { this.add(bet * 2); p.stats.betsWon++; TG.Toast.show(`💰 Apuesta ganada: +${bet * 2} bits (ganancia neta ${bet})`, 'good', 5000); }
            else { p.stats.betsLost++; TG.Toast.show(`💸 Apuesta perdida: -${bet} bits`, 'bad', 4500); }
        }
        updateHUD() { const el = document.getElementById('bits-count'); if (el) el.textContent = this.g.player.bits; const s = document.getElementById('shop-bits'); if (s) s.textContent = this.g.player.bits; const m = document.getElementById('mk-bits'); if (m) m.textContent = this.g.player.bits; }
    }
    TG.Economy = Economy;

    // ================================================================== SHOP
    const SHOPS = {
        yori_1982: { title: 'Simulaciones de Yori', items: [
            { id: 'y1', name: 'Cápsula de Energía', cost: 50, desc: 'Restaura toda tu vida.', fx: p => { p.health = p.maxHealth; }, repeat: true },
            { id: 'y2', name: 'Escudo Ligero', cost: 120, desc: '+10% de resistencia.', fx: p => { p.resistanceMultiplier *= 1.1; } }] },
        mcp_1982: { title: 'Arsenal de Sark', items: [
            { id: 's1', name: 'Disco Reforzado', cost: 150, desc: '+10% de daño.', fx: p => { p.damageMultiplier *= 1.1; } },
            { id: 's2', name: 'Chip Táctico', cost: 120, desc: '+5% de velocidad.', fx: p => { p.speedMultiplier *= 1.05; } }] },
        able: { title: 'Taller de Able', items: [
            { id: 'a1', name: 'Afinación de Ciclo', cost: 200, desc: '+1 de velocidad máxima del ciclo.', fx: p => { p.cycleSpeed += 1; } },
            { id: 'a2', name: 'Kit de Reparación', cost: 60, desc: 'Restaura toda tu vida.', fx: p => { p.health = p.maxHealth; }, repeat: true },
            { id: 'a3', name: 'Amortiguadores', cost: 180, desc: '+10% de resistencia.', fx: p => { p.resistanceMultiplier *= 1.1; } }] },
        julian_2025: { title: 'Núcleo de Dillinger Systems', items: [
            { id: 'j1', name: 'Núcleo Dillinger', cost: 300, desc: '+15% de daño.', fx: p => { p.damageMultiplier *= 1.15; } },
            { id: 'j2', name: 'Inyección de Energía', cost: 250, desc: '+20 de vida máxima.', fx: p => { p.maxHealth += 20; p.health += 20; } }] },
        eve_2025: { title: 'Suministros de ENCOM', items: [
            { id: 'e1', name: 'Parche de Permanencia', cost: 220, desc: '+15% de resistencia.', fx: p => { p.resistanceMultiplier *= 1.15; } },
            { id: 'e2', name: 'Cápsula ENCOM', cost: 50, desc: 'Restaura toda tu vida.', fx: p => { p.health = p.maxHealth; }, repeat: true }] },
        armory: { title: 'La Armería', items: [
            { id: 'r1', name: 'Disco de Combate', cost: 180, desc: '+10% de daño.', fx: p => { p.damageMultiplier *= 1.1; } },
            { id: 'r2', name: 'Traje Reforzado', cost: 200, desc: '+25 de vida máxima.', fx: p => { p.maxHealth += 25; p.health += 25; } },
            { id: 'r3', name: 'Cápsula', cost: 50, desc: 'Restaura toda tu vida.', fx: p => { p.health = p.maxHealth; }, repeat: true }] }
    };
    class Shop {
        constructor(g) { this.g = g; this.bought = new Set(); this.cur = null; document.getElementById('shop-close').addEventListener('click', () => TG.Modals.close('shop-modal')); }
        open(key) {
            const s = SHOPS[key]; if (!s) return; this.cur = key;
            document.getElementById('shop-title').textContent = s.title.toUpperCase(); this.render(); TG.Modals.open('shop-modal');
        }
        render() {
            const s = SHOPS[this.cur], box = document.getElementById('shop-items'); box.innerHTML = '';
            document.getElementById('shop-bits').textContent = this.g.player.bits;
            for (const it of s.items) {
                const owned = !it.repeat && this.bought.has(it.id);
                const row = document.createElement('div'); row.className = 'shop-item';
                row.innerHTML = `<div><b>${U.esc(it.name)}</b><span>${U.esc(it.desc)}</span></div>`;
                const b = document.createElement('button'); b.className = 'tron-button small';
                b.textContent = owned ? 'ADQUIRIDO' : it.cost + ' BITS'; b.disabled = owned || this.g.player.bits < it.cost;
                b.addEventListener('click', () => { if (this.g.economy.spend(it.cost)) { it.fx(this.g.player); this.bought.add(it.id); TG.sound.pickup(); TG.Toast.show('Comprado: ' + it.name, 'good'); this.render(); } });
                row.appendChild(b); box.appendChild(row);
            }
        }
    }
    TG.Shop = Shop;

    // ============================================================ QUEST ENGINE
    const COUNTED = { kill: 1, cpylons: 1, cprobes: 1, puzzle: 1, bounce: 1 };
    class QuestEngine {
        constructor(g) { this.g = g; this.active = new Map(); this.completed = new Set(); this.spawnT = 0; }
        stepOf(st) { return TG.QUESTS[st.id].steps[st.step]; }
        isActive(id) { return this.active.has(id); }
        isDone(id) { return this.completed.has(id); }
        canAccept(id) {
            const q = TG.QUESTS[id]; if (!q || this.active.has(id) || this.completed.has(id)) return false;
            return q.requires.every(r => this.completed.has(r));
        }
        availableFor(npcId) { return (TG.questsByGiver[npcId] || []).filter(id => this.canAccept(id)); }
        accept(id, silent) {
            if (!this.canAccept(id)) return false;
            const st = { id, step: 0, progress: 0, startDist: this.g.player.cycleDist };
            this.active.set(id, st);
            if (!silent) { TG.sound.accept(); TG.Toast.show('📜 Misión aceptada: ' + TG.QUESTS[id].title, 'good', 4200); }
            this.onStepStart(TG.QUESTS[id], st); this.refresh(); return true;
        }
        onStepStart(q, st) {
            const s = q.steps[st.step]; if (!s) return;
            st.timeLeft = s.timer || 0; st.note = undefined;
            if (s.type === 'cycle') st.startDist = this.g.player.cycleDist;
            if (TG.NEW_STEP_TYPES && TG.NEW_STEP_TYPES.includes(s.type) && this.g.missions) this.g.missions.activate(q, s, st);
            if (s.type === 'kill' && s.spawn) this.spawnFor(q, st);
            if (['cnodes', 'cpylons', 'cprobes', 'bounce'].includes(s.type) && this.g.special) this.g.special.activateStep(q, s, st);
        }
        spawnFor(q, st) {
            const g = this.g, s = this.stepOf(st), p = g.player, b = g.currentBounds();
            if (p.interior) return;   // los enemigos de misión aparecen al aire libre
            const need = s.n - st.progress, have = g.combat.enemies.filter(e => e.tag === q.id && e.isAlive).length;
            for (let i = have; i < need; i++) {
                const a = Math.random() * 6.28, d = 380 + Math.random() * 260;
                const type = s.spawn.hp > 100 ? 'brute' : 'guard';
                g.combat.spawn(TG.makeEnemy(type, g.era, U.clamp(p.x + Math.cos(a) * d, 60, b.w - 60), U.clamp(p.y + Math.sin(a) * d, 80, b.h - 60), { name: s.spawn.name, tag: q.id, noDespawn: true, hp: s.spawn.hp, aggro: 900 }));
            }
        }
        ensureSpawns(dt) {
            this.spawnT -= dt; if (this.spawnT > 0) return; this.spawnT = 3;
            for (const st of this.active.values()) { const q = TG.QUESTS[st.id], s = this.stepOf(st); if (s && s.type === 'kill' && s.spawn) this.spawnFor(q, st); }
        }
        event(type, d = {}) {
            for (const st of [...this.active.values()]) {
                const q = TG.QUESTS[st.id], s = q.steps[st.step]; if (!s) continue;
                let adv = false, changed = false;
                const count = (n) => { st.progress++; changed = true; if (st.progress >= n) adv = true; };
                switch (type) {
                    case 'kill': if (s.type === 'kill' && (!s.spawn || d.enemy.tag === q.id)) count(s.n); break;
                    case 'arena': if (s.type === 'arena' && s.mode === d.mode) adv = true; break;
                    case 'visit': if (s.type === 'visit' && s.loc === d.loc) adv = true; break;
                    case 'talk': if (s.type === 'talk' && s.npc === d.npc) adv = true; break;
                    case 'grid': if (s.type === 'grid' && s.to === d.to) adv = true; break;
                    case 'minigame': if (s.type === 'minigame' && s.id === d.id && d.success) adv = true; break;
                    case 'cnodes': if (s.type === 'cnodes') adv = true; break;
                    case 'cpylon': if (s.type === 'cpylons') count(s.n); break;
                    case 'cprobe': if (s.type === 'cprobes') count(s.n); break;
                    case 'puzzle': if (s.type === 'puzzle' && s.kind === d.kind) count(s.n); break;
                    case 'bounce': if (s.type === 'bounce') count(s.n); break;
                    case 'race': if (s.type === 'race' && s.track === d.track && d.pos <= (s.pos || 1)) adv = true; break;
                    case 'stepdone': if (s.type === d.type) adv = true; break;
                }
                if (adv) this.advance(st); else if (changed) { TG.sound.ui(); this.refresh(); }
            }
        }
        advance(st) {
            const q = TG.QUESTS[st.id], s = q.steps[st.step];
            st.step++; st.progress = 0;
            if (this.g.special) this.g.special.clearProps(q.id);
            if (st.step >= q.steps.length) { this.complete(st); return; }
            TG.Toast.show('✔ ' + s.text, 'good'); TG.sound.accept();
            this.onStepStart(q, st); this.refresh();
        }
        complete(st) {
            const g = this.g, q = TG.QUESTS[st.id], r = q.reward;
            this.active.delete(st.id); this.completed.add(st.id);
            if (g.special) g.special.onQuestDone(q);
            if (r.bits) g.economy.add(r.bits);
            if (r.fx && TG.REWARD_FX[r.fx]) TG.REWARD_FX[r.fx](g.player);
            g.hud.refreshSkills();
            TG.sound.reward(); this.refresh();
            const ABIL = ['mrUBike', 'staticMastery', 'analyticMind', 'faraday', 'pid', 'codeMastery', 'portalDisc', 'dash', 'tronGuard', 'rewrite'];
            if ((q.special || ABIL.includes(r.fx)) && r.fx && ABIL.includes(r.fx)) {
                const COL = { staticMastery: '#7DFFFF', analyticMind: '#B9A7FF', faraday: '#FFE45C', pid: '#FFB347', codeMastery: '#6AFFB0', portalDisc: '#9FD8FF', dash: '#58F2FF', tronGuard: '#58F2FF', rewrite: '#FFFFFF' };
                TG.Reveal.show({ kicker: 'HABILIDAD DESBLOQUEADA', title: q.title, html: `<p>${U.esc(r.text)}</p>`, color: COL[r.fx] || '#FF9A1F' });
            } else TG.Toast.show('🏆 Misión completada: ' + q.title + ' — ' + r.text, 'good', 5500);
            g.particles.ring(g.player.x, g.player.y, g.player.color, 150);
            g.onQuestComplete(q); g.saveGame(true);
        }
        checkVisits() {
            const g = this.g, p = g.player; if (!this.active.size) return;
            if (p.interior) { this.event('visit', { loc: p.interior.id }); return; }
            for (const l of TG.LOCATIONS[g.era]) if (!l.hidden && Math.hypot(p.x - l.x, p.y - l.y) < l.r + 25) this.event('visit', { loc: l.id });
        }
        failStep(st) { const q = TG.QUESTS[st.id]; TG.Toast.show('⏱ Tiempo agotado: «' + q.title + '». Se reinicia el objetivo.', 'warn', 4200); TG.sound.damage(); if (this.g.missions) this.g.missions.onFail(); st.progress = 0; this.onStepStart(q, st); this.refresh(); }
        update(dt) {
            const g = this.g, p = g.player;
            for (const st of [...this.active.values()]) {
                const s = this.stepOf(st); if (!s) continue;
                if (s.timer && st.timeLeft > 0) { const before = Math.ceil(st.timeLeft / 5); st.timeLeft -= dt; if (st.timeLeft <= 0) { this.failStep(st); continue; } if (Math.ceil(st.timeLeft / 5) !== before) this.refresh(); }
                if (s.type === 'cycle') { const d = p.cycleDist - st.startDist; if (d >= s.dist) this.advance(st); else if (Math.floor(d / 400) !== st._lastTick) { st._lastTick = Math.floor(d / 400); this.refresh(); } }
            }
            this.ensureSpawns(dt);
        }
        progressText(st) {
            const s = this.stepOf(st); if (!s) return '';
            if (COUNTED[s.type]) return ` (${st.progress}/${s.n})` + (st.note ? ` (${st.note})` : '') + (s.timer && st.timeLeft > 0 ? ` ⏱${Math.floor(st.timeLeft / 60)}:${String(Math.floor(st.timeLeft % 60)).padStart(2, '0')}` : '');
            let tx = '';
            if (s.type === 'cycle') tx = ` (${Math.min(s.dist, Math.floor(this.g.player.cycleDist - st.startDist))}/${s.dist})`;
            if (st.note) tx += ` (${st.note})`;
            if (s.timer && st.timeLeft > 0) tx += ` ⏱${Math.floor(st.timeLeft / 60)}:${String(Math.floor(st.timeLeft % 60)).padStart(2, '0')}`;
            return tx;
        }
        refresh() {
            const box = document.getElementById('quest-tracker-list'); if (box) {
                box.innerHTML = '';
                if (!this.active.size) { box.innerHTML = '<span class="no-buffs">Sin misiones activas · habla con los NPCs</span>'; }
                for (const st of this.active.values()) {
                    const q = TG.QUESTS[st.id], s = this.stepOf(st);
                    const d = document.createElement('div'); d.className = 'tq' + (q.special ? ' special' : '');
                    d.innerHTML = `<b>${U.esc(q.title)}</b><span>▸ ${U.esc(s ? s.text : '')}${this.progressText(st)}</span>`;
                    box.appendChild(d);
                }
            }
            if (!document.getElementById('quest-modal').classList.contains('hidden')) this.renderLog();
        }
        renderLog() {
            const box = document.getElementById('quest-list'); box.innerHTML = '';
            const mk = (title, cls) => { const h = document.createElement('h3'); h.className = cls || ''; h.textContent = title; box.appendChild(h); };
            const card = (st) => {
                const q = TG.QUESTS[st.id], d = document.createElement('div'); d.className = 'q-card' + (q.special ? ' special' : '') + (q.kind === 'main' ? ' main' : '');
                const steps = q.steps.map((s, i) => `<li class="${i < st.step ? 'done' : i === st.step ? 'now' : ''}">${i < st.step ? '✔' : i === st.step ? '▸' : '○'} ${U.esc(s.text)}${i === st.step ? this.progressText(st) : ''}</li>`).join('');
                d.innerHTML = `<h4>${q.kind === 'main' ? '★ ' : ''}${U.esc(q.title)}</h4><p>${U.esc(q.desc)}</p><ul>${steps}</ul><div class="reward">RECOMPENSA: ${U.esc(q.reward.text)}</div>`; return d;
            };
            const act = [...this.active.values()], mains = act.filter(s => TG.QUESTS[s.id].kind === 'main'), sides = act.filter(s => TG.QUESTS[s.id].kind !== 'main');
            mk('★ HISTORIA PRINCIPAL'); if (!mains.length) { const e = document.createElement('p'); e.className = 'dim'; e.textContent = 'Sin misión principal activa. Habla con Flynn y Tron (Grid 1982) para continuar la historia.'; box.appendChild(e); } for (const st of mains) box.appendChild(card(st));
            mk('MISIONES SECUNDARIAS Y ESPECIALES'); if (!sides.length) { const e = document.createElement('p'); e.className = 'dim'; e.textContent = 'No tienes misiones secundarias activas.'; box.appendChild(e); } for (const st of sides) box.appendChild(card(st));
            mk('COMPLETADAS (' + this.completed.size + ')', 'dim');
            for (const id of this.completed) { const q = TG.QUESTS[id], d = document.createElement('div'); d.className = 'q-done'; d.textContent = '✔ ' + q.title; box.appendChild(d); }
        }
        open() { this.renderLog(); TG.Modals.open('quest-modal'); if (this.g.tutorial) this.g.tutorial.event('quests'); }
        serialize() { return { active: [...this.active.values()].map(s => ({ id: s.id, step: s.step, progress: s.progress })), completed: [...this.completed] }; }
        restore(d) {
            this.active.clear(); this.completed = new Set((d.completed || []).filter(id => TG.QUESTS[id]));
            for (const a of d.active || []) if (TG.QUESTS[a.id]) { const st = { id: a.id, step: a.step, progress: a.progress, startDist: this.g.player.cycleDist }; this.active.set(a.id, st); }
            for (const st of this.active.values()) this.onStepStart(TG.QUESTS[st.id], st);
            this.refresh();
        }
    }
    TG.QuestEngine = QuestEngine;

    // ================================================================= AI (Python)
    TG.AI = {
        base: null, online: false, info: null, lastCheck: 0,
        // Prueba primero el mismo origen (cuando el juego lo sirve el servidor Python, en cualquier puerto)
        // y luego http://localhost:8765 (cuando abres index.html con doble clic o con otro servidor).
        candidates() {
            const c = []; if (/^https?:$/.test(location.protocol)) c.push('');
            c.push('http://localhost:8765'); if (this.base !== null && !c.includes(this.base)) c.unshift(this.base); return c;
        },
        async health() {
            this.online = false; this.info = null;
            for (const b of this.candidates()) {
                try {
                    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 2000);
                    const r = await fetch(b + '/api/health', { signal: ctl.signal }); clearTimeout(to);
                    const j = await r.json();
                    if (j && j.ok) { this.base = b; this.info = j; this.online = !!j.ready; break; }
                } catch (e) { /* siguiente candidato */ }
            }
            this.lastCheck = Date.now(); return this.online;
        },
        label() {
            if (this.info && this.info.ready) return `IA: ${this.info.provider}${this.info.model ? ' · ' + this.info.model : ''}`;
            if (this.info && !this.info.ready) return 'Servidor IA activo, pero sin proveedor configurado (usando respuestas locales)';
            return 'IA sin conexión (usando respuestas locales)';
        },
        async chat(npc, message, history, context) {
            const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 30000);
            try {
                const r = await fetch((this.base === null ? 'http://localhost:8765' : this.base) + '/api/npc/chat', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
                    body: JSON.stringify({ npc: { id: npc.id, name: npc.name, role: npc.role, grid: npc.grid, src: npc.src, persona: npc.persona, special: !!npc.special }, message, history, context })
                });
                clearTimeout(to);
                const j = await r.json();
                if (!r.ok || !j.ok) throw new Error(j.error || 'error');
                this.online = true; return j;
            } catch (e) { clearTimeout(to); this.online = false; throw e; }
        }
    };

    // =============================================================== DIALOGUE
    class Dialogue {
        constructor(g) {
            this.g = g; this.npc = null; this.busy = false; this.hist = {};
            this.el = { log: document.getElementById('dlg-log'), input: document.getElementById('dlg-input'), send: document.getElementById('dlg-send'), actions: document.getElementById('dlg-actions'), status: document.getElementById('dlg-status') };
            document.getElementById('dlg-close').addEventListener('click', () => this.close());
            this.el.send.addEventListener('click', () => this.send());
            this.el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.send(); } if (e.key === 'Escape') this.close(); e.stopPropagation(); });
            TG.Modals.onClose['dialogue-modal'] = () => this.close(true);
        }
        add(who, text, cls) {
            const d = document.createElement('div'); d.className = 'msg ' + (cls || who); d.textContent = text;
            this.el.log.appendChild(d); this.el.log.scrollTop = this.el.log.scrollHeight; return d;
        }
        open(npc) {
            this.npc = npc; npc.talking = true; this.el.log.innerHTML = '';
            document.getElementById('dlg-avatar').textContent = npc.avatar; document.getElementById('dlg-avatar').style.setProperty('--c', npc.color);
            document.getElementById('dlg-name').textContent = npc.name; document.getElementById('dlg-role').textContent = npc.role;
            document.getElementById('dlg-src').textContent = npc.src || '';
            document.getElementById('dialogue-modal').style.setProperty('--npc', npc.color);
            this.add('npc', npc.greet);
            this.hist[npc.id] = this.hist[npc.id] || [];
            this.el.status.textContent = TG.AI.label();
            this.buildActions(); TG.Modals.open('dialogue-modal');
            this.g.quests.event('talk', { npc: npc.id }); if (this.g.tutorial) this.g.tutorial.event('talk', npc.id); this.g.companions.onTalk(npc.id);
            setTimeout(() => this.el.input.focus(), 50); TG.sound.ui();
            if (Date.now() - TG.AI.lastCheck > 20000) TG.AI.health().then(() => { if (this.npc === npc) this.el.status.textContent = TG.AI.label(); });
        }
        buildActions() {
            const g = this.g, npc = this.npc, box = this.el.actions; box.innerHTML = '';
            const btn = (text, fn, cls) => { const b = document.createElement('button'); b.className = 'tron-button small ' + (cls || ''); b.textContent = text; b.addEventListener('click', fn); box.appendChild(b); };
            for (const id of g.quests.availableFor(npc.id)) {
                const q = TG.QUESTS[id];
                btn('📜 ' + q.title, () => { g.quests.accept(id); this.add('npc', q.desc + ' — Recompensa: ' + q.reward.text); this.buildActions(); }, q.special ? 'special' : '');
            }
            for (const id of (TG.questsByGiver[npc.id] || [])) {   // misiones que aún no puedes aceptar: se explica qué falta
                if (g.quests.canAccept(id) || g.quests.completed.has(id) || g.quests.active.has(id)) continue;
                const q = TG.QUESTS[id], miss = (q.requires || []).filter(r => !g.quests.completed.has(r)).map(r => (TG.QUESTS[r] ? TG.QUESTS[r].title : r)), why = miss.length ? 'Antes: «' + miss[0] + '»' : 'No disponible';
                const b = document.createElement('button'); b.className = 'tron-button small ghost'; b.disabled = true; b.textContent = '🔒 ' + q.title + ' · ' + why; b.title = why; box.appendChild(b);
            }
            for (const [id, st] of g.quests.active) { const q = TG.QUESTS[id]; if (q.giver === npc.id) { const s = g.quests.stepOf(st); const PL = { math: 'Matemática', ohm: 'Circuitos', code: 'Programación', elec: 'Electricidad', ctrl: 'Control de procesos' };
                    if (s && s.type === 'puzzle') btn('🧮 Resolver desafío: ' + (PL[s.kind] || s.kind), () => { this.close(); g.special.startPuzzle(s.kind); }, 'special');
                    if (s && s.type === 'process') btn('🏭 Operar el tanque', () => { this.close(); g.missions.startProcess(); }, 'special'); } }
            if (npc.shop) btn('🛒 Tienda', () => g.shop.open(npc.shop));
            btn('Cerrar', () => this.close());
        }
        close() {
            if (!this.npc) return; this.npc.talking = false; this.npc = null; TG.Modals.close('dialogue-modal'); this.el.input.blur();
        }
        fallback(npc) {
            const L = npc.lines && npc.lines.length ? npc.lines : ['...'];
            let t = L[Math.floor(Math.random() * L.length)];
            if (L.length > 1 && t === npc._lastLine) t = L[(L.indexOf(t) + 1) % L.length];
            npc._lastLine = t; return t;
        }
        async send() {
            const npc = this.npc, text = this.el.input.value.trim();
            if (!npc || !text || this.busy) return;
            this.el.input.value = ''; this.add('user', text); this.busy = true; this.el.send.disabled = true;
            const h = this.hist[npc.id];
            let reply;
            if (npc.yesno) {
                reply = (U.strSeed(text.toLowerCase()) % 2) ? 'Sí.' : 'No.'; npc.bitState = reply === 'Sí.' ? 'yes' : 'no'; npc.bitT = 2.4; TG.sound.ui();
            } else {
                const thinking = this.add('npc', '…', 'npc thinking');
                try {
                    const g = this.g, p = g.player, loc = p.interior ? p.interior.name : (g.nearLocation() ? g.nearLocation().name : g.grid.full);
                    const j = await TG.AI.chat(npc, text, h.slice(-8), {
                        player: p.name, grid: g.grid.full, location: loc,
                        quests: [...g.quests.active.keys()].map(id => TG.QUESTS[id].title),
                        skills: Object.keys(p.skills).filter(k => p.skills[k])
                    });
                    reply = j.reply; this.el.status.textContent = TG.AI.label();
                } catch (e) { reply = this.fallback(npc); this.el.status.textContent = TG.AI.label(); }
                thinking.remove();
            }
            h.push({ role: 'user', text }); h.push({ role: 'npc', text: reply });
            const el = this.add('npc', '');
            let i = 0; const typer = () => { if (i < reply.length) { el.textContent += reply[i++]; this.el.log.scrollTop = this.el.log.scrollHeight; setTimeout(typer, 14); } else { this.busy = false; this.el.send.disabled = false; this.el.input.focus(); } };
            typer();
        }
    }
    TG.Dialogue = Dialogue;

})(window.TG = window.TG || {});
