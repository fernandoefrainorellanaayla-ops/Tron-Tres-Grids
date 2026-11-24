/* TRON — multiplayer.js: multijugador en línea con CROSSPLAY (PC y teléfono usan el mismo relé).
   Salas con código de 5 letras · ves a los demás en el mismo mapa · chat y emotes · «Ir con…» para encontrarse (cambia de mapa o entra al mismo interior).
   Cada jugador conserva su propia partida; el relé solo comparte posición, apariencia y chat. */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G, URLKEY = 'tron_mp_url';
    class Multiplayer {
        constructor(g) { this.g = g; this.ws = null; this.me = null; this.room = ''; this.peers = new Map(); this.chat = []; this.sendT = 0; this.lastSent = ''; this.hb = 0; this.pending = null; this.status = 'desconectado'; this.init(); }
        defaultUrl() { const loc = window.location, h = loc.hostname || 'localhost', port = (+loc.port || 8765) + 1; return (loc.protocol === 'https:' ? 'wss://' : 'ws://') + h + ':' + port; }
        url() { try { return localStorage.getItem(URLKEY) || this.defaultUrl(); } catch (e) { return this.defaultUrl(); } }
        $(id) { return document.getElementById(id); }
        init() {
            const b = this.$('btn-mp'); if (b) b.addEventListener('click', () => this.toggle());
            if (!this.$('mp-modal')) return;
            this.$('mp-create').addEventListener('click', () => this.connect(''));
            this.$('mp-join').addEventListener('click', () => this.connect(this.$('mp-code').value.trim().toUpperCase()));
            this.$('mp-leave').addEventListener('click', () => this.leave());
            this.$('mp-close').addEventListener('click', () => TG.Modals.close('mp-modal'));
            this.$('mp-send').addEventListener('click', () => this.say());
            this.$('mp-text').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.say(); } e.stopPropagation(); });
            this.$('mp-url').addEventListener('change', () => { try { localStorage.setItem(URLKEY, this.$('mp-url').value.trim()); } catch (e) { /* */ } });
            this.$('mp-emotes').addEventListener('click', (e) => { const em = e.target.dataset && e.target.dataset.e; if (em) this.send({ t: 'emote', e: em }); });
        }
        toggle() { const m = this.$('mp-modal'); if (!m) return; if (this.g.state !== 'play') return; if (!m.classList.contains('hidden')) { TG.Modals.close('mp-modal'); return; } this.$('mp-url').value = this.url(); this.render(); TG.Modals.open('mp-modal'); }
        send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
        connect(room) {
            if (this.ws) this.leave(); const g = this.g, p = g.player; let u = this.$('mp-url').value.trim() || this.defaultUrl(); try { localStorage.setItem(URLKEY, u); } catch (e) { /* */ }
            if (!/^wss?:\/\//.test(u)) u = 'ws://' + u; this.status = 'conectando…'; this.render();
            try { this.ws = new WebSocket(u); } catch (e) { this.status = 'dirección no válida'; this.render(); return; }
            const ws = this.ws; let opened = false;
            ws.onopen = () => { opened = true; this.send({ t: 'join', room, name: p.name, color: p.color, form: p.form }); };
            ws.onmessage = (ev) => { try { this.onMsg(JSON.parse(ev.data)); } catch (e) { /* mensaje inválido */ } };
            ws.onerror = () => { this.status = 'no se pudo conectar (¿servidor encendido? ¿misma red?)'; this.render(); };
            ws.onclose = () => { if (this.ws === ws) { this.ws = null; this.room = ''; this.peers.clear(); this.status = opened ? 'desconectado' : this.status; this.render(); this.badge(); } };
        }
        leave() { try { if (this.ws) { this.ws.close(); } } catch (e) { /* */ } this.ws = null; this.room = ''; this.peers.clear(); this.status = 'desconectado'; this.render(); this.badge(); }
        badge() { const b = this.$('btn-mp'); if (b) b.textContent = this.room ? '🌐 ' + (this.peers.size + 1) : '🌐'; }
        onMsg(m) {
            if (m.t === 'joined') { this.me = m.id; this.room = m.room; this.status = 'en sala'; this.peers.clear(); for (const q of m.players) this.addPeer(q); this.addChat('', 'Entraste a la sala ' + m.room + '. Comparte el código con tu amigo.'); this.lastSent = ''; }
            else if (m.t === 'joined2') { this.addPeer(m.p); this.addChat('', (m.p.name || 'Alguien') + ' se unió.'); TG.Toast.show('🌐 ' + m.p.name + ' se unió a la sala', 'good', 2600); }
            else if (m.t === 's') { const q = this.peers.get(m.id); if (q) { for (const k of ['era', 'a', 'f', 'mode', 'ang', 'mv']) if (k in m) q[k] = m[k]; if (typeof m.x === 'number') { q.tx = m.x; q.ty = m.y; if (q.x == null) { q.x = m.x; q.y = m.y; } } } }
            else if (m.t === 'left') { const q = this.peers.get(m.id); if (q) { this.addChat('', q.name + ' salió.'); this.peers.delete(m.id); } }
            else if (m.t === 'chat') { this.addChat(m.name, m.text); const q = this.peers.get(m.id); if (q) q.bubble = { text: m.text, t: 5 }; else if (m.id === this.me) this.myBubble = { text: m.text, t: 5 }; }
            else if (m.t === 'emote') { const q = this.peers.get(m.id); if (q) q.bubble = { text: m.e, t: 3 }; }
            else if (m.t === 'err') { this.status = m.msg; TG.Toast.show('🌐 ' + m.msg, 'warn', 3600); this.ws && this.ws.close(); }
            this.badge(); this.render();
        }
        addPeer(q) { q.x = q.x == null ? null : q.x; q.tx = q.x; q.ty = q.y; q.ph = 0; q.bubble = null; this.peers.set(q.id, q); }
        addChat(name, text) { this.chat.push({ name, text }); if (this.chat.length > 40) this.chat.shift(); }
        say() { const t = this.$('mp-text'), v = t.value.trim(); if (!v || !this.room) return; this.send({ t: 'chat', text: v }); t.value = ''; }
        area() { const p = this.g.player; return p.interior ? p.interior.id : ''; }
        eraName(e) { return (TG.ERA_NAME && TG.ERA_NAME[e]) || e || '?'; }
        goTo(id) {
            const q = this.peers.get(id), g = this.g; if (!q || !q.era) return; if (g.tutorial.active || g.race.active || g.tank.active || g.battle.active) { TG.Toast.show('Termina lo que estás haciendo primero.', 'warn'); return; }
            TG.Modals.close('mp-modal');
            if (q.era !== g.era) { this.pending = { id }; g.switchGrid(q.era); } else this.near(q);
        }
        near(q) { const g = this.g, p = g.player; if (q.a) { const loc = TG.locById[q.a]; if (loc && (!p.interior || p.interior.id !== q.a)) g.enterInterior(loc); } else if (p.interior) g.exitInterior(); p.x = (q.x || q.tx) + 70; p.y = (q.y || q.ty) + 40; g.camera.snap(g.currentBounds().w, g.currentBounds().h); TG.Toast.show('Te reuniste con ' + q.name + '.', 'good', 2600); TG.sound.portal(); }
        update(dt) {
            const g = this.g; if (this.pending && !g.transition && g.state === 'play') { const q = this.peers.get(this.pending.id); this.pending = null; if (q && g.era === q.era) this.near(q); }
            for (const q of this.peers.values()) { if (q.x == null && q.tx != null) { q.x = q.tx; q.y = q.ty; } if (q.x != null) { const dx = q.tx - q.x, dy = q.ty - q.y; q.moving = Math.hypot(dx, dy) > 3; q.x += dx * Math.min(1, dt * 9); q.y += dy * Math.min(1, dt * 9); if (q.moving) q.ph += dt * 10; } if (q.bubble && (q.bubble.t -= dt) <= 0) q.bubble = null; }
            if (this.myBubble && (this.myBubble.t -= dt) <= 0) this.myBubble = null;
            if (!this.room || g.state !== 'play') return; this.sendT -= dt; this.hb += dt;
            if (this.sendT <= 0) { this.sendT = 0.12; const p = g.player, k = [g.era, this.area(), Math.round(p.x), Math.round(p.y), p.mode, p.f].join('|'); if (k !== this.lastSent || this.hb > 1.5) { this.hb = 0; this.lastSent = k; this.send({ t: 's', era: g.era, a: this.area(), x: Math.round(p.x), y: Math.round(p.y), ang: +(p.angle || 0).toFixed(2), f: p.f || 1, mode: p.mode, mv: p.moving ? 1 : 0 }); } }
        }
        drawables(cam, t) {
            const g = this.g, out = []; if (!this.room) return out; const area = this.area();
            for (const q of this.peers.values()) {
                if (q.x == null || q.era !== g.era || (q.a || '') !== area || !cam.onScreen(q.x, q.y, 120)) continue;
                out.push({ y: q.y, draw: (ctx) => {
                    const x = q.x - cam.ox, y = q.y - cam.oy;
                    if (q.mode === 'cycle') G.cycle(ctx, x, y + 6, q.ang || 0, q.color, { t }); else G.playerSprite(ctx, x, y + 14, { form: q.form || 'human', c: q.color, a: '#ffffff', f: q.f || 1, ph: q.ph, moving: q.moving, look: 'visor', t });
                    G.nameplate(ctx, x, y - (q.mode === 'cycle' ? 54 : 100), '🌐 ' + q.name, q.color);
                    if (q.bubble) { ctx.font = '12px "Share Tech Mono", monospace'; const w = Math.min(220, ctx.measureText(q.bubble.text).width + 18); ctx.fillStyle = 'rgba(2,10,16,.9)'; ctx.fillRect(x - w / 2, y - 140, w, 24); ctx.strokeStyle = q.color; ctx.strokeRect(x - w / 2, y - 140, w, 24); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(q.bubble.text.slice(0, 30), x, y - 123); }
                } });
            }
            return out;
        }
        render() {
            const $ = (id) => this.$(id); if (!$('mp-modal')) return; const on = !!this.room;
            $('mp-status').textContent = on ? 'Sala ' + this.room + ' · ' + (this.peers.size + 1) + ' jugador(es)' : 'Estado: ' + this.status;
            $('mp-conn').style.display = on ? 'none' : ''; $('mp-room').style.display = on ? '' : 'none'; $('mp-code-big').textContent = this.room;
            const list = $('mp-players'); list.innerHTML = '';
            for (const q of this.peers.values()) { const row = document.createElement('div'); row.className = 'ct-row'; const where = q.a ? 'dentro de un edificio' : this.eraName(q.era); row.innerHTML = `<div class="ct-av" style="--c:${/^#[0-9a-fA-F]{6}$/.test(q.color) ? q.color : '#00D4FF'}">🌐</div><div class="ct-main"><b></b><span></span></div>`; row.querySelector('b').textContent = q.name; row.querySelector('span').textContent = where; const bt = document.createElement('button'); bt.className = 'tron-button small'; bt.textContent = 'IR CON'; bt.addEventListener('click', () => this.goTo(q.id)); row.appendChild(bt); list.appendChild(row); }
            if (on && !this.peers.size) list.innerHTML = '<p class="dim">Esperando a tu amigo… dile el código de sala y que abra 🌐 → «Unirse».</p>';
            const log = $('mp-chat'); log.innerHTML = ''; for (const c of this.chat.slice(-12)) { const d = document.createElement('div'); d.textContent = (c.name ? c.name + ': ' : '· ') + c.text; log.appendChild(d); } log.scrollTop = log.scrollHeight;
        }
    }
    TG.Multiplayer = Multiplayer;
})(window.TG = window.TG || {});
