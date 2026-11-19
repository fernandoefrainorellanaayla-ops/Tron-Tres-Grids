/* ==========================================================================
   TRON: LAS TRES GRIDS — gfx_chars.js
   Dibujo procedural de personajes, vehículos y utilidades de neón.
   Todo se dibuja con trazos de luz (varias pasadas aditivas) en vez de
   shadowBlur, para que el "bloom" final haga el brillo sin coste enorme.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U;
    const G = TG.G = TG.G || {};

    G.THEME = {
        '1982': { bg: '#00050c', bg2: '#001420', grid: '#0aa6d6', major: '#4ee0ff', glow: '#00D4FF', accent: '#FF8A00', danger: '#FF4A1A', sea: '#04304f', seaLine: '#18a8e8', text: '#bff4ff', vignette: '0,8,20' },
        '2010': { bg: '#02060d', bg2: '#06131f', grid: '#12c4dc', major: '#7ffaff', glow: '#19F0FF', accent: '#FF9A1F', danger: '#FF7A00', sea: '#03182a', seaLine: '#19d6ff', text: '#e8ffff', vignette: '0,6,14' },
        '2025': { bg: '#0a0207', bg2: '#1a040c', grid: '#d4153a', major: '#ff5c7c', glow: '#FF1744', accent: '#FFFFFF', danger: '#FF1744', sea: '#20040a', seaLine: '#ff3358', text: '#ffe2e8', vignette: '14,0,4' }
    };

    // ---- trazo neón: tres pasadas aditivas (halo ancho, halo medio, núcleo)
    G.stroke = (ctx, color, w = 2, a = 1) => {
        ctx.save();
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.14 * a; ctx.lineWidth = w * 5; ctx.stroke();
        ctx.globalAlpha = 0.32 * a; ctx.lineWidth = w * 2.4; ctx.stroke();
        ctx.globalAlpha = a; ctx.lineWidth = w; ctx.stroke();
        ctx.restore();
    };
    // línea suelta con neón
    G.line = (ctx, x1, y1, x2, y2, color, w = 2, a = 1) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); G.stroke(ctx, color, w, a); };
    // resplandor radial aditivo
    G.glow = (ctx, x, y, r, color, a = 0.5) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, U.rgba(color, a)); g.addColorStop(1, U.rgba(color, 0));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
    };
    G.ngon = (cx, cy, rx, ry, n, rot = 0) => {
        const pts = [];
        for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
        return pts;
    };
    G.path = (ctx, pts, close = true) => {
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        if (close) ctx.closePath();
    };

    // ---- extrusión 2.5D de un polígono convexo hacia arriba (vx,vy = desplazamiento del techo)
    G.extrude = (ctx, pts, vx, vy, o = {}) => {
        const n = pts.length;
        let s = 0;
        for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; }
        const side = o.side || '#06141f', lit = o.lit || '#0d3a52', edge = o.edge || '#19F0FF', roof = o.roof || '#0a2230';
        const bands = o.bands === undefined ? 2 : o.bands;
        for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % n];
            const ex = b[0] - a[0], ey = b[1] - a[1];
            const nx = s > 0 ? ey : -ey, ny = s > 0 ? -ex : ex;
            const vis = nx * -vx + ny * -vy;
            if (vis <= 0) continue;
            const len = Math.hypot(nx, ny) || 1;
            const shade = U.clamp(0.25 + 0.75 * ((nx / len) * 0.4 + (ny / len) * 0.9) * 0.5 + 0.5, 0, 1);
            const grad = ctx.createLinearGradient(a[0], a[1], a[0] + vx, a[1] + vy);
            grad.addColorStop(0, side); grad.addColorStop(1, U.mix(side, lit, shade));
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] + vx, b[1] + vy); ctx.lineTo(a[0] + vx, a[1] + vy); ctx.closePath(); ctx.fill();
            if (bands > 0) {
                ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = U.rgba(edge, 0.28); ctx.lineWidth = 1;
                for (let k = 1; k <= bands; k++) {
                    const f = k / (bands + 1);
                    ctx.beginPath(); ctx.moveTo(a[0] + vx * f, a[1] + vy * f); ctx.lineTo(b[0] + vx * f, b[1] + vy * f); ctx.stroke();
                }
                ctx.restore();
            }
        }
        const top = pts.map(p => [p[0] + vx, p[1] + vy]);
        ctx.fillStyle = roof; G.path(ctx, top); ctx.fill();
        G.path(ctx, top); G.stroke(ctx, edge, o.edgeW || 1.6, 0.95);
        // aristas verticales visibles
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + n - 1) % n];
            const f = (p, q) => { const ex = q[0] - p[0], ey = q[1] - p[1]; const nx = s > 0 ? ey : -ey, ny = s > 0 ? -ex : ex; return nx * -vx + ny * -vy > 0; };
            if (f(a, b) || f(c, a)) { ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + vx, a[1] + vy); }
        }
        G.stroke(ctx, edge, 1.1, 0.6);
        return top;
    };

    // ============================================================ HUMANOIDE
    // o: { c color, a acento, f frente(±1), ph fase, s escala, look, moving, disc, symbol, t tiempo, dim }
    G.humanoid = (ctx, x, y, o) => {
        const s = (o.s || 1) * 1.16, f = o.f >= 0 ? 1 : -1, ph = o.ph || 0, t = o.t || 0;
        const c = o.c || '#00D4FF', a = o.a || '#ffffff';
        const look = o.look || 'visor';
        const dim = o.dim === undefined ? 1 : o.dim;
        if (look === 'bit') return G.bit(ctx, x, y - 30 * s, o);
        if (look === 'mcp') return G.mcp(ctx, x, y - 20, o);
        const moving = o.moving;
        const swing = moving ? Math.sin(ph) * 7 : 0;
        const bob = moving ? Math.abs(Math.sin(ph)) * 2.2 : Math.sin(t * 2 + (o.seed || 0)) * 0.9;
        ctx.save();
        ctx.translate(x, y - bob * s);
        ctx.scale(s * f, s);
        ctx.globalAlpha = dim * (o.alpha === undefined ? 1 : o.alpha);
        // sombra + halo en el suelo
        ctx.save(); ctx.translate(0, bob); ctx.scale(1 / f, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, 2, 15, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        G.glow(ctx, 0, 2, 30, c, 0.28);
        ctx.restore();
        const human = look === 'human';
        const suit = human ? '#161c26' : '#04080e';
        const neon = human ? U.mix(c, '#ffffff', 0.15) : c;
        const lw = human ? 1.4 : 2;
        // piernas
        const legLen = look === 'long' ? 26 : 22;
        for (const sd of [-1, 1]) {
            const sw = swing * sd;
            ctx.fillStyle = suit; ctx.beginPath(); ctx.moveTo(sd * 2, -22); ctx.lineTo(sd * 7 + sw * 0.5, -legLen * 0.5); ctx.lineTo(sd * 6 + sw, 0); ctx.lineTo(sd * 2 + sw, 0); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(sd * 4.5, -21); ctx.lineTo(sd * 6.5 + sw * 0.5, -legLen * 0.5); ctx.lineTo(sd * 4.2 + sw, -1); G.stroke(ctx, neon, lw * 0.8, 0.9);
        }
        // brazos (el trasero antes del torso)
        const up = o.armsUp || 0;   // pose del portal: brazos en alto sosteniendo el disco
        const arm = (sd, swa) => {
            const ex = U.lerp(sd * 12 + swa * 0.4, sd * 13, up), ey = U.lerp(-34, -56, up), hx = U.lerp(sd * 10 + swa, sd * 7, up), hy = U.lerp(-25, -71, up);
            ctx.beginPath(); ctx.moveTo(sd * 9, -43); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy);
            ctx.lineWidth = 4.5; ctx.strokeStyle = suit; ctx.lineCap = 'round'; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sd * 9, -43); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); G.stroke(ctx, neon, lw * 0.7, 0.9);
        };
        arm(-1, -swing);
        // capa / abrigo largo / túnica
        if (look === 'long' || look === 'sage' || look === 'mr') {
            const wide = look !== 'long'; ctx.fillStyle = wide ? '#0a0a18' : '#12080a';
            ctx.beginPath(); ctx.moveTo(-9, -44); ctx.lineTo(9, -44); ctx.lineTo(wide ? 15 : 11, -2); ctx.lineTo(wide ? -15 : -11, -2); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-9, -44); ctx.lineTo(wide ? -15 : -11, -2); ctx.moveTo(9, -44); ctx.lineTo(wide ? 15 : 11, -2); G.stroke(ctx, neon, lw, 0.9);
        }
        // torso
        ctx.fillStyle = suit;
        ctx.beginPath(); ctx.moveTo(-10, -45); ctx.lineTo(10, -45); ctx.lineTo(7, -22); ctx.lineTo(-7, -22); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-10, -45); ctx.lineTo(-7, -22); ctx.lineTo(7, -22); ctx.lineTo(10, -45); G.stroke(ctx, neon, lw, 0.95);
        // circuitos del traje
        ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(0, -23); ctx.moveTo(-8, -40); ctx.lineTo(-2.5, -35); ctx.lineTo(-2.5, -28); ctx.moveTo(8, -40); ctx.lineTo(2.5, -35); ctx.lineTo(2.5, -28);
        ctx.moveTo(-6.5, -24); ctx.lineTo(6.5, -24); G.stroke(ctx, neon, lw * 0.6, human ? 0.45 : 0.85);
        // hombreras
        ctx.fillStyle = suit; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 10, -44, 4.6, 3.2, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.beginPath(); ctx.ellipse(-10, -44, 4.6, 3.2, 0, 0, Math.PI * 2); ctx.ellipse(10, -44, 4.6, 3.2, 0, 0, Math.PI * 2); G.stroke(ctx, neon, lw * 0.7, 0.9);
        arm(1, swing);
        // disco de identidad a la espalda
        if (o.disc !== false && !human) {
            ctx.save(); ctx.translate(-9, -36); ctx.beginPath(); ctx.ellipse(0, 0, 5.2, 6.4, 0, 0, Math.PI * 2); G.stroke(ctx, a, 1.1, 0.85);
            ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 3, 0, 0, Math.PI * 2); G.stroke(ctx, c, 1, 0.9); ctx.restore();
        }
        // cabeza
        const hy = -52;
        if (human) {
            ctx.fillStyle = '#c9a487'; ctx.beginPath(); ctx.arc(0, hy, 6.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = o.hair || '#2b2118'; ctx.beginPath(); ctx.arc(0, hy - 1.5, 6.6, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.arc(0, hy, 6.8, 0, Math.PI * 2); G.stroke(ctx, neon, 1, 0.5);
        } else if (look === 'helmet') {
            ctx.fillStyle = '#05070b'; ctx.beginPath(); ctx.moveTo(-8, hy + 4); ctx.lineTo(-8.5, hy - 3); ctx.lineTo(-3, hy - 10); ctx.lineTo(3, hy - 10); ctx.lineTo(8.5, hy - 3); ctx.lineTo(8, hy + 4); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-8, hy + 4); ctx.lineTo(-8.5, hy - 3); ctx.lineTo(-3, hy - 10); ctx.lineTo(3, hy - 10); ctx.lineTo(8.5, hy - 3); ctx.lineTo(8, hy + 4); ctx.closePath(); G.stroke(ctx, neon, lw * 0.8, 0.9);
            ctx.beginPath(); ctx.moveTo(-6, hy - 1); ctx.lineTo(7, hy - 1); G.stroke(ctx, a, 1.8, 1);
        } else if (look === 'mask') {
            ctx.fillStyle = '#020305'; ctx.beginPath(); ctx.arc(0, hy, 7.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, hy, 7.2, 0, Math.PI * 2); G.stroke(ctx, neon, lw * 0.8, 0.9);
            ctx.beginPath(); ctx.moveTo(-1, hy - 1.5); ctx.lineTo(6, hy - 1); ctx.moveTo(-5, hy + 3); ctx.lineTo(5, hy + 3.4); G.stroke(ctx, a, 1.5, 1);
        } else if (look === 'mr') {   // rostro visible con accesorios
            const acc = o.acc || [];
            if (acc.includes('ponytail')) { const sw = Math.sin(t * 2.2 + (o.seed || 0)) * 2.5; ctx.beginPath(); ctx.moveTo(-5, hy - 3); ctx.quadraticCurveTo(-13 + sw, hy + 2, -11 + sw, hy + 17); ctx.lineWidth = 3.4; ctx.strokeStyle = '#2a1a10'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5, hy - 3); ctx.quadraticCurveTo(-13 + sw, hy + 2, -11 + sw, hy + 17); G.stroke(ctx, neon, 0.9, 0.7); ctx.fillStyle = a; ctx.fillRect(-7.6, hy - 2.4, 3.2, 3); }
            ctx.fillStyle = '#d3b08f'; ctx.beginPath(); ctx.arc(0, hy, 6.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = acc.includes('grayhair') ? '#c9c9d4' : '#2a1a10'; ctx.beginPath(); ctx.arc(0, hy - 1.2, 7, Math.PI * 1.04, Math.PI * 1.96); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.arc(0, hy, 7, 0, Math.PI * 2); G.stroke(ctx, neon, 1, 0.6);
            if (acc.includes('glasses')) { ctx.lineWidth = 1.3; ctx.strokeStyle = '#e8ffff'; ctx.beginPath(); ctx.arc(1.4, hy - 0.6, 2.5, 0, Math.PI * 2); ctx.moveTo(8.4, hy - 0.6); ctx.arc(5.9, hy - 0.6, 2.5, 0, Math.PI * 2); ctx.moveTo(3.9, hy - 0.8); ctx.lineTo(3.4, hy - 0.8); ctx.stroke(); }
            if (acc.includes('mustache')) { ctx.strokeStyle = acc.includes('grayhair') ? '#9a9aa8' : '#2a1a10'; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.6, hy + 3.2); ctx.quadraticCurveTo(3.6, hy + 7, 8, hy + 3.2); ctx.stroke(); }
        } else if (look === 'skull') {   // Mr. U: el jinete del minijuego
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let k = 0; k < 5; k++) { const L = 14 + k * 4 + Math.sin(t * 13 + k * 2) * 4; ctx.fillStyle = k % 2 ? 'rgba(255,210,70,.8)' : 'rgba(255,100,30,.85)'; ctx.beginPath(); ctx.moveTo(-3, hy - 3 + k * 2); ctx.quadraticCurveTo(-3 - L * 0.5, hy - 12 + Math.sin(t * 11 + k) * 3, -3 - L, hy - 6 + k * 3 + Math.sin(t * 15 + k) * 3); ctx.quadraticCurveTo(-3 - L * 0.4, hy + 2, -3, hy + 5 + k); ctx.fill(); }
            ctx.restore();
            ctx.fillStyle = '#efe6d8'; ctx.beginPath(); ctx.arc(0, hy, 6.8, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-3.4, hy + 3, 7.4, 5);
            ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.arc(1.4, hy - 0.6, 2, 0, Math.PI * 2); ctx.arc(5.4, hy - 0.6, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(1.6, hy + 4.5, 1, 3.4); ctx.fillRect(4, hy + 4.5, 1, 3.4);
            ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.arc(1.4, hy - 0.6, 0.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a0f0a'; ctx.beginPath(); ctx.ellipse(0, hy - 5.2, 13, 3.4, -0.08, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.rect(-6.5, hy - 15, 13, 11); ctx.fill();
            ctx.strokeStyle = '#FFB040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, hy - 5.2, 13, 3.4, -0.08, 0, Math.PI * 2); ctx.moveTo(-6.5, hy - 7.5); ctx.lineTo(6.5, hy - 7.5); ctx.stroke();
        } else if (look === 'sage') {
            ctx.fillStyle = '#0a0a18'; ctx.beginPath(); ctx.moveTo(-9, hy + 6); ctx.lineTo(0, hy - 13); ctx.lineTo(9, hy + 6); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-9, hy + 6); ctx.lineTo(0, hy - 13); ctx.lineTo(9, hy + 6); G.stroke(ctx, neon, lw, 0.95);
            ctx.beginPath(); ctx.arc(-2.6, hy - 0.5, 1.2, 0, Math.PI * 2); ctx.arc(2.6, hy - 0.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = a; ctx.fill();
        } else {
            ctx.fillStyle = '#05080e'; ctx.beginPath(); ctx.arc(0, hy, 6.9, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, hy, 6.9, 0, Math.PI * 2); G.stroke(ctx, neon, lw * 0.8, 0.9);
            if (look === 'plain') { ctx.beginPath(); ctx.arc(0, hy, 6.9, Math.PI * 1.1, Math.PI * 1.9); G.stroke(ctx, a, 1.2, 0.9); ctx.beginPath(); ctx.moveTo(-6, hy + 3); ctx.quadraticCurveTo(-9, hy + 12, -5, hy + 16); G.stroke(ctx, neon, 1.2, 0.8); }
            else { ctx.beginPath(); ctx.moveTo(-5.5, hy - 0.6); ctx.lineTo(6.4, hy - 0.6); G.stroke(ctx, a, 1.8, 1); }
            if (look === 'crown') {
                ctx.beginPath(); ctx.moveTo(-7, hy - 9); ctx.lineTo(-4, hy - 18); ctx.lineTo(0, hy - 11); ctx.lineTo(4, hy - 18); ctx.lineTo(7, hy - 9); G.stroke(ctx, neon, 1.4, 1);
            }
        }
        if (up > 0.3) {   // el disco de identidad, en lo alto entre las manos
            ctx.save(); ctx.translate(0, -78); G.glow(ctx, 0, 0, 34 * up, a, 0.7 * up); ctx.scale(1, 0.42);
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = '#03080d'; ctx.fill(); G.stroke(ctx, a, 2.2, up); ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); G.stroke(ctx, c, 1.6, up); ctx.restore();
        }
        ctx.restore();
        // símbolo orbital (Mr. C / Mr. L)
        if (o.symbol) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const ang = t * 1.4; const sx = x + Math.cos(ang) * 22 * s, sy = y - 76 * s + Math.sin(ang) * 6;
            ctx.font = `bold ${Math.round(15 * s)}px Orbitron, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10; ctx.fillText(o.symbol, sx, sy); ctx.restore();
        }
    };

    // ============================================== FORMAS DEL PROGRAMA DEL JUGADOR
    G.FORMS = [
        { id: 'human', name: 'Humanoide', glyph: '♙' }, { id: 'circle', name: 'Círculo', glyph: '●' }, { id: 'square', name: 'Cuadrado', glyph: '■' },
        { id: 'triangle', name: 'Triángulo', glyph: '▲' }, { id: 'diamond', name: 'Rombo', glyph: '◆' }, { id: 'hexagon', name: 'Hexágono', glyph: '⬢' }
    ];
    G.validForm = (f) => G.FORMS.some(x => x.id === f) ? f : 'human';
    // traza (sin rellenar) el contorno de una forma centrada en el origen
    G.formPath = (ctx, form, r) => {
        ctx.beginPath();
        if (form === 'square') { const q = r * 0.88; ctx.moveTo(-q, -q); ctx.lineTo(q, -q); ctx.lineTo(q, q); ctx.lineTo(-q, q); ctx.closePath(); }
        else if (form === 'triangle') { ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 1.02, r * 0.8); ctx.lineTo(-r * 1.02, r * 0.8); ctx.closePath(); }
        else if (form === 'diamond') { ctx.moveTo(0, -r * 1.25); ctx.lineTo(r * 0.85, 0); ctx.lineTo(0, r * 1.25); ctx.lineTo(-r * 0.85, 0); ctx.closePath(); }
        else if (form === 'hexagon') { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const px = Math.cos(a) * r * 1.05, py = Math.sin(a) * r * 1.05; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); }
        else ctx.arc(0, 0, r, 0, Math.PI * 2);
    };
    // Programa geométrico flotante (círculo, cuadrado/cubo, triángulo/pirámide, rombo, hexágono)
    G.program = (ctx, x, y, o) => {
        const form = o.form || 'circle', s = o.s || 1, f = o.f >= 0 ? 1 : -1, t = o.t || 0, ph = o.ph || 0;
        const c = o.c || '#00D4FF', a = o.a || '#ffffff', moving = !!o.moving;
        const hover = (9 + (moving ? Math.abs(Math.sin(ph)) * 7 : Math.sin(t * 2.2 + (o.seed || 0)) * 2.2)) * s;
        const R = 21 * s, cy = y - hover - R * 1.3;
        ctx.save();
        ctx.globalAlpha = (o.dim === undefined ? 1 : o.dim) * (o.alpha === undefined ? 1 : o.alpha);
        // sombra y halo sobre el suelo
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(x, y + 2, R * (0.95 - hover / 160), 5.5 * s, 0, 0, Math.PI * 2); ctx.fill();
        G.glow(ctx, x, y + 2, 36 * s, c, 0.28);
        ctx.translate(x, cy); if (moving) ctx.rotate(f * 0.1 * Math.sin(ph * 2)); ctx.scale(1, 1 + (moving ? Math.sin(ph * 2) * 0.04 : 0));
        const dark = '#04080e', face = U.mix('#05090f', c, 0.16), side = U.mix('#03060a', c, 0.07);
        const lw = 2.2;
        const eye = (x0, y0, len) => { ctx.beginPath(); ctx.moveTo(f * x0, y0); ctx.lineTo(f * (x0 + len), y0); G.stroke(ctx, a, 2.4, 1); };
        G.glow(ctx, 0, 0, R * 1.9, c, 0.16);
        if (form === 'circle') {
            const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R); g.addColorStop(0, U.mix('#0b1822', c, 0.4)); g.addColorStop(1, dark);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); G.stroke(ctx, c, lw, 1);
            ctx.beginPath(); ctx.ellipse(0, 0, R * 0.98, R * 0.32, 0.3 * Math.sin(t), 0, Math.PI * 2); G.stroke(ctx, c, 1.2, 0.7);
            ctx.beginPath(); ctx.ellipse(0, 0, Math.max(2, R * 0.95 * Math.abs(Math.cos(t * 0.8))), R * 0.95, 0, 0, Math.PI * 2); G.stroke(ctx, c, 1.1, 0.55);
            eye(R * 0.1, -R * 0.12, R * 0.62);
        } else if (form === 'square') {
            const q = R * 0.85, dx = 0.5 * R * f, dy = -0.45 * R;
            ctx.fillStyle = side;   // lado visible
            ctx.beginPath(); ctx.moveTo(f * q, -q); ctx.lineTo(f * q, q); ctx.lineTo(f * q + dx, q + dy); ctx.lineTo(f * q + dx, -q + dy); ctx.closePath(); ctx.fill();
            ctx.fillStyle = U.mix('#06101a', c, 0.26);   // tapa
            ctx.beginPath(); ctx.moveTo(-q, -q); ctx.lineTo(q, -q); ctx.lineTo(q + dx, -q + dy); ctx.lineTo(-q + dx, -q + dy); ctx.closePath(); ctx.fill();
            ctx.fillStyle = face; ctx.fillRect(-q, -q, q * 2, q * 2);
            ctx.beginPath(); ctx.moveTo(f * q, -q); ctx.lineTo(f * q + dx, -q + dy); ctx.lineTo(f * q + dx, q + dy); ctx.lineTo(f * q, q);
            ctx.moveTo(-q, -q); ctx.lineTo(-q + dx, -q + dy); ctx.lineTo(q + dx, -q + dy); ctx.lineTo(q, -q); G.stroke(ctx, c, 1.6, 0.9);
            ctx.beginPath(); ctx.rect(-q, -q, q * 2, q * 2); G.stroke(ctx, c, lw, 1);
            ctx.beginPath(); ctx.moveTo(-q * 0.7, q * 0.55); ctx.lineTo(-q * 0.2, q * 0.55); ctx.lineTo(-q * 0.2, q * 0.1); ctx.moveTo(q * 0.7, q * 0.55); ctx.lineTo(q * 0.2, q * 0.55); ctx.lineTo(q * 0.2, q * 0.1); ctx.moveTo(0, -q); ctx.lineTo(0, -q * 0.5); G.stroke(ctx, c, 1.1, 0.8);
            eye(q * 0.1, -q * 0.15, q * 0.75);
        } else if (form === 'triangle') {
            ctx.fillStyle = face; G.formPath(ctx, 'triangle', R); ctx.fill();
            ctx.fillStyle = U.mix('#06101a', c, 0.3); ctx.beginPath(); ctx.moveTo(0, -R * 1.1); ctx.lineTo(f * R * 1.02, R * 0.8); ctx.lineTo(0, R * 0.8); ctx.closePath(); ctx.fill();
            G.formPath(ctx, 'triangle', R); G.stroke(ctx, c, lw, 1);
            ctx.beginPath(); ctx.moveTo(0, -R * 1.1); ctx.lineTo(0, R * 0.8); G.stroke(ctx, c, 1.2, 0.7);
            ctx.beginPath(); ctx.moveTo(0, -R * 0.25); ctx.lineTo(R * 0.52, R * 0.5); ctx.lineTo(-R * 0.52, R * 0.5); ctx.closePath(); G.stroke(ctx, c, 1.1, 0.7);
            eye(R * 0.04, R * 0.18, R * 0.5);
        } else if (form === 'diamond') {
            const w = 0.45 + 0.55 * Math.abs(Math.cos(t * 0.9)), cr = R * 0.85 * w * Math.sin(t * 0.9) * 0.4;
            ctx.fillStyle = face; ctx.beginPath(); ctx.moveTo(0, -R * 1.25); ctx.lineTo(R * 0.85 * w, 0); ctx.lineTo(0, R * 1.25); ctx.lineTo(-R * 0.85 * w, 0); ctx.closePath(); ctx.fill();
            ctx.fillStyle = U.mix('#06101a', c, 0.3); ctx.beginPath(); ctx.moveTo(cr, -R * 1.25); ctx.lineTo(R * 0.85 * w, 0); ctx.lineTo(cr, R * 1.25); ctx.lineTo(cr * 0.2, 0); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -R * 1.25); ctx.lineTo(R * 0.85 * w, 0); ctx.lineTo(0, R * 1.25); ctx.lineTo(-R * 0.85 * w, 0); ctx.closePath(); G.stroke(ctx, c, lw, 1);
            ctx.beginPath(); ctx.moveTo(cr, -R * 1.25); ctx.lineTo(cr * 0.2, 0); ctx.lineTo(cr, R * 1.25); ctx.moveTo(-R * 0.85 * w, 0); ctx.lineTo(R * 0.85 * w, 0); G.stroke(ctx, c, 1.1, 0.7);
            eye(R * 0.05 * w, -R * 0.14, R * 0.48 * w);
        } else {   // hexagon: prisma hexagonal
            const dx = 0.4 * R * f, dy = -0.35 * R;
            ctx.save(); ctx.translate(dx, dy); ctx.fillStyle = side; G.formPath(ctx, 'hexagon', R * 0.98); ctx.fill(); G.formPath(ctx, 'hexagon', R * 0.98); G.stroke(ctx, c, 1.3, 0.6); ctx.restore();
            ctx.beginPath(); for (let i = 0; i < 6; i++) { const ang = i * Math.PI / 3, px = Math.cos(ang) * R * 1.05, py = Math.sin(ang) * R * 1.05; if ((f > 0 && Math.cos(ang) > -0.1) || (f < 0 && Math.cos(ang) < 0.1)) { ctx.moveTo(px, py); ctx.lineTo(px + dx, py + dy); } } G.stroke(ctx, c, 1.2, 0.65);
            ctx.fillStyle = face; G.formPath(ctx, 'hexagon', R); ctx.fill(); G.formPath(ctx, 'hexagon', R); G.stroke(ctx, c, lw, 1);
            ctx.save(); ctx.scale(0.55, 0.55); G.formPath(ctx, 'hexagon', R); ctx.restore(); ctx.save(); ctx.scale(0.55, 0.55); G.formPath(ctx, 'hexagon', R); G.stroke(ctx, c, 1.4, 0.7); ctx.restore();
            eye(R * 0.08, -R * 0.1, R * 0.62);
        }
        if (o.armsUp > 0.3) { const u2 = o.armsUp; ctx.save(); ctx.translate(0, -R * 1.9 * u2 - R * 0.5); G.glow(ctx, 0, 0, 40 * u2, a, 0.7 * u2); ctx.scale(1, 0.4); ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fillStyle = '#03080d'; ctx.fill(); G.stroke(ctx, a, 2.2, u2); ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); G.stroke(ctx, c, 1.6, u2); ctx.restore(); ctx.beginPath(); ctx.moveTo(0, -R * 1.1); ctx.lineTo(0, -R * 1.9 * u2 - R * 0.5); G.stroke(ctx, a, 1.2, 0.6 * u2); }
        // disco de identidad: anillo orbital con un destello
        ctx.beginPath(); ctx.ellipse(0, 0, R * 1.55, R * 0.46, -0.28, 0, Math.PI * 2); G.stroke(ctx, a, 1.2, 0.5);
        const oa = t * 2.3, ox = Math.cos(oa) * R * 1.55, oy = Math.sin(oa) * R * 0.46;
        ctx.save(); ctx.rotate(-0.28); G.glow(ctx, ox, oy, 12, '#ffffff', 0.9); ctx.fillStyle = '#fff'; ctx.fillRect(ox - 1.6, oy - 1.6, 3.2, 3.2); ctx.restore();
        ctx.restore();
    };
    // elige humanoide o programa geométrico según la forma elegida por el jugador
    G.playerSprite = (ctx, x, y, o) => { if (!o.form || o.form === 'human') G.humanoid(ctx, x, y, o); else G.program(ctx, x, y, o); };

    // etiqueta de nombre
    G.nameplate = (ctx, x, y, text, color, o = {}) => {
        ctx.save();
        ctx.font = '11px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(text).width + 14, h = 16;
        ctx.fillStyle = 'rgba(0,4,10,0.62)'; ctx.strokeStyle = U.rgba(color, 0.7); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 4) : ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
        ctx.fillStyle = o.text || '#fff'; ctx.fillText(text, x, y + 0.5);
        ctx.restore();
    };
    // marcador de misión flotante ("!" disponible, "?" entregar)
    G.questMark = (ctx, x, y, kind, t) => {
        const c = kind === '?' ? '#7DFF9B' : '#FFD84A';
        const by = y + Math.sin(t * 3) * 3;
        ctx.save(); ctx.translate(x, by);
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill(); G.stroke(ctx, c, 1.8, 1);
        ctx.fillStyle = c; ctx.font = 'bold 12px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(kind, 0, 1);
        ctx.restore();
    };

    // ======================================================== BIT (poliedro)
    const PHI = (1 + Math.sqrt(5)) / 2;
    const ICO = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]];
    const ICO_E = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) { const d = Math.hypot(ICO[i][0] - ICO[j][0], ICO[i][1] - ICO[j][1], ICO[i][2] - ICO[j][2]); if (Math.abs(d - 2) < 0.01) ICO_E.push([i, j]); }
    const OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const OCT_E = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]];
    G.bit = (ctx, x, y, o) => {
        const t = o.t || 0, st = o.bitState || 'idle', s = (o.s || 1) * (st === 'idle' ? 15 : 17);
        const col = st === 'yes' ? '#FFE54A' : st === 'no' ? '#FF3A3A' : '#5CC8FF';
        const V = st === 'idle' ? ICO : OCT, E = st === 'idle' ? ICO_E : OCT_E;
        const ry = t * 1.2, rx = t * 0.7 + 0.6;
        const P = V.map(v => {
            let [vx, vy, vz] = v; const k = st === 'idle' ? 1 : 1.25;
            let x1 = vx * Math.cos(ry) + vz * Math.sin(ry), z1 = -vx * Math.sin(ry) + vz * Math.cos(ry);
            let y1 = vy * Math.cos(rx) - z1 * Math.sin(rx);
            return [x + x1 * s / 1.9 * k, y + y1 * s / 1.9 * k];
        });
        ctx.save(); ctx.translate(0, Math.sin(t * 2.2) * 3);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x, y + 34, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
        G.glow(ctx, x, y, 38, col, 0.35);
        ctx.beginPath(); for (const e of E) { ctx.moveTo(P[e[0]][0], P[e[0]][1]); ctx.lineTo(P[e[1]][0], P[e[1]][1]); }
        G.stroke(ctx, col, 1.6, 1);
        ctx.restore();
    };

    // ============================================================== MCP
    G.mcp = (ctx, x, y, o) => {
        const t = o.t || 0, s = o.s || 1;
        ctx.save(); ctx.translate(x, y - 20); ctx.scale(s, s);
        G.glow(ctx, 0, 0, 90, '#FF2A00', 0.4);
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 34 + i * 9 + Math.sin(t * 2 + i) * 2, t + i, t + i + Math.PI * 1.4); G.stroke(ctx, i === 1 ? '#FF8A00' : '#FF2A00', 1.6, 0.8); }
        ctx.fillStyle = 'rgba(30,2,0,0.9)'; ctx.beginPath(); ctx.moveTo(-26, -20); ctx.lineTo(26, -20); ctx.lineTo(30, 6); ctx.lineTo(14, 28); ctx.lineTo(-14, 28); ctx.lineTo(-30, 6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-26, -20); ctx.lineTo(26, -20); ctx.lineTo(30, 6); ctx.lineTo(14, 28); ctx.lineTo(-14, 28); ctx.lineTo(-30, 6); ctx.closePath(); G.stroke(ctx, '#FF2A00', 2, 1);
        ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-6, -4); ctx.lineTo(-18, 2); ctx.closePath(); ctx.moveTo(20, -8); ctx.lineTo(6, -4); ctx.lineTo(18, 2); ctx.closePath(); G.stroke(ctx, '#FFD000', 2, 1);
        ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(-7, 12); ctx.lineTo(0, 17); ctx.lineTo(7, 12); ctx.lineTo(14, 16); G.stroke(ctx, '#FF6A00', 1.6, 1);
        ctx.restore();
    };

    // ======================================================= CICLO DE LUZ
    // o: { fire, t, boost }
    G.cycle = (ctx, x, y, ang, color, o = {}) => {
        const t = o.t || 0;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.3, 1.3);
        // sombra/halo
        ctx.save(); ctx.rotate(-ang); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(2, 14, 30, 8, ang, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        G.glow(ctx, 0, 0, 52, color, 0.28);
        if (o.fire) {
            for (let i = 0; i < 4; i++) {
                const fl = 18 + Math.sin(t * 22 + i * 2) * 6 + i * 3;
                ctx.save(); ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = i % 2 ? 'rgba(255,200,60,0.7)' : 'rgba(255,90,0,0.6)';
                ctx.beginPath(); ctx.moveTo(-28, -4 + i * 2.6 - 4); ctx.quadraticCurveTo(-28 - fl * 0.6, i * 2.6 - 4, -28 - fl, i * 2.6 - 4 + Math.sin(t * 30 + i) * 2); ctx.quadraticCurveTo(-28 - fl * 0.6, i * 2.6 - 3, -28, 0 + i * 2.6 - 3); ctx.fill(); ctx.restore();
            }
        }
        // ruedas
        for (const wx of [-22, 22]) {
            ctx.fillStyle = '#02050a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(wx - 11, -6.5, 22, 13, 6) : ctx.rect(wx - 11, -6.5, 22, 13); ctx.fill();
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(wx - 11, -6.5, 22, 13, 6) : ctx.rect(wx - 11, -6.5, 22, 13); G.stroke(ctx, color, 2.2, 1);
            ctx.beginPath(); ctx.moveTo(wx - 7, 0); ctx.lineTo(wx + 7, 0); G.stroke(ctx, '#ffffff', 1, 0.8);
        }
        // carrocería
        ctx.fillStyle = '#04080e';
        ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(18, -8); ctx.lineTo(-18, -7); ctx.lineTo(-26, -3); ctx.lineTo(-26, 3); ctx.lineTo(-18, 7); ctx.lineTo(18, 8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(18, -8); ctx.lineTo(-18, -7); ctx.lineTo(-26, -3); ctx.lineTo(-26, 3); ctx.lineTo(-18, 7); ctx.lineTo(18, 8); ctx.closePath(); G.stroke(ctx, color, 2.2, 1);
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-22, 0); G.stroke(ctx, '#ffffff', 1, 0.7);
        // piloto agachado
        ctx.fillStyle = '#05080e'; ctx.beginPath(); ctx.ellipse(-2, 0, 11, 6.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-2, 0, 11, 6.6, 0, 0, Math.PI * 2); G.stroke(ctx, color, 1.6, 0.95);
        ctx.save(); ctx.translate(7, 0); G.formPath(ctx, o.form && o.form !== 'human' ? o.form : 'circle', 5.2); ctx.fillStyle = '#05080e'; ctx.fill(); G.stroke(ctx, '#ffffff', 1.2, 0.9); ctx.restore();
        ctx.restore();
    };

    // muro de luz 2.5D detrás del ciclo. pts = [{x,y}] mundo; h = altura
    G.jetwall = (ctx, pts, cam, color, o = {}) => {
        if (pts.length < 2) return;
        const h = o.h || 22, n = pts.length;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // franjas con alfa creciente hacia la moto
        for (let i = 1; i < n; i++) {
            const a = pts[i - 1], b = pts[i];
            const ax = a.x - cam.ox, ay = a.y - cam.oy, bx = b.x - cam.ox, by = b.y - cam.oy;
            if (bx < -80 && ax < -80 || bx > cam.w + 80 && ax > cam.w + 80 || by < -120 && ay < -120 || by > cam.h + 80 && ay > cam.h + 80) continue;
            const k = i / n, sc = o.rainbow ? TG.hsl(((o.t || 0) * 90 + i * 14) % 360) : color;
            ctx.fillStyle = U.rgba(sc, 0.08 + 0.3 * k);
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx, by - h); ctx.lineTo(ax, ay - h); ctx.closePath(); ctx.fill();
        }
        // borde superior e inferior
        ctx.beginPath(); ctx.moveTo(pts[0].x - cam.ox, pts[0].y - cam.oy - h);
        for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x - cam.ox, pts[i].y - cam.oy - h);
        ctx.globalCompositeOperation = 'source-over';
        if (o.rainbow) { for (let i = 1; i < n; i++) { const c = TG.hsl(((o.t || 0) * 90 + i * 14) % 360); ctx.beginPath(); ctx.moveTo(pts[i - 1].x - cam.ox, pts[i - 1].y - cam.oy - h); ctx.lineTo(pts[i].x - cam.ox, pts[i].y - cam.oy - h); G.stroke(ctx, c, 2, 0.95); ctx.beginPath(); ctx.moveTo(pts[i - 1].x - cam.ox, pts[i - 1].y - cam.oy); ctx.lineTo(pts[i].x - cam.ox, pts[i].y - cam.oy); G.stroke(ctx, c, 1.3, 0.6); } }
        else { G.stroke(ctx, color, 2, 0.95);
        ctx.beginPath(); ctx.moveTo(pts[0].x - cam.ox, pts[0].y - cam.oy);
        for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x - cam.ox, pts[i].y - cam.oy);
        G.stroke(ctx, color, 1.4, 0.7); }
        ctx.restore();
    };

    // ========================================================== SOLAR SAILER
    G.sailer = (ctx, x, y, ang, color, t) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.save(); ctx.rotate(-ang); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(6, 26, 46, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        G.glow(ctx, -8, 0, 90, color, 0.22);
        const p = Math.sin(t * 2) * 5;
        for (const sd of [-1, 1]) {
            const g = ctx.createLinearGradient(0, 0, -64, sd * 54);
            g.addColorStop(0, U.rgba(color, 0.55)); g.addColorStop(1, U.rgba(color, 0));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(-18, sd * (36 + p), -66, sd * (54 + p)); ctx.lineTo(-52, sd * 6); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(-18, sd * (36 + p), -66, sd * (54 + p)); G.stroke(ctx, color, 2, 0.95);
            for (let k = 1; k < 4; k++) { const f = k / 4; ctx.beginPath(); ctx.moveTo(4 - 70 * f, sd * (6 + 48 * f)); ctx.lineTo(-46 * f - 4, sd * 2); G.stroke(ctx, color, 0.8, 0.45); }
        }
        ctx.fillStyle = '#04101a';
        ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(-20, -13); ctx.lineTo(-30, 0); ctx.lineTo(-20, 13); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(-20, -13); ctx.lineTo(-30, 0); ctx.lineTo(-20, 13); ctx.closePath(); G.stroke(ctx, color, 2.4, 1);
        ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-24, 0); G.stroke(ctx, '#fff', 1, 0.7);
        ctx.restore();
    };

    // ========================================================== RECOGNIZER
    // ambiental: dos patas, cabina con luces; (x,y)= centro bajo; s escala
    G.recognizer = (ctx, x, y, s, color, t, alpha = 0.9) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 4, 82, 12, 0, 0, Math.PI * 2); ctx.fill();
        for (const sd of [-1, 1]) {
            ctx.fillStyle = '#05080e'; ctx.beginPath(); ctx.moveTo(sd * 62, 0); ctx.lineTo(sd * 76, 0); ctx.lineTo(sd * 66, -92); ctx.lineTo(sd * 52, -92); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(sd * 62, 0); ctx.lineTo(sd * 52, -92); ctx.moveTo(sd * 76, 0); ctx.lineTo(sd * 66, -92); G.stroke(ctx, color, 1.4, 0.9);
        }
        ctx.fillStyle = '#04070c'; ctx.beginPath(); ctx.moveTo(-70, -92); ctx.lineTo(70, -92); ctx.lineTo(54, -128); ctx.lineTo(-54, -128); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-70, -92); ctx.lineTo(70, -92); ctx.lineTo(54, -128); ctx.lineTo(-54, -128); ctx.closePath(); G.stroke(ctx, color, 1.8, 1);
        ctx.beginPath(); ctx.moveTo(-40, -100); ctx.lineTo(40, -100); G.stroke(ctx, '#fff', 1.2, 0.7);
        const pulse = 0.6 + 0.4 * Math.sin(t * 3);
        G.glow(ctx, 0, -110, 40, color, 0.45 * pulse);
        ctx.restore();
    };

    // ===================================================== ENEMIGO (humanoide)
    G.enemy = (ctx, e, cam, t, th) => {
        const x = e.x - cam.ox, y = e.y - cam.oy;
        if (e.kind === 'dummy') {   // diana de entrenamiento: poste con blanco concéntrico
            const col = e.flash > 0 ? '#ffffff' : '#FFB347';
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, y + 12, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x, y - 34); G.stroke(ctx, '#6a7a8a', 3, 0.8);
            G.glow(ctx, x, y - 52, 52, col, 0.3);
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y - 52, 26 - i * 8, 26 - i * 8, 0, 0, Math.PI * 2); G.stroke(ctx, i === 1 ? '#fff' : col, 2, 0.95); }
            ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 52, 3, 0, Math.PI * 2); ctx.fill();
            if (e.hp < e.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x - 19, y - 92, 38, 5); ctx.fillStyle = col; ctx.fillRect(x - 18, y - 91, 36 * Math.max(0, e.hp / e.maxHp), 3); }
            return;
        }
        const f = Math.cos(e.angle) >= 0 ? 1 : -1;
        const flash = e.flash > 0;
        G.humanoid(ctx, x, y + 14, { c: flash ? '#ffffff' : e.color, a: flash ? '#fff' : (e.accent || '#ffffff'), f, ph: e.ph, moving: true, look: e.look || 'helmet', s: e.big ? 1.25 : 1, t, seed: e.id });
        if (e.hp < e.maxHp) {
            const w = 38, p = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x - w / 2, y - 52, w, 5);
            ctx.fillStyle = e.color; ctx.fillRect(x - w / 2 + 1, y - 51, (w - 2) * p, 3);
        }
        if (e.stun > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#9DFBFF'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); let px = x - 12, py = y - 24 + i * 7; ctx.moveTo(px, py); for (let k = 0; k < 4; k++) { px += 6; py += (Math.random() - 0.5) * 8; ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore(); }
    };

})(window.TG = window.TG || {});
