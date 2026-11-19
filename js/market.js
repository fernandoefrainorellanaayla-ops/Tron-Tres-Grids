/* ==========================================================================
   TRON: LAS TRES GRIDS — market.js
   SISTEMA ECONÓMICO
   · Terminal de Mejoras (tecla I): mejoras por niveles con precio creciente.
   · Estilo: estelas de ciclo, estilos de disco, auras y color de acento.
   · Consumibles (teclas 1-4): cápsula, pulso EMP, escudo de fase, amplificador de bits.
   · Oferta relámpago rotativa (-25 %) y estadísticas económicas.
   · Apuestas en las arenas (ver ArenaUI / DiscDuel / CycleBattle).
   Las tiendas de los NPC (Yori, Able, Julian…) siguen existiendo y suman a lo mismo.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U;

    // ------------------------------------------------------------------ DATOS
    TG.UPGRADES = [
        { id: 'vit', icon: '❤', name: 'Vitalidad', max: 5, base: 100, per: '+15 de vida máxima', total: l => `+${l * 15} de vida`, apply: p => { p.maxHealth += 15; p.health += 15; } },
        { id: 'dmg', icon: '💥', name: 'Potencia del Disco', max: 5, base: 120, per: '+8% de daño', total: l => `+${Math.round((Math.pow(1.08, l) - 1) * 100)}% de daño`, apply: p => { p.damageMultiplier *= 1.08; } },
        { id: 'spd', icon: '⚡', name: 'Propulsores', max: 5, base: 110, per: '+4% de velocidad', total: l => `+${Math.round((Math.pow(1.04, l) - 1) * 100)}% de velocidad`, apply: p => { p.speedMultiplier *= 1.04; } },
        { id: 'res', icon: '🛡', name: 'Blindaje', max: 5, base: 110, per: '+6% de resistencia', total: l => `+${Math.round((Math.pow(1.06, l) - 1) * 100)}% de resistencia`, apply: p => { p.resistanceMultiplier *= 1.06; } },
        { id: 'atk', icon: '↺', name: 'Retorno del Disco', max: 5, base: 130, per: '+8% de velocidad de retorno', total: l => `+${Math.round((Math.pow(1.08, l) - 1) * 100)}% de retorno`, apply: p => { p.attackSpeedMultiplier *= 1.08; } },
        { id: 'regen', icon: '✚', name: 'Regeneración', max: 5, base: 140, per: '+0.4 de vida por segundo', total: l => `+${(l * 0.4).toFixed(1)} vida/s`, apply: p => { p.regenBonus += 0.4; } },
        { id: 'motor', icon: '🏍', name: 'Motor del Ciclo', max: 5, base: 150, per: '+0.8 de velocidad máxima del ciclo', total: l => `+${(l * 0.8).toFixed(1)} de velocidad`, apply: p => { p.cycleSpeed += 0.8; } },
        { id: 'loot', icon: '◈', name: 'Botín', max: 5, base: 160, per: '+8% de bits al derrotar enemigos', total: l => `+${l * 8}% de bits`, apply: p => { p.lootMult += 0.08; } },
        { id: 'magnet', icon: '🧲', name: 'Imán de Datos', max: 4, base: 90, per: '+40 de radio de recogida', total: l => `+${l * 40} de radio`, apply: p => { p.magnet += 40; } }
    ];
    TG.CONSUMABLES = [
        { id: 'heal', icon: '💠', name: 'Cápsula de Energía', cost: 60, key: 1, desc: 'Restaura el 60% de tu vida máxima.' },
        { id: 'emp', icon: '⚡', name: 'Pulso EMP', cost: 90, key: 2, desc: 'Aturde 3 s y daña a los enemigos en 450 px.' },
        { id: 'shield', icon: '🛡', name: 'Escudo de Fase', cost: 110, key: 3, desc: 'Te hace invulnerable durante 6 s.' },
        { id: 'boost', icon: '◈', name: 'Amplificador de Bits', cost: 140, key: 4, desc: 'Duplica los bits de enemigos y recogidas durante 60 s.' }
    ];
    TG.COSMETICS = {
        trail: { title: 'Estela del ciclo de luz', items: [
            { id: 'default', name: 'Color de tu programa', cost: 0 }, { id: 'white', name: 'Luz blanca', cost: 120, color: '#FFFFFF' }, { id: 'gold', name: 'Oro digital', cost: 200, color: '#FFD84A' },
            { id: 'void', name: 'Vacío violeta', cost: 260, color: '#B24DFF' }, { id: 'rainbow', name: 'Arcoíris de datos', cost: 450, rainbow: true }, { id: 'inferno', name: 'Infierno', cost: 600, color: '#FF7A1A', fire: true }] },
        disc: { title: 'Estilo del disco', items: [
            { id: 'default', name: 'Disco estándar', cost: 0 }, { id: 'ring2', name: 'Doble anillo', cost: 150 }, { id: 'blade', name: 'Hoja hexagonal', cost: 220 },
            { id: 'flame', name: 'Disco de llama', cost: 320, color: '#FF7A1A' }, { id: 'ion', name: 'Disco iónico', cost: 400, color: '#BFFFFF' }] },
        aura: { title: 'Aura del programa', items: [
            { id: 'none', name: 'Sin aura', cost: 0 }, { id: 'sparks', name: 'Chispas', cost: 180 }, { id: 'voxels', name: 'Voxels', cost: 260 },
            { id: 'orbit', name: 'Órbita de luz', cost: 340 }, { id: 'pulse', name: 'Pulso de energía', cost: 420 }] },
        accent: { title: 'Color de acento (disco y visor)', items: [
            { id: '#ffffff', name: 'Blanco', cost: 0, color: '#ffffff' }, { id: '#FFD84A', name: 'Dorado', cost: 100, color: '#FFD84A' }, { id: '#FF4DDB', name: 'Magenta', cost: 100, color: '#FF4DDB' },
            { id: '#B6FF3A', name: 'Lima', cost: 100, color: '#B6FF3A' }, { id: '#FF3A3A', name: 'Rojo', cost: 100, color: '#FF3A3A' }, { id: '#7DFFFF', name: 'Hielo', cost: 100, color: '#7DFFFF' }] }
    };
    const SLOT_DEFAULT = { trail: 'default', disc: 'default', aura: 'none', accent: '#ffffff' };
    const DEAL_EVERY = 150, DEAL_OFF = 0.25, BET_OPTIONS = [0, 50, 100, 250];
    TG.BET_OPTIONS = BET_OPTIONS;

    // ---- helpers de estilo (los usan gráficos y entidades)
    TG.upgradeCost = (u, lvl) => Math.round(u.base * Math.pow(1.6, lvl) / 5) * 5;
    TG.trailInfo = (p) => (TG.COSMETICS.trail.items.find(i => i.id === (p.cos && p.cos.trail)) || TG.COSMETICS.trail.items[0]);
    TG.trailColor = (p, t, i = 0) => {
        const s = TG.trailInfo(p);
        if (p.skills && p.skills.mrUBike) return '#FF7A1A';
        if (s.rainbow) return TG.hsl(((t || 0) * 90 + i * 14) % 360);
        return s.color || p.color;
    };
    TG.hsl = (h) => { const c = 1, x = c * (1 - Math.abs((h / 60) % 2 - 1)); const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; const hx = (v) => Math.round(120 + v * 135).toString(16).padStart(2, '0'); return '#' + hx(r) + hx(g) + hx(b); };
    TG.discStyle = (p) => (TG.COSMETICS.disc.items.find(i => i.id === (p.cos && p.cos.disc)) || TG.COSMETICS.disc.items[0]);

    // ================================================================= MARKET
    class Market {
        constructor(g) {
            this.g = g; this.tab = 'upgrades'; this.deal = null; this.dealT = 0; this.itemCd = 0; this.lastBar = '';
            this.$ = (id) => document.getElementById(id);
            this.$('mk-close').addEventListener('click', () => TG.Modals.close('market-modal'));
            document.querySelectorAll('#mk-tabs button').forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); TG.sound.ui(); }));
            const bm = this.$('btn-market'); if (bm) bm.addEventListener('click', () => this.open());
            this.rollDeal();
        }
        get p() { return this.g.player; }
        // ------------------------------------------------------------- apertura
        open() {
            const g = this.g;
            if (g.state !== 'play' || g.transition) return;
            if (g.tutorial.active) { TG.Toast.show('El Terminal de Mejoras se desbloquea al terminar el entrenamiento.', 'warn'); return; }
            if (g.battle.active || g.duel.active) { TG.Toast.show('No puedes usar el terminal en pleno combate.', 'warn'); return; }
            this.render(); TG.Modals.open('market-modal'); TG.sound.ui();
        }
        // ------------------------------------------------------------- precios y ofertas
        pool() {
            const p = this.p, out = [];
            for (const u of TG.UPGRADES) if ((p.upg[u.id] || 0) < u.max) out.push({ kind: 'up', id: u.id });
            for (const c of TG.CONSUMABLES) out.push({ kind: 'item', id: c.id });
            for (const slot of Object.keys(TG.COSMETICS)) for (const it of TG.COSMETICS[slot].items) if (it.cost > 0 && !this.owns(slot, it.id)) out.push({ kind: 'cos', slot, id: it.id });
            return out;
        }
        rollDeal() { const pool = this.p ? this.pool() : []; this.deal = pool.length ? Object.assign({}, U.pick(pool)) : null; this.dealT = DEAL_EVERY; }
        isDeal(kind, id, slot) { const d = this.deal; return !!d && d.kind === kind && d.id === id && (kind !== 'cos' || d.slot === slot); }
        price(base, kind, id, slot) { return this.isDeal(kind, id, slot) ? Math.round(base * (1 - DEAL_OFF) / 5) * 5 : base; }
        owns(slot, id) { return id === SLOT_DEFAULT[slot] || this.p.owned.includes(slot + ':' + id) || (slot === 'accent' && id === '#ffffff'); }
        // ------------------------------------------------------------- compras
        buyUpgrade(id) {
            const p = this.p, u = TG.UPGRADES.find(x => x.id === id), lvl = p.upg[id] || 0; if (!u || lvl >= u.max) return;
            const cost = this.price(TG.upgradeCost(u, lvl), 'up', id);
            if (!this.g.economy.spend(cost)) { TG.sound.damage(); TG.Toast.show('No tienes suficientes bits.', 'warn'); return; }
            u.apply(p); p.upg[id] = lvl + 1; TG.sound.reward(); TG.Toast.show(`${u.icon} ${u.name} → nivel ${lvl + 1}`, 'good'); this.g.hud.lastSkills = ''; this.render();
            if (this.isDeal('up', id)) this.rollDeal();
        }
        buyItem(id) {
            const p = this.p, c = TG.CONSUMABLES.find(x => x.id === id); if (!c) return;
            if ((p.items[id] || 0) >= 9) { TG.Toast.show('Ya llevas el máximo (9).', 'warn'); return; }
            const cost = this.price(c.cost, 'item', id);
            if (!this.g.economy.spend(cost)) { TG.sound.damage(); TG.Toast.show('No tienes suficientes bits.', 'warn'); return; }
            p.items[id] = (p.items[id] || 0) + 1; TG.sound.pickup(); this.render(); if (this.isDeal('item', id)) this.rollDeal();
        }
        buyCosmetic(slot, id) {
            const it = TG.COSMETICS[slot].items.find(x => x.id === id), p = this.p; if (!it) return;
            if (this.owns(slot, id)) { p.cos[slot] = id; TG.sound.accept(); this.render(); return; }   // ya es tuyo: equipar
            const cost = this.price(it.cost, 'cos', id, slot);
            if (!this.g.economy.spend(cost)) { TG.sound.damage(); TG.Toast.show('No tienes suficientes bits.', 'warn'); return; }
            p.owned.push(slot + ':' + id); p.cos[slot] = id; TG.sound.reward(); TG.Toast.show('✨ Estilo desbloqueado: ' + it.name, 'good'); this.render(); if (this.isDeal('cos', id, slot)) this.rollDeal();
        }
        // ------------------------------------------------------------- consumibles
        useItem(id) {
            const g = this.g, p = this.p; if (g.state !== 'play' || g.transition || p.dead || g.paused) return;
            if (this.itemCd > 0) return;
            if (!(p.items[id] > 0)) { TG.Toast.show('No tienes ese consumible (cómpralo en el Terminal [I]).', 'warn', 2400); return; }
            let ok = true;
            if (id === 'heal') { if (p.health >= p.maxHealth - 0.5) { TG.Toast.show('Tu vida ya está completa.', 'info', 1800); ok = false; } else { p.health = Math.min(p.maxHealth, p.health + p.maxHealth * 0.6); g.particles.ring(p.x, p.y, '#7DFF9B', 110); g.combat.floater(p.x, p.y - 80, '+60% VIDA', '#7DFF9B'); } }
            else if (id === 'emp') {
                g.particles.ring(p.x, p.y, '#9DFBFF', 450); g.camera.shake(8); TG.sound.zap();
                for (const e of g.combat.enemies) if (e.isAlive && Math.hypot(e.x - p.x, e.y - p.y) < 450) { e.hit(15, g, { stun: 3 }); g.combat.arcs.push({ x1: p.x, y1: p.y - 24, x2: e.x, y2: e.y - 24, life: 0.3 }); }
            }
            else if (id === 'shield') { p.shieldT = 6; g.particles.ring(p.x, p.y, '#7DFFFF', 90); g.combat.floater(p.x, p.y - 80, 'ESCUDO 6s', '#7DFFFF'); }
            else if (id === 'boost') { g.economy.boostT = 60; g.combat.floater(p.x, p.y - 80, 'BITS x2 · 60s', '#FFD84A'); }
            if (!ok) return;
            p.items[id]--; this.itemCd = 0.6; TG.sound.accept(); this.lastBar = '';
        }
        // ------------------------------------------------------------- bucle
        update(dt) {
            const p = this.p;
            this.itemCd = Math.max(0, this.itemCd - dt);
            if (p.shieldT > 0) p.shieldT = Math.max(0, p.shieldT - dt);
            const e = this.g.economy; if (e.boostT > 0) e.boostT = Math.max(0, e.boostT - dt);
            this.dealT -= dt; if (this.dealT <= 0) { this.rollDeal(); if (!document.getElementById('market-modal').classList.contains('hidden')) this.render(); }
            if (this.g.time % 1 < dt && !document.getElementById('market-modal').classList.contains('hidden')) this.renderDealLine();
        }
        // ------------------------------------------------------------- HUD: barra de consumibles
        refreshBar() {
            const p = this.p, e = this.g.economy, box = this.$('items-bar'); if (!box) return;
            const sig = TG.CONSUMABLES.map(c => p.items[c.id] || 0).join(',') + '|' + Math.ceil(e.boostT) + '|' + Math.ceil(p.shieldT || 0);
            if (sig === this.lastBar) return; this.lastBar = sig;
            box.innerHTML = '';
            for (const c of TG.CONSUMABLES) {
                const n = p.items[c.id] || 0, d = document.createElement('div'); d.className = 'slot' + (n ? ' has' : '');
                d.title = `${c.name}: ${c.desc}`; d.innerHTML = `<kbd>${c.key}</kbd><i>${c.icon}</i><b>${n}</b>`; d.addEventListener('click', () => this.useItem(c.id)); box.appendChild(d);
            }
            const st = []; if (e.boostT > 0) st.push(`◈×2 ${Math.ceil(e.boostT)}s`); if (p.shieldT > 0) st.push(`🛡 ${Math.ceil(p.shieldT)}s`);
            const s = document.createElement('div'); s.className = 'slot-status'; s.textContent = st.join('  '); box.appendChild(s);
        }
        // ------------------------------------------------------------- dibujo del terminal
        renderDealLine() {
            const el = this.$('mk-deal'); if (!el) return; const d = this.deal;
            if (!d) { el.textContent = ''; return; }
            let name = '';
            if (d.kind === 'up') name = TG.UPGRADES.find(x => x.id === d.id).name; else if (d.kind === 'item') name = TG.CONSUMABLES.find(x => x.id === d.id).name; else name = TG.COSMETICS[d.slot].items.find(x => x.id === d.id).name;
            const m = Math.max(0, Math.floor(this.dealT / 60)), s = Math.max(0, Math.floor(this.dealT % 60));
            el.innerHTML = `🔥 <b>OFERTA RELÁMPAGO −${Math.round(DEAL_OFF * 100)}%</b> · ${U.esc(name)} · ${m}:${String(s).padStart(2, '0')}`;
        }
        render() {
            const p = this.p, list = this.$('mk-list'); list.innerHTML = '';
            this.$('mk-bits').textContent = p.bits; this.renderDealLine();
            document.querySelectorAll('#mk-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === this.tab));
            const row = (html, btn) => { const r = document.createElement('div'); r.className = 'mk-row'; r.innerHTML = html; if (btn) r.appendChild(btn); list.appendChild(r); return r; };
            const mkBtn = (text, fn, o = {}) => { const b = document.createElement('button'); b.className = 'tron-button small' + (o.cls ? ' ' + o.cls : ''); b.textContent = text; b.disabled = !!o.disabled; if (!o.disabled) b.addEventListener('click', fn); return b; };
            const head = (t) => { const h = document.createElement('h3'); h.textContent = t; list.appendChild(h); };
            if (this.tab === 'upgrades') {
                head('MEJORAS PERMANENTES · el precio sube con cada nivel');
                for (const u of TG.UPGRADES) {
                    const lvl = p.upg[u.id] || 0, maxed = lvl >= u.max, cost = maxed ? 0 : this.price(TG.upgradeCost(u, lvl), 'up', u.id), deal = this.isDeal('up', u.id);
                    const pips = Array.from({ length: u.max }, (_, i) => `<s class="${i < lvl ? 'on' : ''}"></s>`).join('');
                    row(`<div class="mk-main"><b>${u.icon} ${U.esc(u.name)} ${deal ? '<em>OFERTA</em>' : ''}</b><span>${U.esc(u.per)} · ahora: ${lvl ? u.total(lvl) : 'sin mejorar'}</span><div class="pips">${pips}</div></div>`,
                        mkBtn(maxed ? 'MÁXIMO' : cost + ' ◈', () => this.buyUpgrade(u.id), { disabled: maxed || p.bits < cost }));
                }
            } else if (this.tab === 'style') {
                for (const slot of Object.keys(TG.COSMETICS)) {
                    head(TG.COSMETICS[slot].title.toUpperCase());
                    for (const it of TG.COSMETICS[slot].items) {
                        const own = this.owns(slot, it.id), eq = p.cos[slot] === it.id, cost = own ? 0 : this.price(it.cost, 'cos', it.id, slot), deal = this.isDeal('cos', it.id, slot);
                        const sw = it.color ? `<i class="sw" style="background:${it.color}"></i>` : it.rainbow ? '<i class="sw rb"></i>' : `<i class="sw" style="background:${p.color}"></i>`;
                        row(`<div class="mk-main"><b>${sw}${U.esc(it.name)} ${deal ? '<em>OFERTA</em>' : ''}</b></div>`,
                            mkBtn(eq ? 'EQUIPADO' : own ? 'EQUIPAR' : cost + ' ◈', () => this.buyCosmetic(slot, it.id), { disabled: eq || (!own && p.bits < cost), cls: eq ? 'ghost' : '' }));
                    }
                }
            } else if (this.tab === 'items') {
                head('CONSUMIBLES · se usan con las teclas 1 a 4 (máx. 9 de cada uno)');
                for (const c of TG.CONSUMABLES) {
                    const n = p.items[c.id] || 0, cost = this.price(c.cost, 'item', c.id), deal = this.isDeal('item', c.id);
                    row(`<div class="mk-main"><b>${c.icon} ${U.esc(c.name)} <kbd>${c.key}</kbd> ${deal ? '<em>OFERTA</em>' : ''}</b><span>${U.esc(c.desc)} · tienes: <b class="n">${n}</b></span></div>`,
                        mkBtn(n >= 9 ? 'LLENO' : cost + ' ◈', () => this.buyItem(c.id), { disabled: n >= 9 || p.bits < cost }));
                }
                head('APUESTAS');
                row('<div class="mk-main"><span>En las arenas puedes apostar bits antes del combate: si ganas recibes el <b>doble</b>; si pierdes o abandonas, los pierdes.</span></div>');
            } else {
                const s = p.stats, totalLv = Object.values(p.upg).reduce((a, b) => a + b, 0), maxLv = TG.UPGRADES.reduce((a, u) => a + u.max, 0);
                const cosTotal = Object.values(TG.COSMETICS).reduce((a, c) => a + c.items.filter(i => i.cost > 0).length, 0);
                head('ESTADÍSTICAS ECONÓMICAS');
                const st = (k, v) => row(`<div class="mk-main"><b>${k}</b></div><div class="mk-val">${v}</div>`);
                st('Bits actuales', p.bits); st('Bits ganados en total', s.earned); st('Bits gastados en total', s.spent); st('Enemigos derrotados', s.kills);
                st('Mejoras compradas', `${totalLv}/${maxLv}`); st('Estilos desbloqueados', `${p.owned.length}/${cosTotal}`); st('Multiplicador de botín', `×${p.lootMult.toFixed(2)}` + (this.g.economy.boostT > 0 ? ' (×2 activo)' : ''));
                st('Apuestas ganadas / perdidas', `${s.betsWon} / ${s.betsLost}`);
            }
        }
        // ------------------------------------------------------------- guardado
        serialize() { const p = this.p; return { upg: p.upg, items: p.items, owned: p.owned, cos: p.cos, lootMult: p.lootMult, regenBonus: p.regenBonus, magnet: p.magnet, stats: p.stats }; }
        restore(d) {
            const p = this.p; if (!d) return;
            p.upg = Object.assign({}, d.upg); p.items = Object.assign({ heal: 0, emp: 0, shield: 0, boost: 0 }, d.items); p.owned = (d.owned || []).slice();
            p.cos = Object.assign({}, SLOT_DEFAULT, d.cos); p.lootMult = d.lootMult || 1; p.regenBonus = d.regenBonus || 0; p.magnet = d.magnet || 0;
            p.stats = Object.assign({ earned: 0, spent: 0, kills: 0, betsWon: 0, betsLost: 0 }, d.stats);
        }
    }
    TG.Market = Market;

})(window.TG = window.TG || {});
