/* ==========================================================================
   TRON: LAS TRES GRIDS — gfx_world.js
   Suelo de cada era, mar de simulación, Outlands, caminos de luz,
   estructuras 2.5D por tipo de lugar, portales e interiores.
   ========================================================================== */
(function (TG) {
    'use strict';
    const U = TG.U, G = TG.G;

    Object.assign(G.THEME, {
        '2003': { bg: '#010a04', bg2: '#04200c', grid: '#2fbf4a', major: '#8dff7d', glow: '#7DFF6A', accent: '#FFD84A', danger: '#FF4D4D', sea: '#052a10', seaLine: '#5cff7d', text: '#e0ffe0', vignette: '0,12,4' },
        'arq': { bg: '#07040f', bg2: '#140a2a', grid: '#8a5cff', major: '#c4a8ff', glow: '#B58CFF', accent: '#35F0C8', danger: '#FF3D7F', sea: '#1a0a38', seaLine: '#8a5cff', text: '#f0e8ff', vignette: '8,2,16' },
        'r1982': { bg: '#0a0705', bg2: '#1c140e', grid: '#6a4a2a', major: '#FFB347', glow: '#FFB347', accent: '#FF5A3A', danger: '#FF4A1A', sea: '#1a1208', seaLine: '#FFB347', text: '#fff0d8', vignette: '20,10,0' },
        'r2010': { bg: '#05080c', bg2: '#0e1822', grid: '#3c5a78', major: '#9FD8FF', glow: '#9FD8FF', accent: '#FF9A1F', danger: '#FF7A00', sea: '#06141f', seaLine: '#9FD8FF', text: '#eaf6ff', vignette: '0,6,14' },
        'r2025': { bg: '#08040a', bg2: '#180a1c', grid: '#6a2a4a', major: '#FF5C7C', glow: '#FF5C7C', accent: '#4DB8FF', danger: '#FF1744', sea: '#1a0610', seaLine: '#FF5C7C', text: '#ffe8ee', vignette: '12,0,8' }
    });
    // color según facción
    G.facColor = (loc, th, era) => {
        const f = loc.fac || 'neutral';
        if (!['1982', '2010', '2025'].includes(era)) return f === 'ally' ? th.glow : f === 'enemy' ? th.danger : U.mix(th.glow, '#ffffff', 0.45);
        if (era === '2025') return f === 'ally' ? '#2EA8FF' : f === 'enemy' ? '#FF1744' : '#FFA8B8';
        if (era === '1982') return f === 'ally' ? '#00D4FF' : f === 'enemy' ? '#FF5A1A' : '#9FEFFF';
        return f === 'ally' ? '#19F0FF' : f === 'enemy' ? '#FF8A1F' : '#C9FFFF';
    };

    G.clu = 0;   // presencia de Clu en la Grid de 2010 (0 al inicio, 1 tras la traición)
    const KH = { rwtower: 260, block: 120, shop: 50, house: 50, startline: 90, tankarena: 70, cave: 60, tower: 190, spire: 230, club: 240, city: 150, cone: 200, office: 78, lab: 70, prison: 64, garage: 56, arcade: 72, outpost: 60, safehouse: 54, hall: 70, armory: 74, facility: 90, hangar: 86, server: 96, core: 130, factory: 110, chamber: 70, arena: 56, ring: 42, cycle_arena: 28, coliseum: 78 };

    // ---------------------------------------------------------------- caminos (MST)
    G.prepareGrid = (grid) => {
        if (grid._roads) return;
        const locs = TG.LOCATIONS[grid.era].filter(l => !l.hidden);
        const portals = (TG.PORTALS[grid.era] || []).map(p => ({ x: p.x, y: p.y, id: 'p' }));
        const nodes = locs.concat(portals);
        const inT = [0], edges = [];
        const done = new Set([0]);
        while (done.size < nodes.length) {
            let best = null;
            for (const i of done) for (let j = 0; j < nodes.length; j++) {
                if (done.has(j)) continue;
                const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if (!best || d < best.d) best = { i, j, d };
            }
            if (!best) break;
            done.add(best.j); edges.push(best);
        }
        grid._roads = edges.map((e, k) => {
            const a = nodes[e.i], b = nodes[e.j];
            const hFirst = U.hash2(k, 7) > 0.5;
            const mid = hFirst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
            const pts = [{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }];
            const len = Math.abs(mid.x - a.x) + Math.abs(mid.y - a.y) + Math.abs(b.x - mid.x) + Math.abs(b.y - mid.y);
            return { pts, len, seed: U.hash2(k, 3) };
        });
    };

    const alongRoad = (road, d) => {
        let rem = d;
        for (let i = 1; i < road.pts.length; i++) {
            const a = road.pts[i - 1], b = road.pts[i], l = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
            if (rem <= l) { const f = l ? rem / l : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
            rem -= l;
        }
        const e = road.pts[road.pts.length - 1]; return { x: e.x, y: e.y };
    };

    G.alongRoad = alongRoad;
    // ---------------------------------------------------------------- SUELO
    G.drawFloor = (ctx, grid, cam, t) => {
        if (grid.rw) return G.drawCityFloor(ctx, grid, cam, t);
        const th = G.THEME[grid.era], era = grid.era, W = cam.w, H = cam.h, ox = cam.ox, oy = cam.oy;
        G.prepareGrid(grid);
        const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.85);
        bg.addColorStop(0, th.bg2); bg.addColorStop(1, th.bg);
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // ---- capa profunda con paralaje (da sensación de suelo de cristal)
        if (era === '2010') {
            const cs = 380, px = ox * 0.55, py = oy * 0.55;
            for (let cx = Math.floor(px / cs) - 1; cx <= (px + W) / cs; cx++) for (let cy = Math.floor(py / cs) - 1; cy <= (py + H) / cs; cy++) {
                const h = U.hash2(cx, cy); if (h < 0.5) continue;
                const w = 110 + h * 200, hh = 100 + U.hash2(cy, cx) * 220, x = cx * cs + 40 - px, y = cy * cs + 30 - py;
                ctx.fillStyle = 'rgba(2,28,42,0.42)'; ctx.fillRect(x, y, w, hh);
                ctx.strokeStyle = U.rgba(th.grid, 0.16); ctx.lineWidth = 1; ctx.strokeRect(x, y, w, hh);
                ctx.fillStyle = U.rgba(th.glow, 0.05 + 0.05 * Math.sin(t * 1.2 + h * 20)); ctx.fillRect(x, y, w, 3);
            }
        } else if (era === '2025') {
            const R = 64, px = ox * 0.7, py = oy * 0.7, hw = R * 1.5, hh = R * Math.sqrt(3);
            ctx.lineWidth = 1;
            for (let cx = Math.floor(px / hw) - 1; cx <= (px + W) / hw + 1; cx++) for (let cy = Math.floor(py / hh) - 1; cy <= (py + H) / hh + 1; cy++) {
                const h = U.hash2(cx, cy); if (h < 0.55) continue;
                const x = cx * hw - px, y = cy * hh + (cx & 1 ? hh / 2 : 0) - py;
                const pulse = 0.04 + 0.1 * Math.max(0, Math.sin(t * 1.4 + h * 30));
                ctx.strokeStyle = U.rgba(th.grid, 0.1 + pulse); ctx.fillStyle = U.rgba(th.grid, pulse * 0.7);
                G.path(ctx, G.ngon(x, y, R * 0.92, R * 0.92, 6, 0)); ctx.fill(); ctx.stroke();
            }
        } else {
            const cs = 200, px = ox * 0.7, py = oy * 0.7;
            ctx.strokeStyle = U.rgba(th.grid, 0.3); ctx.lineWidth = 1;
            for (let cx = Math.floor(px / cs); cx <= (px + W) / cs; cx++) for (let cy = Math.floor(py / cs); cy <= (py + H) / cs; cy++) {
                if (U.hash2(cx, cy) < 0.62) continue; const x = cx * cs - px + 100, y = cy * cs - py + 100;
                ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
            }
        }

        // ---- cuadrícula principal
        const gs = era === '1982' ? 100 : era === '2010' ? 90 : 80;
        const x0 = Math.floor(ox / gs), x1 = Math.ceil((ox + W) / gs), y0 = Math.floor(oy / gs), y1 = Math.ceil((oy + H) / gs);
        ctx.lineWidth = 1; ctx.strokeStyle = U.rgba(th.grid, era === '1982' ? 0.2 : 0.14);
        ctx.beginPath();
        for (let i = x0; i <= x1; i++) { if (i % 5 === 0) continue; const x = Math.round(i * gs - ox) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let j = y0; j <= y1; j++) { if (j % 5 === 0) continue; const y = Math.round(j * gs - oy) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();
        ctx.beginPath();
        for (let i = x0; i <= x1; i++) { if (i % 5) continue; const x = Math.round(i * gs - ox) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let j = y0; j <= y1; j++) { if (j % 5) continue; const y = Math.round(j * gs - oy) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
        G.stroke(ctx, th.major, 1.1, era === '1982' ? 0.55 : 0.4);
        if (era === '2010' && G.clu > 0.1) {
            ctx.beginPath(); for (let i = x0; i <= x1; i++) { if (i % 3 || U.hash2(i, 41) > 0.1 + G.clu * 0.7) continue; const x = Math.round(i * gs - ox) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
            for (let j = y0; j <= y1; j++) { if (j % 3 || U.hash2(j, 43) > 0.1 + G.clu * 0.7) continue; const y = Math.round(j * gs - oy) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); } G.stroke(ctx, '#FF8A1F', 1.7, 0.22 + 0.5 * G.clu);
        }
        // destellos en las intersecciones mayores
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
            if (i % 5 || j % 5) continue;
            const a = 0.5 + 0.4 * Math.sin(t * 2 + i * 1.7 + j * 2.3);
            G.glow(ctx, i * gs - ox, j * gs - oy, 26, th.major, 0.22 * a);
            ctx.fillStyle = U.rgba(th.major, 0.9); ctx.fillRect(i * gs - ox - 2, j * gs - oy - 2, 4, 4);
        }
        // pulsos de datos que recorren las líneas mayores
        for (let i = x0; i <= x1; i++) {
            if (i % 5 || U.hash2(i, 11) < 0.35) continue;
            const L = grid.h, sp = 220 + U.hash2(i, 5) * 160, dir = U.hash2(i, 9) > 0.5 ? 1 : -1;
            const p = (((t * sp * dir + U.hash2(i, 2) * 9000) % L) + L) % L - oy;
            const x = i * gs - ox; const g = ctx.createLinearGradient(x, p - 70 * dir, x, p);
            g.addColorStop(0, U.rgba(th.major, 0)); g.addColorStop(1, U.rgba(th.major, 0.95));
            ctx.fillStyle = g; ctx.fillRect(x - 1.2, Math.min(p, p - 70 * dir), 2.4, 70);
        }
        for (let j = y0; j <= y1; j++) {
            if (j % 5 || U.hash2(j, 31) < 0.35) continue;
            const L = grid.w, sp = 220 + U.hash2(j, 15) * 160, dir = U.hash2(j, 19) > 0.5 ? 1 : -1;
            const p = (((t * sp * dir + U.hash2(j, 12) * 9000) % L) + L) % L - ox;
            const y = j * gs - oy; const g = ctx.createLinearGradient(p - 70 * dir, y, p, y);
            g.addColorStop(0, U.rgba(th.major, 0)); g.addColorStop(1, U.rgba(th.major, 0.95));
            ctx.fillStyle = g; ctx.fillRect(Math.min(p, p - 70 * dir), y - 1.2, 70, 2.4);
        }
        ctx.restore();

        // ---- regiones
        for (const r of grid.regions) {
            const rx0 = r.rect[0] - ox, ry0 = r.rect[1] - oy, rx1 = r.rect[2] - ox, ry1 = r.rect[3] - oy;
            if (rx1 < 0 || ry1 < 0 || rx0 > W || ry0 > H) continue;
            ctx.save(); ctx.beginPath(); ctx.rect(rx0, ry0, rx1 - rx0, ry1 - ry0); ctx.clip();
            if (r.type === 'sea') G.drawSea(ctx, th, rx0, ry0, rx1, ry1, ox, oy, t);
            else G.drawOutlands(ctx, th, grid, rx0, ry0, rx1, ry1, ox, oy, t);
            ctx.restore();
        }

        // ---- caminos de luz
        ctx.save(); ctx.lineJoin = 'round';
        for (const rd of grid._roads) {
            ctx.beginPath(); ctx.moveTo(rd.pts[0].x - ox, rd.pts[0].y - oy);
            for (let i = 1; i < rd.pts.length; i++) ctx.lineTo(rd.pts[i].x - ox, rd.pts[i].y - oy);
            ctx.strokeStyle = U.rgba(th.glow, 0.045); ctx.lineWidth = 34; ctx.stroke();
            ctx.strokeStyle = U.rgba(th.glow, 0.28); ctx.lineWidth = 1.2; ctx.stroke();
            const nPackets = 2 + Math.floor(rd.seed * 3);
            ctx.globalCompositeOperation = 'lighter';
            for (let k = 0; k < nPackets; k++) {
                const d = (((t * (60 + rd.seed * 40) + k * rd.len / nPackets) % rd.len) + rd.len) % rd.len;
                const p = alongRoad(rd, d), sx = p.x - ox, sy = p.y - oy;
                if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
                G.glow(ctx, sx, sy, 14, th.major, 0.6); ctx.fillStyle = '#fff'; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
            }
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
    };


    // ---------------------------------------------------------------- MUNDO REAL (calles, manzanas, farolas)
    G.drawCityFloor = (ctx, grid, cam, t) => {
        const th = G.THEME[grid.era], style = grid.style, W = cam.w, H = cam.h, ox = cam.ox, oy = cam.oy, BS = 520, ST = 160;
        const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.8); bg.addColorStop(0, th.bg2); bg.addColorStop(1, th.bg); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const bx0 = Math.floor(ox / BS) - 1, bx1 = Math.ceil((ox + W) / BS), by0 = Math.floor(oy / BS) - 1, by1 = Math.ceil((oy + H) / BS);
        ctx.save(); ctx.strokeStyle = style === '1982' ? 'rgba(255,200,120,.35)' : 'rgba(220,235,255,.3)'; ctx.lineWidth = 3; ctx.setLineDash([34, 28]); ctx.beginPath();
        for (let bx = bx0; bx <= bx1; bx++) { const x = bx * BS - ox; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let by = by0; by <= by1; by++) { const y = by * BS - oy; ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke(); ctx.restore();
        for (let bx = bx0; bx <= bx1; bx++) for (let by = by0; by <= by1; by++) {
            const x0 = bx * BS + ST / 2 - ox, y0 = by * BS + ST / 2 - oy, w = BS - ST, h = BS - ST;
            ctx.fillStyle = U.mix(th.bg2, '#ffffff', 0.07); ctx.fillRect(x0 - 12, y0 - 12, w + 24, h + 24); ctx.fillStyle = th.bg; ctx.fillRect(x0, y0, w, h);
            const seed = U.hash2(bx, by + 40);
            for (let i = 0; i < 4; i++) {
                const hh = U.hash2(bx * 7 + i, by * 3 + 9), ax = x0 + (i % 2) * w / 2 + 14, ay = y0 + Math.floor(i / 2) * h / 2 + 14, bw = w / 2 - 28, bh = h / 2 - 28;
                const hgt = 30 + hh * 90, vx = (ax + bw / 2 - W / 2) * 0.0004 * hgt, vy = -hgt * 0.8 + (ay + bh / 2 - H / 2) * 0.0004 * hgt;
                if (ax > W + 100 || ay > H + 100 || ax + bw < -100 || ay + bh < -200) continue;
                G.extrude(ctx, [[ax, ay], [ax + bw, ay], [ax + bw, ay + bh], [ax, ay + bh]], vx, vy, { side: U.mix('#05080c', th.glow, 0.05), lit: U.mix('#05080c', th.glow, 0.26), roof: U.mix('#06090e', th.glow, 0.08), edge: U.mix(th.glow, '#000', 0.5), bands: 2, edgeW: 1 });
                ctx.fillStyle = U.rgba(th.accent, 0.35); for (let k = 0; k < 6; k++) if (U.hash2(bx + k, by + i) > 0.5) ctx.fillRect(ax + vx + 10 + k * 18, ay + vy + 10, 8, 5);
                if (seed > 0.55 && i === 1) { ctx.fillStyle = U.rgba(th.accent, 0.8); ctx.fillRect(ax + vx + 8, ay + vy + bh - 12, bw * 0.5, 4); }
            }
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let bx = bx0; bx <= bx1; bx++) for (let by = by0; by <= by1; by++) {
            const cx = bx * BS - ox, cy = by * BS - oy;
            ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let k = -3; k <= 3; k++) { ctx.fillRect(cx + k * 14 - 3, cy - ST / 2 - 4, 6, 18); ctx.fillRect(cx - ST / 2 - 4, cy + k * 14 - 3, 18, 6); }
            const flick = style === '1982' ? 1 : 0.8 + 0.2 * Math.sin(t * 3 + bx + by);
            G.glow(ctx, cx + ST / 2, cy + ST / 2, 70, th.major, 0.18 * flick); ctx.fillStyle = U.rgba('#ffffff', 0.9); ctx.fillRect(cx + ST / 2 - 2, cy + ST / 2 - 2, 4, 4);
        }
        ctx.restore();
    };

    // ---- Mar de Simulación
    G.drawSea = (ctx, th, x0, y0, x1, y1, ox, oy, t) => {
        const g = ctx.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, U.rgba(th.sea, 0.9)); g.addColorStop(1, U.rgba(th.sea, 1));
        ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        const gap = 22, W = x1 - x0;
        for (let wy = Math.floor((y0 + oy) / gap) * gap; wy < y1 + oy + gap; wy += gap) {
            const yy = wy - oy, ph = wy * 0.05 + t * 1.6;
            ctx.beginPath();
            for (let xx = Math.max(x0, 0); xx <= Math.min(x1, x0 + 2000, ctx.canvas.width); xx += 20) {
                const yv = yy + Math.sin(xx * 0.012 + ph) * 4 + Math.sin(xx * 0.03 - ph * 1.3) * 2;
                if (xx === Math.max(x0, 0)) ctx.moveTo(xx, yv); else ctx.lineTo(xx, yv);
            }
            const k = 0.12 + 0.12 * Math.sin(wy * 0.02 + t);
            ctx.strokeStyle = U.rgba(th.seaLine, k); ctx.lineWidth = 1; ctx.stroke();
        }
        // orilla luminosa
        if (x0 > -40) {
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); G.stroke(ctx, th.seaLine, 2, 0.85);
            const gg = ctx.createLinearGradient(x0, 0, x0 + 90, 0); gg.addColorStop(0, U.rgba(th.seaLine, 0.22)); gg.addColorStop(1, U.rgba(th.seaLine, 0));
            ctx.fillStyle = gg; ctx.fillRect(x0, y0, 90, y1 - y0);
        }
        // glifos que ascienden del mar
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = U.rgba(th.seaLine, 0.6);
        for (let i = 0; i < 26; i++) {
            const bx = x0 + 40 + (U.hash2(i, 1) * Math.max(10, W - 80)), by = ((U.hash2(i, 2) * 3000 - t * (14 + U.hash2(i, 3) * 20)) % 1400 + 1400) % 1400 - 200 + (y0 > 0 ? y0 : 0);
            ctx.fillRect(bx, by, 3, 3);
        }
        ctx.restore();
    };

    // ---- Outlands (terreno rocoso sin cuadrícula)
    G.drawOutlands = (ctx, th, grid, x0, y0, x1, y1, ox, oy, t) => {
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, 'rgba(10,8,18,0.0)'); g.addColorStop(0.06, 'rgba(10,8,18,0.93)'); g.addColorStop(1, 'rgba(14,9,20,0.98)');
        ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        const cs = 170;
        for (let cx = Math.floor((ox + x0) / cs) - 1; cx <= (ox + x1) / cs + 1; cx++) for (let cy = Math.floor((oy + y0) / cs) - 1; cy <= (oy + y1) / cs + 1; cy++) {
            const h = U.hash2(cx, cy + 90); if (h < 0.48) continue;
            const px = cx * cs - ox + U.hash2(cx, cy) * 100, py = cy * cs - oy + U.hash2(cy, cx) * 100, rr = 14 + h * 40;
            const pts = G.ngon(px, py, rr, rr * 0.7, 5 + Math.floor(h * 3), h * 6);
            ctx.fillStyle = 'rgba(30,18,44,0.8)'; G.path(ctx, pts); ctx.fill();
            ctx.strokeStyle = U.rgba('#9a6bff', 0.28); ctx.lineWidth = 1; G.path(ctx, pts); ctx.stroke();
            ctx.fillStyle = U.rgba('#d4b8ff', 0.1); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(px, py - rr * 0.1); ctx.fill();
        }
        // frontera luminosa
        if (y0 > -40) { ctx.beginPath(); ctx.moveTo(x0, y0 + 2); ctx.lineTo(x1, y0 + 2); G.stroke(ctx, '#b08cff', 1.6, 0.65); }
        // bruma
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const bx = ((i * 640 - ox * 0.3 + t * 8) % (x1 - x0 + 600)) - 300 + x0, by = y0 + 200 + i * 180; G.glow(ctx, bx, Math.max(by, 80), 220, '#6a3fd6', 0.05); }
        ctx.restore();
    };

    // ------------------------------------------------------------ BASE (nivel del suelo)
    G.drawLocationBase = (ctx, loc, grid, cam, t, known) => {
        const th = G.THEME[grid.era], col = G.facColor(loc, th, grid.era);
        const x = loc.x - cam.ox, y = loc.y - cam.oy, r = loc.r;
        if (loc.kind === 'region' || loc.kind === 'highway' || loc.kind === 'sea') return;
        if (loc.hidden && !known) return;
        const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.55);
        g.addColorStop(0, U.rgba(col, 0.12)); g.addColorStop(0.7, U.rgba(col, 0.05)); g.addColorStop(1, U.rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.55, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.lineWidth = 1.4;
        ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 18;
        ctx.beginPath(); ctx.ellipse(x, y + 4, r * 1.22, r * 1.22 * 0.82, 0, 0, Math.PI * 2); ctx.strokeStyle = U.rgba(col, 0.45); ctx.stroke();
        ctx.setLineDash([3, 9]); ctx.lineDashOffset = t * 22;
        ctx.beginPath(); ctx.ellipse(x, y + 4, r * 1.4, r * 1.4 * 0.82, 0, 0, Math.PI * 2); ctx.strokeStyle = U.rgba(col, 0.25); ctx.stroke();
        ctx.restore();
    };

    // ------------------------------------------------------------ ESTRUCTURAS
    const rectPts = (cx, cy, w, d) => [[cx - w / 2, cy - d / 2], [cx + w / 2, cy - d / 2], [cx + w / 2, cy + d / 2], [cx - w / 2, cy + d / 2]];

    G.drawStructure = (ctx, loc, grid, cam, t, known) => {
        const th = G.THEME[grid.era], col = G.facColor(loc, th, grid.era);
        const x = loc.x - cam.ox, y = loc.y - cam.oy, r = loc.r;
        const kind = loc.kind;
        const dark = '#02060b';
        const S = {
            ctx, x, y, r, t, col, th, cam, loc, era: grid.era, rng: U.rng(U.strSeed(loc.id)),
            side: U.mix(dark, col, 0.1), lit: U.mix(dark, col, 0.5), roof: U.mix(dark, col, 0.17), edge: col,
            vec(h) { return [(x - cam.w / 2) * 0.00042 * h, -h * 0.82 + (y - cam.h / 2) * 0.00042 * h]; },
            vecAt(px, py, h) { return [(px - cam.w / 2) * 0.00042 * h, -h * 0.82 + (py - cam.h / 2) * 0.00042 * h]; },
            // prisma entre alturas h0 y h1 con base en (cx,cy)
            prism(cx, cy, rx, ry, n, rot, h0, h1, o = {}) {
                const pts = n === 4 && o.rect ? rectPts(cx, cy, rx * 2, ry * 2) : G.ngon(cx, cy, rx, ry, n, rot);
                const a = this.vecAt(cx, cy, h0), b = this.vecAt(cx, cy, h1);
                const base = pts.map(p => [p[0] + a[0], p[1] + a[1]]);
                return G.extrude(ctx, base, b[0] - a[0], b[1] - a[1], Object.assign({ side: this.side, lit: this.lit, roof: this.roof, edge: this.edge }, o));
            },
            roofC(h, cx = x, cy = y) { const v = this.vecAt(cx, cy, h); return [cx + v[0], cy + v[1]]; },
            beam(h, w = 5, len = 500, c = col, a = 0.5, cx = x, cy = y) {
                const p = this.roofC(h, cx, cy);
                ctx.save(); ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createLinearGradient(0, p[1], 0, p[1] - len);
                g.addColorStop(0, U.rgba(c, a)); g.addColorStop(1, U.rgba(c, 0));
                ctx.fillStyle = g; ctx.fillRect(p[0] - w / 2, p[1] - len, w, len);
                G.glow(ctx, p[0], p[1], 30, c, 0.6); ctx.restore();
            },
            sign() { /* los rótulos de nombre los dibuja G.drawLabel */ }
        };
        const fn = DRAW[kind] || DRAW.building;
        // sombra proyectada
        if (!['pit', 'highway', 'pad', 'dock', 'scrap', 'secret', 'region', 'sea', 'plaza', 'tunnel'].includes(kind)) {
            ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(x + r * 0.18, y + r * 0.22, r * 0.95, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (loc.hidden && !known) { DRAW.hidden(S); return; }
        fn(S);
        if (grid.era === '2010' && G.clu > 0.12 && ['tower', 'city', 'club', 'armory', 'arena', 'coliseum', 'cone', 'carrier', 'ship', 'hall', 'cycle_arena', 'factory'].includes(kind) && (U.hash2(loc.x | 0, loc.y | 0) < 0.25 + G.clu * 0.75)) {   // estandartes de Clu
            const hgt = Math.min(KH[kind] || 90, 150), bx = x + r * 0.55, by = y - hgt * 0.3, fl = Math.sin(t * 2 + x) * 2;
            ctx.save(); ctx.fillStyle = U.rgba('#FF7A00', 0.55 + 0.35 * G.clu); ctx.beginPath(); ctx.moveTo(bx, by - 46); ctx.lineTo(bx + 20 + fl, by - 42); ctx.lineTo(bx + 20 + fl, by + 18); ctx.lineTo(bx + 10, by + 8); ctx.lineTo(bx, by + 18); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(bx, by - 46); ctx.lineTo(bx, by + 56); G.stroke(ctx, '#FFB347', 1.6, 0.9); ctx.font = 'bold 13px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#1a0800'; ctx.fillText('◆', bx + 10 + fl * 0.5, by - 16);
            if (G.clu > 0.6) G.glow(ctx, bx + 10, by - 10, 46, '#FF7A00', 0.3); ctx.restore();
        }
    };

    const DRAW = {};
    // ---- torres / monolitos
    DRAW.tower = (S) => {
        const { r } = S, tiers = [[0.6, 0, 70], [0.46, 70, 140], [0.3, 140, 200]];
        for (const [k, h0, h1] of tiers) S.prism(S.x, S.y, r * k, r * k * 0.8, 8, Math.PI / 8, h0, h1, { bands: 3 });
        S.beam(200, 6, 600); S.sign(S.loc.name.length > 22 ? '' : S.loc.name.toUpperCase(), 204);
    };
    DRAW.spire = DRAW.tower;
    DRAW.club = (S) => {
        const { r, ctx, col, t } = S;
        S.prism(S.x, S.y, r * 0.55, r * 0.55 * 0.82, 8, Math.PI / 8, 0, 240, { bands: 6 });
        for (let k = 1; k <= 3; k++) { const h = 50 * k + 20; const pts = G.ngon(S.x, S.y, r * 0.56, r * 0.46, 16, 0); const v = S.vec(h); G.path(ctx, pts.map(p => [p[0] + v[0], p[1] + v[1]])); G.stroke(ctx, col, 1.6, 0.8 + 0.2 * Math.sin(t * 4 + k)); }
        const p = S.roofC(240); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { const a = t * 1.3 + i * 2.1; const g = ctx.createLinearGradient(p[0], p[1], p[0] + Math.cos(a) * 200, p[1] - 260); g.addColorStop(0, U.rgba(col, 0.5)); g.addColorStop(1, U.rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p[0] - 3, p[1]); ctx.lineTo(p[0] + 3, p[1]); ctx.lineTo(p[0] + Math.cos(a) * 200 + 24, p[1] - 260); ctx.lineTo(p[0] + Math.cos(a) * 200 - 24, p[1] - 260); ctx.fill(); }
        ctx.restore();
    };
    DRAW.cone = (S) => {
        const { r, ctx, t } = S, tiers = [[0.85, 0, 50], [0.65, 50, 100], [0.46, 100, 150], [0.28, 150, 200]];
        for (const [k, h0, h1] of tiers) S.prism(S.x, S.y, r * k, r * k * 0.8, 12, 0, h0, h1, { bands: 2 });
        const p = S.roofC(215); G.glow(ctx, p[0], p[1], 60, '#FF2A00', 0.5 + 0.2 * Math.sin(t * 3));
        ctx.beginPath(); ctx.arc(p[0], p[1], 16, 0, Math.PI * 2); G.stroke(ctx, '#FF2A00', 2, 1);
        ctx.beginPath(); ctx.arc(p[0], p[1], 8 + Math.sin(t * 4) * 2, 0, Math.PI * 2); G.stroke(ctx, '#FFD000', 1.5, 1);
        S.beam(200, 4, 500, '#FF2A00', 0.55);
    };
    // ---- ciudades
    DRAW.city = (S) => {
        const { r, rng } = S, n = 11;
        const bs = [];
        for (let i = 0; i < n; i++) { const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * r * 0.85; bs.push({ x: S.x + Math.cos(a) * d, y: S.y + Math.sin(a) * d * 0.8, w: 16 + rng() * 26, h: 50 + rng() * 140 }); }
        bs.sort((a, b) => a.y - b.y);
        for (const b of bs) S.prism(b.x, b.y, b.w, b.w * 0.85, 4, Math.PI / 4, 0, b.h, { bands: 2, rect: false });
        S.beam(190, 4, 420, S.col, 0.4, S.x, S.y - r * 0.2);
    };
    // ---- arenas
    DRAW.arena = (S) => {
        const { r, ctx, col, t } = S, H = S.loc.kind === 'coliseum' ? 78 : 56;
        const outer = S.prism(S.x, S.y, r * 0.96, r * 0.78, 28, 0, 0, H, { bands: 1 });
        const v = S.vec(H);
        const inner = G.ngon(S.x + v[0], S.y + v[1], r * 0.66, r * 0.52, 28, 0);
        ctx.fillStyle = '#01070b'; G.path(ctx, inner); ctx.fill();
        for (let k = 0; k < 4; k++) { const rr = 0.66 - k * 0.15; ctx.beginPath(); ctx.ellipse(S.x + v[0], S.y + v[1], r * rr, r * rr * 0.79, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.2, 0.35 + 0.4 * Math.max(0, Math.sin(t * 2 - k))); }
        G.path(ctx, inner); G.stroke(ctx, col, 1.8, 0.9);
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t * 0.2; const px = S.x + v[0] + Math.cos(a) * r * 0.95, py = S.y + v[1] + Math.sin(a) * r * 0.76; S.beam(0, 2, 70, col, 0.6, px - v[0], py - v[1]); }
        S.sign(S.loc.arena === 'both' ? 'ARENA' : 'DISCOS', H + 8);
    };
    DRAW.coliseum = DRAW.arena;
    DRAW.ring = (S) => {
        const { r, ctx, col, t } = S, tiers = [[1, 0, 14], [0.72, 14, 30], [0.46, 30, 48]];
        for (const [k, h0, h1] of tiers) S.prism(S.x, S.y, r * k, r * k * 0.8, 24, 0, h0, h1, { bands: 0 });
        const p = S.roofC(48);
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(p[0], p[1], r * (0.12 + ((t * 0.6 + i / 3) % 1) * 0.4), r * (0.12 + ((t * 0.6 + i / 3) % 1) * 0.4) * 0.8, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.4, 0.8 * (1 - ((t * 0.6 + i / 3) % 1))); }
        S.beam(48, 3, 160, col, 0.6);
    };
    DRAW.cycle_arena = (S) => {
        const { r, ctx, col, t } = S;
        S.prism(S.x, S.y, r * 0.95, r * 0.95 * 0.78, 4, Math.PI / 4, 0, 30, { rect: true, bands: 1 });
        const v = S.vec(30), cx = S.x + v[0], cy = S.y + v[1], w = r * 0.95, h = r * 0.95 * 0.78;
        ctx.fillStyle = '#01080c'; ctx.fillRect(cx - w * 0.92, cy - h * 0.92, w * 1.84, h * 1.84);
        ctx.strokeStyle = U.rgba(col, 0.3); ctx.lineWidth = 1; ctx.beginPath();
        for (let i = -3; i <= 3; i++) { ctx.moveTo(cx + i * w * 0.3, cy - h * 0.92); ctx.lineTo(cx + i * w * 0.3, cy + h * 0.92); ctx.moveTo(cx - w * 0.92, cy + i * h * 0.3); ctx.lineTo(cx + w * 0.92, cy + i * h * 0.3); }
        ctx.stroke();
        // dos estelas de ciclos recorriendo el perímetro
        const per = [[cx - w * 0.8, cy - h * 0.8], [cx + w * 0.8, cy - h * 0.8], [cx + w * 0.8, cy + h * 0.8], [cx - w * 0.8, cy + h * 0.8]];
        const run = (off, c) => { const s = ((t * 0.18 + off) % 1) * 4; for (let k = 0; k < 40; k++) { const u = s - k * 0.012; const i0 = Math.floor(((u % 4) + 4) % 4), f = (((u % 4) + 4) % 4) - i0; const a = per[i0], b = per[(i0 + 1) % 4]; const px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f; ctx.fillStyle = U.rgba(c, 1 - k / 40); ctx.fillRect(px - 1.5, py - 1.5, 3, 3); } };
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; run(0, col); run(0.5, S.th.accent); ctx.restore();
        S.sign('CICLOS', 38);
    };
    // ---- edificios genéricos (con puerta y detalle de tejado)
    const BLD = {
        arcade: [1.5, 1.1, 74, 'sign'], lab: [1.4, 1.1, 70, 'dish'], office: [1.4, 1.0, 82, 'vent'], prison: [1.5, 1.1, 66, 'bars'], garage: [1.7, 1.1, 56, 'door'],
        outpost: [1.3, 1.0, 58, 'chim'], safehouse: [1.2, 0.9, 54, 'chim'], hall: [1.5, 1.1, 70, 'vent'], armory: [1.5, 1.1, 76, 'dish'], facility: [1.6, 1.2, 92, 'vent'],
        hangar: [1.9, 1.3, 88, 'door'], server: [1.2, 1.0, 98, 'rack'], core: [1.0, 1.0, 120, 'core'], factory: [1.7, 1.2, 112, 'chim'], chamber: [1.4, 1.1, 72, 'dish'],
        alley: [1.5, 0.9, 62, 'sign'], maze: [1.7, 1.3, 40, 'bars']
    };
    DRAW.building = (S) => {
        const { r, ctx, col, t, loc } = S, spec = BLD[loc.kind] || [1.4, 1.1, 66, 'vent'];
        const w = r * spec[0] * 0.5, d = r * spec[1] * 0.5, H = spec[2];
        S.prism(S.x, S.y, w, d, 4, 0, 0, H, { rect: true, bands: 2 });
        // puerta brillante en la cara sur
        const a = S.vec(0), b = S.vec(H), x0 = S.x - w * 0.22, x1 = S.x + w * 0.22, y1 = S.y + d;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gd = ctx.createLinearGradient(0, y1, 0, y1 + b[1] * 0.5);
        gd.addColorStop(0, U.rgba(col, 0.9)); gd.addColorStop(1, U.rgba(col, 0.15));
        ctx.fillStyle = gd; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1 + b[0] * 0.5, y1 + b[1] * 0.5); ctx.lineTo(x0 + b[0] * 0.5, y1 + b[1] * 0.5); ctx.closePath(); ctx.fill(); ctx.restore();
        const rc = S.roofC(H);
        switch (spec[3]) {
            case 'sign': S.sign(loc.name.replace(/\(.*\)/, '').toUpperCase().slice(0, 18), H + 6); break;
            case 'dish': ctx.beginPath(); ctx.ellipse(rc[0], rc[1] - 6, 12, 5, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.6, 1); ctx.beginPath(); ctx.moveTo(rc[0], rc[1] - 6); ctx.lineTo(rc[0], rc[1] - 28); G.stroke(ctx, col, 1.4, 1); G.glow(ctx, rc[0], rc[1] - 28, 14, col, 0.7); break;
            case 'chim': ctx.fillStyle = '#05090e'; ctx.fillRect(rc[0] - 14, rc[1] - 30, 10, 28); ctx.strokeStyle = col; ctx.strokeRect(rc[0] - 14, rc[1] - 30, 10, 28); G.glow(ctx, rc[0] - 9, rc[1] - 32, 20, S.th.accent, 0.5 + 0.2 * Math.sin(t * 5)); break;
            case 'rack': for (let i = 0; i < 4; i++) { ctx.fillStyle = U.rgba(col, 0.3 + 0.5 * Math.max(0, Math.sin(t * 5 + i * 2))); ctx.fillRect(rc[0] - 10 + i * 6, rc[1] - 10, 3, 3); } S.beam(H, 3, 220, col, 0.5); break;
            case 'core': S.beam(H, 8, 520, col, 0.6); ctx.beginPath(); ctx.arc(rc[0], rc[1], 14 + Math.sin(t * 3) * 2, 0, Math.PI * 2); G.stroke(ctx, col, 1.8, 1); break;
            case 'bars': ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(rc[0] + i * 10, rc[1] - 8); ctx.lineTo(rc[0] + i * 10, rc[1] + 4); } G.stroke(ctx, col, 1.2, 0.8); break;
            case 'door': ctx.beginPath(); ctx.moveTo(rc[0] - 22, rc[1]); ctx.lineTo(rc[0] + 22, rc[1]); G.stroke(ctx, col, 2, 0.9); break;
            default: ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(rc[0] - 18 + i * 14, rc[1] - 4); ctx.lineTo(rc[0] - 12 + i * 14, rc[1] + 4); } G.stroke(ctx, col, 1.1, 0.8);
        }
    };
    for (const k of Object.keys(BLD)) DRAW[k] = DRAW.building;
    // ---- naves
    DRAW.carrier = (S) => {
        const { r, ctx, col, t } = S, bob = Math.sin(t * 0.9) * 4, big = S.loc.kind === 'carrier';
        const L = r * (big ? 1.45 : 1.2), Wd = r * (big ? 0.5 : 0.42);
        const hull = [[-L, 0], [-L * 0.72, -Wd], [L * 0.7, -Wd], [L, 0], [L * 0.7, Wd], [-L * 0.72, Wd]].map(p => [S.x + p[0], S.y + p[1] + bob]);
        const a = S.vec(70 + bob), v = [a[0], a[1]];
        const top = G.extrude(ctx, hull.map(p => [p[0] + 0, p[1] + 0]), v[0] * 0.8, v[1] * 0.8, { side: S.side, lit: S.lit, roof: S.roof, edge: col, bands: 2 });
        const c = top.reduce((s, p) => [s[0] + p[0] / top.length, s[1] + p[1] / top.length], [0, 0]);
        ctx.beginPath(); for (let i = -3; i <= 3; i++) { ctx.moveTo(c[0] + i * L * 0.2, c[1] - Wd * 0.5); ctx.lineTo(c[0] + i * L * 0.2, c[1] + Wd * 0.5); } G.stroke(ctx, col, 1, 0.5);
        const tw = G.extrude(ctx, G.ngon(c[0] - L * 0.2, c[1], L * 0.14, L * 0.1, 4, Math.PI / 4), 0, -42, { side: S.side, lit: S.lit, roof: S.roof, edge: col, bands: 1 });
        G.glow(ctx, tw[0][0], tw[0][1], 30, col, 0.6);
        for (const sd of [-1, 1]) { const ex = S.x - L + 6, ey = S.y + sd * Wd * 0.5 + bob - 30; const f = 14 + Math.sin(t * 20 + sd) * 4; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(ex, ey, ex - f * 3, ey); g.addColorStop(0, U.rgba(col, 0.9)); g.addColorStop(1, U.rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(ex - f * 3, ey - 4, f * 3, 8); ctx.restore(); }
    };
    DRAW.ship = DRAW.carrier;
    // ---- embarcadero / muelle
    DRAW.dock = (S) => {
        const { r, ctx, col, t } = S;
        ctx.fillStyle = '#04101a'; ctx.fillRect(S.x - r * 1.2, S.y - r * 0.32, r * 2.4, r * 0.64);
        ctx.strokeStyle = U.rgba(col, 0.85); ctx.lineWidth = 1.6; ctx.strokeRect(S.x - r * 1.2, S.y - r * 0.32, r * 2.4, r * 0.64);
        ctx.beginPath(); for (let i = -5; i <= 5; i++) { ctx.moveTo(S.x + i * r * 0.22, S.y - r * 0.32); ctx.lineTo(S.x + i * r * 0.22, S.y + r * 0.32); } G.stroke(ctx, col, 1, 0.35);
        for (const sd of [-1, 1]) { const px = S.x + sd * r * 1.05; ctx.beginPath(); ctx.moveTo(px, S.y - 4); ctx.lineTo(px, S.y - 46); G.stroke(ctx, col, 2, 1); G.glow(ctx, px, S.y - 48, 16, col, 0.7);
            ctx.beginPath(); ctx.moveTo(px, S.y - 44); ctx.lineTo(px + sd * 22, S.y - 20 + Math.sin(t * 2) * 2); ctx.lineTo(px, S.y - 12); ctx.closePath(); ctx.fillStyle = U.rgba(col, 0.25); ctx.fill(); G.stroke(ctx, col, 1.2, 0.8); }
        S.sign('MUELLE', 52);
    };
    // ---- portal / puerta
    DRAW.gate = (S) => {
        const { r, ctx, col, t } = S;
        for (const sd of [-1, 1]) S.prism(S.x + sd * r * 0.8, S.y, r * 0.16, r * 0.14, 6, 0, 0, 120, { bands: 3 });
        const p = S.roofC(60, S.x, S.y);
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.8 * (1 - i * 0.18), r * 0.8 * (1 - i * 0.18) * 0.9, t * (i % 2 ? 1 : -1) * 0.8, 0, Math.PI * 1.55); G.stroke(ctx, i % 2 ? '#fff' : col, 1.8, 0.9); }
        G.glow(ctx, p[0], p[1], r * 1.1, col, 0.35 + 0.15 * Math.sin(t * 3));
        S.beam(60, 6, 520, col, 0.4);
    };
    DRAW.pit = (S) => {
        const { r, ctx, col, t } = S;
        const g = ctx.createRadialGradient(S.x, S.y, 4, S.x, S.y, r); g.addColorStop(0, '#000'); g.addColorStop(0.8, '#05020c'); g.addColorStop(1, U.rgba(col, 0.25));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(S.x, S.y, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 6; i++) { const k = ((t * 0.3 + i / 6) % 1); ctx.beginPath(); ctx.ellipse(S.x, S.y, r * (1 - k * 0.92), r * 0.72 * (1 - k * 0.92), t * 0.8, 0, Math.PI * 1.6); G.stroke(ctx, col, 1.2, 0.2 + 0.7 * k); }
        ctx.beginPath(); ctx.ellipse(S.x, S.y, r, r * 0.72, 0, 0, Math.PI * 2); G.stroke(ctx, col, 2, 0.9);
    };
    DRAW.scrap = (S) => {
        const { r, ctx, col, rng, t } = S;
        G.recognizer(ctx, S.x - r * 0.1, S.y + 10, 0.8, U.mix(col, '#334', 0.5), t, 0.5);
        for (let i = 0; i < 14; i++) { const a = rng() * 6.28, d = rng() * r; const px = S.x + Math.cos(a) * d, py = S.y + Math.sin(a) * d * 0.7; const pts = G.ngon(px, py, 5 + rng() * 14, 4 + rng() * 9, 5, rng() * 6); ctx.fillStyle = '#06101a'; G.path(ctx, pts); ctx.fill(); ctx.strokeStyle = U.rgba(col, 0.5); ctx.lineWidth = 1; G.path(ctx, pts); ctx.stroke(); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = U.rgba(S.th.accent, 0.8); for (let i = 0; i < 6; i++) { const ph = (t * 0.7 + i * 0.33) % 1; ctx.fillRect(S.x + (rng() - 0.5) * r, S.y - ph * 70, 2, 2); } ctx.restore();
    };
    DRAW.mesa = (S) => {
        const { r, ctx, col, rng } = S;
        const seeds = []; for (let i = 0; i < 8; i++) seeds.push(0.78 + rng() * 0.3);
        const tiers = [[0.95, 0, 46], [0.72, 46, 92], [0.5, 92, 130]];
        let ti = 0; for (const [k, h0, h1] of tiers) {
            const a = S.vecAt(S.x, S.y, h0), b = S.vecAt(S.x, S.y, h1);
            const pts = seeds.map((sd, i) => { const an = (i / 8) * 6.283; return [S.x + a[0] + Math.cos(an) * r * k * sd, S.y + a[1] + Math.sin(an) * r * k * sd * 0.78]; });
            G.extrude(ctx, pts, b[0] - a[0], b[1] - a[1], { side: '#050a14', lit: U.mix('#07101c', col, 0.4), roof: U.mix('#06101a', col, 0.15), edge: col, bands: 1 }); ti++;
        }
    };
    DRAW.ruins = (S) => {
        const { r, ctx, rng, t } = S;
        const bs = []; for (let i = 0; i < 9; i++) { const a = rng() * 6.28, d = Math.sqrt(rng()) * r * 0.8; bs.push({ x: S.x + Math.cos(a) * d, y: S.y + Math.sin(a) * d * 0.78, w: 12 + rng() * 22, h: 18 + rng() * 80 }); }
        bs.sort((a, b) => a.y - b.y);
        const save = S.edge; S.edge = U.mix('#223', S.col, 0.4);
        for (const b of bs) S.prism(b.x, b.y, b.w, b.w * 0.8, 5, rng() * 3, 0, b.h, { bands: 0, edge: S.edge });
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const ph = (t * 0.25 + i * 0.17) % 1; ctx.fillStyle = U.rgba(S.col, 0.7 * (1 - ph)); ctx.fillRect(S.x + (rng() - 0.5) * r * 1.5, S.y - ph * 120, 2, 2); } ctx.restore();
        S.edge = save;
    };
    DRAW.station = (S) => {
        const { r, ctx, col, t } = S;
        ctx.beginPath(); ctx.moveTo(S.x - 420, S.y); ctx.lineTo(S.x + 420, S.y); G.stroke(ctx, col, 1.4, 0.5);
        ctx.fillStyle = '#04101a'; ctx.fillRect(S.x - r * 1.5, S.y - r * 0.45, r * 3, r * 0.9); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.strokeRect(S.x - r * 1.5, S.y - r * 0.45, r * 3, r * 0.9);
        const v = S.vec(62); const c = [S.x + v[0], S.y + v[1]];
        ctx.fillStyle = U.rgba(col, 0.16); ctx.fillRect(c[0] - r * 1.6, c[1] - r * 0.5, r * 3.2, r); ctx.strokeStyle = U.rgba(col, 0.9); ctx.strokeRect(c[0] - r * 1.6, c[1] - r * 0.5, r * 3.2, r);
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(S.x + sd * r * 1.4, S.y + r * 0.35); ctx.lineTo(c[0] + sd * r * 1.4, c[1] + r * 0.35); G.stroke(ctx, col, 1.2, 0.8); }
        const k = (t * 0.4) % 1; G.glow(ctx, S.x - r * 1.4 + k * r * 2.8, S.y, 26, col, 0.6);
    };
    DRAW.tunnel = (S) => {
        const { r, ctx, col, t } = S;
        S.prism(S.x, S.y - 4, r * 1.1, r * 0.5, 4, 0, 0, 74, { rect: true, bands: 0 });
        const x0 = S.x - r * 0.55, x1 = S.x + r * 0.55, y1 = S.y + r * 0.5 - 4, b = S.vec(74);
        const g = ctx.createLinearGradient(0, y1, 0, y1 + b[1]); g.addColorStop(0, '#000'); g.addColorStop(1, '#010409');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y1 + b[1] * 0.5); ctx.quadraticCurveTo(S.x, y1 + b[1] * 0.95, x1, y1 + b[1] * 0.5); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y1 + b[1] * 0.5); ctx.quadraticCurveTo(S.x, y1 + b[1] * 0.95, x1, y1 + b[1] * 0.5); ctx.lineTo(x1, y1); G.stroke(ctx, col, 2, 1);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const k = ((t * 1.4 + i * 0.25) % 1); ctx.fillStyle = U.rgba(col, 0.8 * (1 - k)); ctx.fillRect(x0 + 6 + (x1 - x0 - 12) * ((i * 0.37) % 1), y1 + 2 - k * 8, 14, 2); } ctx.restore();
    };
    DRAW.park = (S) => {
        const { r, ctx, col, rng, t } = S;
        ctx.fillStyle = U.rgba(col, 0.07); ctx.beginPath(); ctx.ellipse(S.x, S.y, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(S.x, S.y, r, r * 0.8, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.4, 0.8);
        const ts = []; for (let i = 0; i < 9; i++) { const a = rng() * 6.28, d = 20 + rng() * r * 0.8; ts.push({ x: S.x + Math.cos(a) * d, y: S.y + Math.sin(a) * d * 0.78, h: 28 + rng() * 34 }); }
        ts.sort((a, b) => a.y - b.y);
        for (const tr of ts) { ctx.beginPath(); ctx.moveTo(tr.x - 9, tr.y); ctx.lineTo(tr.x, tr.y - tr.h); ctx.lineTo(tr.x + 9, tr.y); ctx.closePath(); ctx.fillStyle = U.rgba(col, 0.13); ctx.fill(); G.stroke(ctx, col, 1.2, 0.85); }
        G.glow(ctx, S.x, S.y, r * 0.7, col, 0.1 + 0.05 * Math.sin(t));
    };
    DRAW.plaza = (S) => {
        const { r, ctx, col, t } = S;
        ctx.save(); ctx.translate(S.x, S.y); ctx.scale(1, 0.8);
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, 0, r * (1 - i * 0.22), 0, Math.PI * 2); G.stroke(ctx, col, 1.2, 0.5 - i * 0.08); }
        for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); G.stroke(ctx, col, 0.8, 0.28); }
        ctx.restore();
        S.beam(0, 8, 160 + Math.sin(t * 2) * 12, col, 0.45); S.prism(S.x, S.y, r * 0.12, r * 0.1, 8, 0, 0, 26, { bands: 0 });
    };
    DRAW.snowpeak = (S) => {
        const { r, ctx, col, t } = S;
        const peaks = [[0, 0, r * 0.95, 150], [r * 0.55, 18, r * 0.65, 100], [-r * 0.5, 20, r * 0.6, 88]];
        for (const [dx, dy, w, h] of peaks) {
            const bx = S.x + dx, by = S.y + dy + 20;
            ctx.fillStyle = '#071826'; ctx.beginPath(); ctx.moveTo(bx - w, by); ctx.lineTo(bx, by - h); ctx.lineTo(bx + w, by); ctx.closePath(); ctx.fill();
            ctx.fillStyle = U.rgba('#dff', 0.9); ctx.beginPath(); ctx.moveTo(bx - w * 0.34, by - h * 0.66); ctx.lineTo(bx, by - h); ctx.lineTo(bx + w * 0.34, by - h * 0.66); ctx.lineTo(bx + w * 0.12, by - h * 0.74); ctx.lineTo(bx, by - h * 0.62); ctx.lineTo(bx - w * 0.14, by - h * 0.74); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(bx - w, by); ctx.lineTo(bx, by - h); ctx.lineTo(bx + w, by); G.stroke(ctx, col, 1.6, 0.9);
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(220,245,255,0.8)'; for (let i = 0; i < 24; i++) { const sx = S.x + (U.hash2(i, 4) - 0.5) * r * 2.6, sy = S.y - 120 + (((U.hash2(i, 5) * 300) + t * 40) % 300); ctx.fillRect(sx, sy, 2, 2); } ctx.restore();
    };
    DRAW.drill = (S) => {
        const { r, ctx, col, t } = S;
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(S.x, S.y + 8, r * 0.9, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(S.x, S.y + 8, r * 0.9, r * 0.6, 0, 0, Math.PI * 2); G.stroke(ctx, col, 2, 0.9);
        S.prism(S.x, S.y, r * 0.3, r * 0.26, 8, 0, 0, 120, { bands: 0 });
        const p = S.roofC(120); for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.57; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * r * 0.7, p[1] + Math.sin(a) * r * 0.5); G.stroke(ctx, S.th.accent, 2, 0.9); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28; ctx.fillStyle = U.rgba(S.th.accent, 0.8); ctx.fillRect(p[0] + Math.cos(a) * r * 0.6, p[1] + Math.sin(a) * r * 0.4, 2, 2); } ctx.restore();
    };
    DRAW.pad = (S) => {
        const { r, ctx, col, t } = S;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(S.x, S.y, r * (1 - i * 0.2), r * (1 - i * 0.2) * 0.8, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.6, 0.9 - i * 0.2); }
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; S.prism(S.x + Math.cos(a) * r * 0.9, S.y + Math.sin(a) * r * 0.72, 8, 7, 6, 0, 0, 46, { bands: 1 }); }
        S.beam(0, 28, 340, col, 0.3);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const ph = (t * 0.5 + i * 0.07) % 1; ctx.fillStyle = U.rgba(col, 0.85 * (1 - ph)); const s = 3 + (i % 3) * 2; ctx.fillRect(S.x + (U.hash2(i, 8) - 0.5) * r * 0.9, S.y - ph * 220, s, s); } ctx.restore();
    };
    DRAW.highway = (S) => {
        const { r, ctx, col, t } = S;
        ctx.fillStyle = 'rgba(10,6,12,0.92)'; ctx.fillRect(S.x - r * 1.4, S.y - r * 0.42, r * 2.8, r * 0.84);
        ctx.strokeStyle = U.rgba(col, 0.55); ctx.lineWidth = 1.4; ctx.strokeRect(S.x - r * 1.4, S.y - r * 0.42, r * 2.8, r * 0.84);
        ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 60; ctx.beginPath(); ctx.moveTo(S.x - r * 1.4, S.y); ctx.lineTo(S.x + r * 1.4, S.y); ctx.strokeStyle = U.rgba('#fff', 0.5); ctx.stroke(); ctx.setLineDash([]);
        for (let i = -3; i <= 3; i++) for (const sd of [-1, 1]) { const lx = S.x + i * r * 0.38, ly = S.y + sd * r * 0.46; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - 34); G.stroke(ctx, '#ffd8a0', 1.2, 0.8); G.glow(ctx, lx, ly - 36, 12, '#ffb870', 0.55); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const k = ((t * 0.35 + i / 3) % 1); const px = S.x - r * 1.4 + k * r * 2.8; ctx.fillStyle = U.rgba(i % 2 ? '#ff3358' : '#ffd8a0', 0.9); ctx.fillRect(px, S.y - r * 0.2 + i * 12, 14, 3); } ctx.restore();
        S.sign('AUTOPISTA', 20);
    };
    DRAW.observatory = (S) => {
        const { r, ctx, col, t } = S;
        S.prism(S.x, S.y, r * 0.6, r * 0.5, 12, 0, 0, 60, { bands: 1 });
        const p = S.roofC(60); const g = ctx.createRadialGradient(p[0] - 8, p[1] - 14, 4, p[0], p[1] - 6, r * 0.6);
        g.addColorStop(0, U.mix('#2a2050', col, 0.55)); g.addColorStop(1, '#0a0820'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.6, r * 0.48, 0, Math.PI, 0); ctx.ellipse(p[0], p[1], r * 0.6, r * 0.18, 0, 0, Math.PI, true); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.6, r * 0.48, 0, Math.PI, 0); G.stroke(ctx, col, 1.8, 0.95);
        const a = -Math.PI / 2 + Math.sin(t * 0.5) * 0.5; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 10); ctx.lineTo(p[0] + Math.cos(a) * r * 0.6, p[1] - 10 + Math.sin(a) * r * 0.6); G.stroke(ctx, '#fff', 2, 0.9);
        ctx.font = 'bold 18px Orbitron, sans-serif'; ctx.fillStyle = U.rgba(col, 0.9); ctx.textAlign = 'center'; ctx.fillText('Σ', p[0], p[1] - r * 0.52);
        S.beam(60, 3, 380, col, 0.55);
    };

    // ---- tipos de lugar nuevos
    DRAW.rwtower = (S) => {
        const { r, ctx, col, t } = S; S.prism(S.x, S.y, r * 0.72, r * 0.56, 4, 0, 0, 260, { rect: true, bands: 12 });
        const p = S.roofC(260); ctx.fillStyle = U.rgba(S.th.accent, 0.85); for (let i = 0; i < 9; i++) if (U.hash2(i, S.loc.id.length) > 0.4) ctx.fillRect(p[0] - r * 0.6 + i * r * 0.15, p[1] + 10, 8, 5);
        S.beam(260, 4, 420, col, 0.35); ctx.beginPath(); ctx.arc(p[0], p[1] - 8, 6 + Math.sin(t * 4) * 1.5, 0, Math.PI * 2); G.stroke(ctx, S.th.accent, 1.8, 1);
    };
    DRAW.block = (S) => DRAW.city(S);
    BLD.shop = [1.2, 0.9, 52, 'sign']; BLD.house = [1.1, 0.9, 50, 'chim']; DRAW.shop = DRAW.building; DRAW.house = DRAW.building;
    DRAW.startline = (S) => {
        const { r, ctx, col, t } = S;
        for (let i = -4; i <= 4; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffffff' : '#101820'; ctx.fillRect(S.x + i * r * 0.2 - r * 0.1, S.y + j * 14 - 7, r * 0.2, 14); }
        for (const sd of [-1, 1]) S.prism(S.x + sd * r * 0.95, S.y, 8, 8, 6, 0, 0, 110, { bands: 3 });
        const a = S.vecAt(S.x, S.y, 110); ctx.beginPath(); ctx.moveTo(S.x - r * 0.95 + a[0], S.y + a[1]); ctx.lineTo(S.x + r * 0.95 + a[0], S.y + a[1]); G.stroke(ctx, col, 3, 1);
        G.glow(ctx, S.x + a[0], S.y + a[1], r, col, 0.25 + 0.15 * Math.sin(t * 4));
    };
    DRAW.tankarena = (S) => { DRAW.arena(S); const { r, ctx, col } = S; for (const [dx, dy, a] of [[-0.45, 0.2, 0.3], [0.4, -0.15, -0.4]]) { const px = S.x + dx * r, py = S.y + dy * r - 40; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = '#05090e'; ctx.fillRect(-18, -10, 36, 20); ctx.fillRect(0, -3, 26, 6); ctx.restore(); ctx.beginPath(); ctx.rect(px - 18, py - 10, 36, 20); G.stroke(ctx, col, 1.4, 0.9); } };
    DRAW.cave = (S) => {
        const { r, ctx, col } = S;
        for (let i = 0; i < 5; i++) { const a = -2.9 + i * 0.7, px = S.x + Math.cos(a) * r * 0.9, py = S.y + Math.sin(a) * r * 0.5; ctx.fillStyle = '#080614'; G.path(ctx, G.ngon(px, py, 30 + i * 4, 40, 6, i)); ctx.fill(); ctx.strokeStyle = U.rgba(col, 0.45); ctx.lineWidth = 1; G.path(ctx, G.ngon(px, py, 30 + i * 4, 40, 6, i)); ctx.stroke(); }
        const g = ctx.createRadialGradient(S.x, S.y, 5, S.x, S.y, r * 0.7); g.addColorStop(0, '#000'); g.addColorStop(1, U.rgba(col, 0.2)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(S.x, S.y, r * 0.7, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(S.x, S.y, r * 0.7, r * 0.45, 0, 0, Math.PI * 2); G.stroke(ctx, col, 1.6, 0.9);
    };
    // lugares secretos aún no descubiertos: muro parpadeante / glifo
    DRAW.hidden = (S) => {
        const GLY = { mr_l_observatory: ['#B9A7FF', ['Σ', 'π', '∫', 'Ω']], carlos_compile_room: ['#6AFFB0', ['</>', '{ }', '01', '&&']], transformer_hall: ['#FFE45C', ['⚡', 'V', 'Ω', '∿']], process_control_room: ['#FFB347', ['⚙', 'PID', 'Δ', '∮']] };
        const { ctx, t, loc } = S, gl = GLY[loc.id], col = gl ? gl[0] : '#7DFFFF';
        const fl = Math.random() < 0.08 ? 0.15 : 0.5 + 0.35 * Math.sin(t * 7 + 2 * Math.sin(t * 13));
        ctx.save(); ctx.globalAlpha = fl;
        if (gl) {
            ctx.font = 'bold 40px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(gl[1][Math.floor(t * 1.5) % 4], S.x, S.y);
            ctx.beginPath(); ctx.arc(S.x, S.y - 14, 40 + Math.sin(t * 3) * 4, 0, Math.PI * 2); G.stroke(ctx, col, 1.4, 0.8);
        } else {
            for (let i = 0; i < 5; i++) { const yy = S.y - 60 + i * 24; ctx.fillStyle = U.rgba(col, 0.1 + Math.random() * 0.3); ctx.fillRect(S.x - 26 + (Math.random() - 0.5) * 4, yy, 52, 18); }
            ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(S.x - 26, S.y - 62, 52, 124);
        }
        ctx.restore();
    };
    DRAW.secret = DRAW.hidden;

    // ---- rótulo de nombre
    G.drawLabel = (ctx, loc, grid, cam, near) => {
        const th = G.THEME[grid.era], col = G.facColor(loc, th, grid.era);
        const h = KH[loc.kind] || 70;
        const x = loc.x - cam.ox, y = loc.y - cam.oy - Math.min(h, 120) - 34;
        if (y < -30 || y > cam.h + 60 || x < -200 || x > cam.w + 200) return;
        ctx.save(); ctx.globalAlpha = near ? 1 : 0.72;
        ctx.font = `${near ? 13 : 11}px Orbitron, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(loc.name).width + 18;
        ctx.fillStyle = 'rgba(0,4,10,0.6)'; ctx.fillRect(x - w / 2, y - 10, w, 20);
        ctx.strokeStyle = U.rgba(col, near ? 0.95 : 0.55); ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, y - 10, w, 20);
        ctx.fillStyle = '#fff'; ctx.fillText(loc.name, x, y + 1);
        ctx.restore();
    };

    // ---- portales
    G.drawPortal = (ctx, p, cam, t) => {
        const x = p.x - cam.ox, y = p.y - cam.oy;
        if (x < -200 || x > cam.w + 200 || y < -300 || y > cam.h + 200) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, y, 0, y - 420); g.addColorStop(0, U.rgba(p.color, 0.55)); g.addColorStop(1, U.rgba(p.color, 0));
        ctx.fillStyle = g; ctx.fillRect(x - 26, y - 420, 52, 420);
        ctx.restore();
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y, 52 - i * 9, 52 * 0.7 - i * 6, t * (i % 2 ? 1.6 : -1.6), 0, Math.PI * 1.5); G.stroke(ctx, i % 2 ? '#fff' : p.color, 2.2, 0.95); }
        G.glow(ctx, x, y, 90, p.color, 0.4 + 0.2 * Math.sin(t * 4));
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) { const ph = (t * 0.6 + i * 0.1) % 1; ctx.fillStyle = U.rgba(p.color, 1 - ph); const a = i * 1.7 + t; ctx.fillRect(x + Math.cos(a) * 30 * (1 - ph), y - ph * 160, 3, 3); }
        ctx.restore();
        ctx.font = '11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = p.color; ctx.fillText(p.name, x, y + 52);
    };

    // ---- recognizers ambientales (vuelan sobre la Grid)
    G.drawAirborne = (ctx, grid, cam, t) => {
        if (grid.rw) return;
        const th = G.THEME[grid.era], n = grid.era === '2025' ? 2 : grid.era === '2010' ? 3 + Math.round(G.clu * 3) : 3;
        for (let i = 0; i < n; i++) {
            const sp = 20 + i * 8, L = grid.w + 700, dir = i % 2 ? -1 : 1;
            const px = ((((t * sp * dir + i * 1700) % L) + L) % L) - 350, py = (i + 1) * grid.h / (n + 1);
            const sx = px - cam.ox, sy = py - cam.oy;
            if (sx < -200 || sx > cam.w + 200 || sy < -260 || sy > cam.h + 260) continue;
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(sx + 50, sy + 120, 80, 14, 0, 0, Math.PI * 2); ctx.fill();
            G.recognizer(ctx, sx, sy - 160, 1.0, grid.era === '1982' || (grid.era === '2010' && G.clu > 0.5) ? '#FF5A1A' : th.danger, t, 0.85);
        }
    };

    // ===================================================================== INTERIORES
    G.drawInterior = (ctx, itr, cam, t, era) => {
        const th = G.THEME[era], W = cam.w, H = cam.h, ox = cam.ox, oy = cam.oy;
        const col = itr.loc ? G.facColor(itr.loc, th, era) : th.glow;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const x0 = -ox, y0 = -oy, x1 = itr.w - ox, y1 = itr.h - oy;
        // suelo
        const fg = ctx.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 60, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(itr.w, itr.h) * 0.7);
        fg.addColorStop(0, U.mix('#02060b', col, 0.14)); fg.addColorStop(1, '#010306');
        ctx.fillStyle = fg; ctx.fillRect(x0, y0, itr.w, itr.h);
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, itr.w, itr.h); ctx.clip();
        const ts = 70;
        for (let i = 0; i * ts <= itr.w; i++) for (let j = 0; j * ts <= itr.h; j++) { if ((i + j) % 2) continue; ctx.fillStyle = U.rgba(col, 0.035); ctx.fillRect(x0 + i * ts, y0 + j * ts, ts, ts); }
        ctx.strokeStyle = U.rgba(col, 0.2); ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i * ts <= itr.w; i++) { ctx.moveTo(x0 + i * ts + 0.5, y0); ctx.lineTo(x0 + i * ts + 0.5, y1); }
        for (let j = 0; j * ts <= itr.h; j++) { ctx.moveTo(x0, y0 + j * ts + 0.5); ctx.lineTo(x1, y0 + j * ts + 0.5); }
        ctx.stroke();
        // reflejo de barrido
        const sw = (t * 120) % (itr.h + 200); const sg = ctx.createLinearGradient(0, y0 + sw - 100, 0, y0 + sw); sg.addColorStop(0, U.rgba(col, 0)); sg.addColorStop(1, U.rgba(col, 0.07)); ctx.fillStyle = sg; ctx.fillRect(x0, y0 + sw - 100, itr.w, 100);
        ctx.restore();
        // paredes
        const wallC = { side: '#04090f', lit: U.mix('#04090f', col, 0.35), roof: '#03070c', edge: col, bands: 3 };
        G.extrude(ctx, [[x0 - 40, y0 - 40], [x1 + 40, y0 - 40], [x1 + 40, y0], [x0 - 40, y0]], 0, -120, wallC);
        G.extrude(ctx, [[x0 - 40, y0], [x0, y0], [x0, y1], [x0 - 40, y1]], (x0 - W / 2) * 0.0007 * 100, -80 + 0, Object.assign({}, wallC, { bands: 0 }));
        G.extrude(ctx, [[x1, y0], [x1 + 40, y0], [x1 + 40, y1], [x1, y1]], (x1 - W / 2) * 0.0007 * 100, -80, Object.assign({}, wallC, { bands: 0 }));
        // elementos ordenados por y
        const els = itr.elements.slice().sort((a, b) => (a.y + (a.h || a.r || 0)) - (b.y + (b.h || b.r || 0)));
        for (const e of els) {
            const c = e.color && e.t !== 'core' ? U.mix(e.color, col, 0.35) : (e.color || col);
            const vec = (px, py, h) => [(px - W / 2 - ox) * 0.0004 * h * 0 + (px - ox - W / 2) * 0.0004 * h, -h * 0.82 + (py - oy - H / 2) * 0.0004 * h];
            if (e.t === 'box') {
                const hg = e.hgt || 46, px = e.x - ox, py = e.y - oy, v = vec(e.x, e.y, hg);
                G.extrude(ctx, [[px, py], [px + e.w, py], [px + e.w, py + e.h], [px, py + e.h]], v[0], v[1], { side: U.mix('#03070c', c, 0.18), lit: U.mix('#03070c', c, 0.6), roof: U.mix('#03070c', c, 0.3), edge: col, bands: 1 });
                if (e.label) { ctx.font = '11px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; const tw = ctx.measureText(e.label).width; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(px + e.w / 2 + v[0] - tw / 2 - 4, py + e.h / 2 + v[1] - 9, tw + 8, 14); ctx.fillStyle = '#e8ffff'; ctx.fillText(e.label, px + e.w / 2 + v[0], py + e.h / 2 + v[1] + 2); }
            } else if (e.t === 'cyl') {
                const hg = e.hgt || 40, px = e.x - ox, py = e.y - oy, v = vec(e.x, e.y, hg);
                G.extrude(ctx, G.ngon(px, py, e.r, e.r * 0.8, 16, 0), v[0], v[1], { side: U.mix('#03070c', c, 0.2), lit: U.mix('#03070c', c, 0.6), roof: U.mix('#03070c', c, 0.3), edge: col, bands: 1 });
                if (e.label) { ctx.font = '11px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; const tw = ctx.measureText(e.label).width; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(px + v[0] - tw / 2 - 4, py + v[1] - 28, tw + 8, 14); ctx.fillStyle = '#e8ffff'; ctx.fillText(e.label, px + v[0], py + v[1] - 17); }
            } else if (e.t === 'core') {
                const px = e.x - ox, py = e.y - oy;
                ctx.save(); ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createLinearGradient(0, py, 0, py - 460); g.addColorStop(0, U.rgba(e.color, 0.5)); g.addColorStop(1, U.rgba(e.color, 0));
                ctx.fillStyle = g; ctx.fillRect(px - e.r * 0.5, py - 460, e.r, 460); ctx.restore();
                for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(px, py, e.r * (1 - i * 0.28), e.r * (1 - i * 0.28) * 0.72, t * (i % 2 ? 1 : -1), 0, Math.PI * 1.6); G.stroke(ctx, e.color, 1.8, 0.95); }
                G.glow(ctx, px, py, e.r * 2, e.color, 0.35 + 0.15 * Math.sin(t * 3));
                if (e.label) { ctx.font = '11px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; const tw = ctx.measureText(e.label).width; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(px - tw / 2 - 4, py + e.r * 0.8 + 6, tw + 8, 14); ctx.fillStyle = '#fff'; ctx.fillText(e.label, px, py + e.r * 0.8 + 17); }
            }
        }
        // puerta de salida
        const ex = itr.exit.x - ox, ey = itr.exit.y - oy;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const dg = ctx.createRadialGradient(ex, ey, 4, ex, ey, 70); dg.addColorStop(0, U.rgba(col, 0.8)); dg.addColorStop(1, U.rgba(col, 0)); ctx.fillStyle = dg; ctx.fillRect(ex - 70, ey - 70, 140, 140); ctx.restore();
        ctx.beginPath(); ctx.ellipse(ex, ey, 38, 14, 0, 0, Math.PI * 2); G.stroke(ctx, col, 2, 1);
        ctx.font = '11px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('SALIDA [E]', ex, ey + 32);
        // título
        ctx.fillStyle = U.rgba(col, 0.9); ctx.font = '12px Orbitron, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(itr.name.toUpperCase(), x0 + 16, y0 + 24);
    };

})(window.TG = window.TG || {});
