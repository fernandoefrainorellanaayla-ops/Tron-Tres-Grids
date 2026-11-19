/* TRON — companions.js: compañeros estilo "salir con amigos". Siguen (a pie o en ciclo), luchan, comentan y suben amistad (mín. 25 para invitar).
   En la Grid 2010 tras la traición Tron "está muerto": no se muestra en lugares públicos. Aliados temporales de misión. */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G, B = (...l) => l;
    TG.COMPANIONS = {
        tron_82: { banter: B('Mantén la guardia alta.', 'El MCP no descansa. Nosotros tampoco.', 'Bien hecho. Sigamos.') }, ram_82: { banter: B('Mis probabilidades mejoran a tu lado.', 'Calculo un 87% de éxito.') },
        flynn_82: { banter: B('Esto es como un buen juego: hay que improvisar.', 'Si algo falla, probamos otra puerta trasera.') }, yori_82: { banter: B('Cuida tu energía. Yo cuidaré la mía.'), support: true },
        tron_2010: { hidden2010: true, hideLine: 'Aquí me creen muerto. Te espero fuera de la ciudad.', banter: B('Hay que mantener la esperanza discreta.', 'Beck aprende rápido. Tú también.'), strong: true },
        beck_2010: { banter: B('¡Esto me recuerda a mis carreras en Argón!', 'Si Tesler aparece, le doy una sorpresa.') }, zed_2010: { banter: B('Yo solo traje chistes. Pero lanzo bien los discos.') },
        mara_2010: { banter: B('Con paciencia se arregla cualquier cosa.') }, quorra_2010: { banter: B('Kevin dice que hay que mirar el amanecer. ¿Tú lo has visto?') },
        sam_flynn: { banter: B('Mi padre diseñó esto. Yo lo arreglo a lo bruto.', 'Una moto y una idea: suficiente.') }, bartik_2010: { banter: B('No me gusta pelear, pero lo hago bien.') },
        ares_2025: { banter: B('Pregunto: ¿puedo existir más de 29 minutos?', 'Aprendo de cada combate.') }, seth_2025: { banter: B('Si vamos a salvar el mundo, que haya café.') },
        ajay_2025: { banter: B('Esto no es parte de mi descripción de puesto.') }, jet_bradley: { banter: B('Mi padre diseñó a Tron. Yo solo intento no romper nada.') },
        mercury: { banter: B('Yo corro, tú me sigues.') }, query: { banter: B('Todo deja un rastro. Sigámoslo.') }, exo: { banter: B('¡Vamos, vamos! Cada segundo cuenta.') }, cass: { banter: B('A veces recuerdo cosas. Hoy me siento bien.') }
    };
    const PUBLIC_HUBS = ['tron_city_2010', 'argon_city', 'argon_square', 'argon_coliseum', 'end_of_line', 'armory_2010', 'game_arena_2010', 'light_cycle_grid_2010', 'arjia_city', 'argon_park', 'club_0001001', 'iso_city'], MIN_FRIEND = 25;
    class Companions {
        constructor(g) { this.g = g; this.list = []; this.temp = []; this.friend = {}; this.banterT = 20; this.waypoint = null; this.areaKey = null; this.hideT = 0; this.lastTalk = {};
            document.getElementById('contacts-close').addEventListener('click', () => TG.Modals.close('contacts-modal')); document.getElementById('contacts-go').addEventListener('click', () => this.goToPlace()); }
        all() { return this.list.concat(this.temp); }
        dropTemp() { this.temp = []; }
        mk(id, o = {}) { const n = TG.npcById[id], cfg = TG.COMPANIONS[id] || {}, p = this.g.player; return { id, name: n.name, color: n.color, look: n.look === 'mr' ? 'visor' : n.look, acc: n.acc, x: p.x - 60, y: p.y + 40, f: 1, ph: 0, moving: false, cd: 1.2, seed: Math.random() * 9, vis: 1, strong: !!(o.strong || cfg.strong), temp: !!o.temp, hide: false, cfg }; }
        addTemp(id, o = {}) { if (this.temp.find(a => a.id === id)) return; const a = this.mk(id, Object.assign({ temp: true }, o)); if (o.at) { a.x = o.at.x; a.y = o.at.y; } this.temp.push(a); this.g.particles.ring(a.x, a.y, a.color, 90); }
        friendship(id) { return this.friend[id] || 0; }
        addFriend(id, n) { this.friend[id] = U.clamp((this.friend[id] || 0) + n, 0, 100); }
        onTalk(id) { if (!TG.COMPANIONS[id]) return; const now = Date.now(); if (!(id in this.friend)) { this.friend[id] = 20; TG.Toast.show(`♥ Amistad con ${TG.npcById[id].name} iniciada`, 'good', 2400); } else if (now - (this.lastTalk[id] || 0) > 45000) { this.addFriend(id, 5); TG.Toast.show(`♥ Amistad con ${TG.npcById[id].name}: ${this.friendship(id)}`, 'good', 1800); } this.lastTalk[id] = now; }
        canInvite(id) { if (this.list.length >= 2 && !this.list.find(a => a.id === id)) return 'Ya llevas 2 compañeros.'; if (this.friendship(id) < MIN_FRIEND) return `Amistad insuficiente (${this.friendship(id)}/${MIN_FRIEND}): habla más con él o ella.`; if (this.g.tutorial.active) return 'No durante el entrenamiento.'; return null; }
        invite(id) { const why = this.canInvite(id); if (why) { TG.Toast.show(why, 'warn', 3000); return; } if (this.list.find(a => a.id === id)) return; const a = this.mk(id); this.list.push(a); this.g.particles.ring(a.x, a.y, a.color, 110); this.g.particles.voxels(a.x, a.y - 20, a.color, 20, 3); TG.sound.portal(); TG.Toast.show(`${a.name} se une a ti.`, 'good', 3200); this.renderContacts(); }
        dismiss(id) { this.list = this.list.filter(a => a.id !== id); this.renderContacts(); }
        isPublic() { const p = this.g.player; if (p.interior) return false; return PUBLIC_HUBS.some(id => { const l = TG.locById[id]; return l && l.era === '2010' && Math.hypot(p.x - l.x, p.y - l.y) < l.r + 420; }); }
        update(dt) {
            const g = this.g, p = g.player, k = g.areaKey();
            if (this.areaKey !== k) { this.areaKey = k; for (const a of this.all()) { a.x = p.x - 50 + Math.random() * 20; a.y = p.y + 40; } }
            if (g.battle.active) return;
            const hideNow = g.era === '2010' && g.phase2010() === 'post' && this.isPublic(); this.banterT -= dt; this.hideT -= dt;
            this.all().forEach((a, i) => {
                a.hide = !!(a.cfg.hidden2010 && hideNow); a.vis = U.lerp(a.vis, a.hide ? 0.3 : 1, dt * 4);
                if (a.hide && this.hideT <= 0 && !a.temp) { this.hideT = 40; g.combat.floater(a.x, a.y - 80, a.cfg.hideLine || 'No debo mostrarme aquí.', '#BFFFFF'); }
                const sd = i % 2 ? 1 : -1; let tx, ty;
                if (p.mode === 'cycle') { tx = p.x - Math.cos(p.angle) * 80 + Math.cos(p.angle + Math.PI / 2) * sd * 46; ty = p.y - Math.sin(p.angle) * 80 + Math.sin(p.angle + Math.PI / 2) * sd * 46; } else { tx = p.x + sd * 62; ty = p.y + 46; }
                if (a.hide) { tx = p.x - 520; ty = p.y + 300; }
                const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
                if (d > 1100 && !p.interior) { a.x = p.x - 60; a.y = p.y + 50; g.particles.ring(a.x, a.y, a.color, 80); }
                else if (d > 6) { const sp = Math.min(d * 5, p.mode === 'cycle' ? 620 : 300) * dt; a.x += dx / d * sp; a.y += dy / d * sp; a.moving = true; a.ph += dt * 11; if (Math.abs(dx) > 2) a.f = dx > 0 ? 1 : -1; } else a.moving = false;
                a.mode = p.mode; a.angle = p.angle; a.cd -= dt;
                if (a.cd <= 0 && !a.hide && p.mode === 'foot') {
                    let best = null, bd = 460; for (const e of g.combat.enemies) { if (!e.isAlive || e.ally || e.kind === 'dummy') continue; const dd = Math.hypot(e.x - a.x, e.y - a.y); if (dd < bd) { bd = dd; best = e; } }
                    if (best) { best.hit((a.strong ? 26 : 14) * (0.9 + 0.1 * g.difficulty.threat), g, { stun: 0.12 }); g.combat.arcs.push({ x1: a.x, y1: a.y - 26, x2: best.x, y2: best.y - 24, life: 0.18 }); TG.sound.throwDisc(); a.cd = a.strong ? 0.9 : 1.4; } else a.cd = 0.3;
                    if (a.cfg.support && p.health < p.maxHealth * 0.5 && Math.random() < 0.02) { p.health = Math.min(p.maxHealth, p.health + 12); g.combat.floater(p.x, p.y - 80, '+12 ♥', '#7DFF9B'); }
                }
            });
            if (this.banterT <= 0) { this.banterT = 26 + Math.random() * 20; const a = U.pick(this.all().filter(q => !q.hide)); if (a && a.cfg.banter) g.combat.floater(a.x, a.y - 84, U.pick(a.cfg.banter), a.color); }
            this._ft = (this._ft || 0) + dt; if (this._ft > 60 && this.list.length) { this._ft = 0; for (const a of this.list) this.addFriend(a.id, 1); }
            const w = this.waypoint;
            if (w && g.era === w.era && !p.interior && Math.hypot(p.x - w.x, p.y - w.y) < w.r + 90) { this.waypoint = null; if (this.list.length) { for (const a of this.list) this.addFriend(a.id, 8); g.economy.add(40 * this.list.length); TG.Toast.show(`Pasaste un buen rato en ${w.name} con ${this.list.map(a => a.name).join(' y ')}: +${40 * this.list.length} bits, amistad +8`, 'good', 5200); TG.sound.reward(); } else TG.Toast.show('Llegaste a ' + w.name + '.', 'info', 2400); }
        }
        drawables(cam, t) {
            const out = []; if (this.g.battle.active) return out;
            for (const a of this.all()) { if (!cam.onScreen(a.x, a.y, 120)) continue; out.push({ y: a.y, draw: (c) => { const x = a.x - cam.ox, y = a.y - cam.oy; if (a.mode === 'cycle') G.cycle(c, x, y + 6, a.angle || 0, a.color, { t }); else G.humanoid(c, x, y + 14, { c: a.color, a: '#fff', f: a.f, ph: a.ph, moving: a.moving, look: a.look, acc: a.acc, t, seed: a.seed, alpha: a.vis }); G.nameplate(c, x, y - (a.mode === 'cycle' ? 52 : 98), (a.temp ? '' : '♥ ') + a.name, a.color); } }); }
            return out;
        }
        guide() { const w = this.waypoint; return w && w.era === this.g.era && !this.g.player.interior ? { x: w.x, y: w.y, label: w.name.toUpperCase() } : null; }
        open() { if (this.g.state !== 'play') return; if (this.g.tutorial.active) { TG.Toast.show('Los contactos se desbloquean al terminar el entrenamiento.', 'warn'); return; } this.renderContacts(); TG.Modals.open('contacts-modal'); }
        renderContacts() {
            const g = this.g, box = document.getElementById('contacts-list'); if (!box) return; box.innerHTML = '';
            const ids = Object.keys(TG.COMPANIONS).filter(id => g.met.has(id) || this.list.find(a => a.id === id));
            if (!ids.length) box.innerHTML = '<p class="dim">Aún no conoces a nadie que pueda acompañarte. Habla con los personajes de las Grids (Tron, Beck, Quorra, Jet, Exo…): al hablar nace la amistad.</p>';
            for (const id of ids) {
                const n = TG.npcById[id], f = this.friendship(id), on = !!this.list.find(a => a.id === id), why = on ? null : this.canInvite(id), row = document.createElement('div'); row.className = 'ct-row';
                row.innerHTML = `<div class="ct-av" style="--c:${n.color}">${U.esc(n.avatar)}</div><div class="ct-main"><b>${U.esc(n.name)}</b><span>${U.esc(TG.ERA_NAME[n.grid] || n.grid)} · ${U.esc(n.role)}</span><div class="ct-bar"><i style="width:${f}%"></i></div><span class="ct-f">♥ ${f}/100${why && !on ? ' · ' + U.esc(why) : ''}</span></div>`;
                const b = document.createElement('button'); b.className = 'tron-button small' + (on ? ' ghost' : ''); b.textContent = on ? 'DESPEDIR' : 'INVITAR'; b.disabled = !on && !!why; b.addEventListener('click', () => on ? this.dismiss(id) : this.invite(id)); row.appendChild(b); box.appendChild(row);
            }
            const sel = document.getElementById('contacts-place'); sel.innerHTML = ''; for (const l of TG.LOCATIONS[g.era] || []) if (!l.hidden || g.discovered.has(l.id)) { const o = document.createElement('option'); o.value = l.id; o.textContent = l.name; sel.appendChild(o); }
            document.getElementById('contacts-go').disabled = !this.list.length;
        }
        goToPlace() { const id = document.getElementById('contacts-place').value, l = TG.locById[id]; if (!l) return; this.waypoint = { x: l.x, y: l.y + l.r + 30, r: l.r, era: l.era, name: l.name }; TG.Modals.close('contacts-modal'); TG.Toast.show(`Vamos a ${l.name} con tus amigos. Sigue la flecha dorada.`, 'info', 4000); }
        serialize() { return { friend: this.friend, list: this.list.map(a => a.id) }; }
        restore(d) { if (!d) return; this.friend = d.friend || {}; this.list = (d.list || []).filter(id => TG.npcById[id]).map(id => this.mk(id)); }
    }
    TG.Companions = Companions;
})(window.TG = window.TG || {});
