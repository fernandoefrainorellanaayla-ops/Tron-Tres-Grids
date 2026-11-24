/* TRON — difficulty.js: Normal por defecto; la AMENAZA sube poco a poco con la historia y el tiempo. */
(function (TG) {
    'use strict';
    const MODES = { easy: { n: 'Fácil', hp: 0.8, dmg: 0.75, spd: 0.92, rival: 0.88, rew: 1.15 }, normal: { n: 'Normal', hp: 1, dmg: 1, spd: 1, rival: 1, rew: 1 }, hard: { n: 'Difícil', hp: 1.3, dmg: 1.3, spd: 1.08, rival: 1.08, rew: 0.9 } };
    class Difficulty {
        constructor(g) { this.g = g; this.mode = 'normal'; this.minutes = 0; this.threat = 1; this.acc = 0; }
        get m() { return MODES[this.mode] || MODES.normal; }
        set(mode) { if (MODES[mode]) this.mode = mode; this.recalc(); }
        recalc() {
            const q = this.g.quests, main = [...q.completed].filter(id => TG.QUESTS[id] && TG.QUESTS[id].kind === 'main').length, side = q.completed.size - main;
            this.threat = 1 + Math.min(1.1, 0.045 * main + 0.01 * Math.max(0, side) + this.minutes * 0.003);
        }
        update(dt) { this.acc += dt; if (this.acc >= 5) { this.minutes += this.acc / 60; this.acc = 0; this.recalc(); } }
        enemy() { const t = this.threat, m = this.m; return { hp: m.hp * (0.9 + 0.1 * t) * (1 + (t - 1) * 0.55), dmg: m.dmg * (1 + (t - 1) * 0.4), spd: m.spd * (1 + (t - 1) * 0.12) }; }
        rival() { return this.m.rival * (1 + (this.threat - 1) * 0.12); }
        extra() { return Math.max(0, Math.round((this.threat - 1) * 2.2)); }
        label() { return `${this.m.n} · Amenaza ×${this.threat.toFixed(2)}`; }
        serialize() { return { mode: this.mode, minutes: this.minutes }; }
        restore(d) { if (d) { this.mode = MODES[d.mode] ? d.mode : 'normal'; this.minutes = d.minutes || 0; } this.recalc(); }
    }
    TG.Difficulty = Difficulty; TG.DIFF_MODES = MODES;
})(window.TG = window.TG || {});
