"""Genera LISTADO_NPCS.md leyendo los datos del juego (NPC, lugares, misiones, tiendas) en un navegador headless.
Uso:  python3 server/npc_ai_server.py  (en otra terminal)  y luego  python3 tools/make_listing.py [url]"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/?debug=1'
SHOPS = {
 'yori_1982': 'Tienda «Simulaciones de Yori»: Cápsula de Energía (50◈), Escudo Ligero (120◈, +10% resistencia)',
 'mcp_1982': 'Tienda «Arsenal de Sark»: Disco Reforzado (150◈, +10% daño), Chip Táctico (120◈, +5% velocidad)',
 'able': 'Tienda «Taller de Able»: Afinación de Ciclo (200◈), Kit de Reparación (60◈), Amortiguadores (180◈)',
 'julian_2025': 'Tienda «Núcleo de Dillinger»: Núcleo Dillinger (300◈, +15% daño), Inyección de Energía (250◈, +20 vida)',
 'eve_2025': 'Tienda «Suministros de ENCOM»: Parche de Permanencia (220◈), Cápsula ENCOM (50◈)',
 'armory': 'Tienda «La Armería»: Disco de Combate (180◈), Traje Reforzado (200◈), Cápsula (50◈)'}
JS = """(() => { const out = []; for (const n of TG.NPCS) { const loc = TG.locById[n.at || n.in]; out.push({ id: n.id, name: n.name, role: n.role, grid: n.grid, loc: loc ? loc.name : '?', inside: !!n.in, hidden: !!(loc && loc.hidden), shop: n.shop || null, phase: n.phase || null, comp: !!TG.COMPANIONS[n.id], quests: (TG.questsByGiver[n.id] || []).map(q => ({ t: TG.QUESTS[q].title, r: TG.QUESTS[q].reward.text, k: TG.QUESTS[q].kind })) }); } return { npcs: out, order: TG.WORLD_ORDER, names: TG.ERA_NAME }; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto(URL); await pg.wait_for_timeout(800); d = await pg.evaluate(JS); await b.close()
    rows = {e: [] for e in d['order']}
    for n in d['npcs']:
        where = n['loc'] + (' (interior' + (', oculto' if n['hidden'] else '') + ')' if n['inside'] else ' (alrededores)')
        if n['phase']: where += ' · solo ' + ('ANTES' if n['phase'] == 'pre' else 'DESPUÉS') + ' de la traición de Clu'
        rew = [('★ ' if q['k'] == 'main' else '') + q['t'] + ' → ' + q['r'] for q in n['quests']]
        if n['shop']: rew.append(SHOPS.get(n['shop'], 'Tienda'))
        if n['comp']: rew.append('Compañero reclutable (♥ amistad)')
        rows.setdefault(n['grid'], []).append('| %s | %s | %s |' % (n['name'], where, '<br>'.join(rew) if rew else '— (conversación y lore)'))
    md = ['# Listado de NPCs: dónde aparecen y qué recompensa dan', '', '★ = misión de la historia principal. «Compañero» = puedes invitarlo a acompañarte (tecla K).', '',
          '## Mr. U (aleatorio)', '', '| NPC | Dónde aparece | Recompensa |', '|---|---|---|', '| Mr. U | Aparece al azar en cualquier mapa (la primera vez a los ~30 s de jugar) | Minijuego «Ghost Rider» en otra ventana → 🔥 La Bicicleta de Mr. U (ciclo velocidad 16 con estela de fuego) |', '']
    for e in d['order']:
        if rows.get(e): md += ['## ' + d['names'][e], '', '| NPC | Dónde aparece | Recompensa / qué ofrece |', '|---|---|---|'] + rows[e] + ['']
    open('LISTADO_NPCS.md', 'w', encoding='utf-8').write('\n'.join(md)); print('LISTADO_NPCS.md:', len(d['npcs']) + 1, 'NPCs')
asyncio.run(main())
