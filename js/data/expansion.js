/* TRON — data/expansion.js: mapas x2, 2 Grids nuevas (2003 Tron 2.0 / Arq Identity-Catalyst), 3 mundos reales, más lugares. */
(function (TG) {
    'use strict';
    const SC = 2;
    const L = (id, name, x, y, r, kind, src, o = {}) => Object.assign({ id, name, x, y, r, kind, src, interior: false }, o);
    for (const era of ['1982', '2010', '2025']) {
        const g = TG.GRIDS[era]; g.w *= SC; g.h *= SC; g.spawn.x *= SC; g.spawn.y *= SC;
        for (const r of g.regions) r.rect = r.rect.map(v => v * SC);
        for (const l of TG.LOCATIONS[era]) { l.x *= SC; l.y *= SC; }
        for (const p of TG.PORTALS[era]) { p.x *= SC; p.y *= SC; }
    }
    const RW82 = ['flynns_arcade', 'encom_laser_lab', 'dillinger_office'];
    const moved = TG.LOCATIONS['1982'].filter(l => RW82.includes(l.id));
    TG.LOCATIONS['1982'] = TG.LOCATIONS['1982'].filter(l => !RW82.includes(l.id));
    TG.GRIDS['1982'].spawn = { x: 860, y: 1760 };
    const T = 'Videojuego: Tron 2.0 (continuidad alternativa)', I = 'Videojuego: Tron: Identity', C = 'Videojuego: Tron: Catalyst', AMB = 'Ambientación';
    TG.GRIDS['2003'] = { era: '2003', name: 'ENCOM/fCon 2003', full: 'Red ENCOM-fCon · Tron 2.0 (continuidad alternativa)', w: 6400, h: 6400, color: '#7DFF6A', accent: '#FFD84A', danger: '#FF4D4D', spawn: { x: 900, y: 1240 }, regions: [] };
    TG.GRIDS['arq'] = { era: 'arq', name: 'Arq Grid', full: 'Arq Grid · Vertical Slice (Identity / Catalyst)', w: 7600, h: 7600, color: '#B58CFF', accent: '#35F0C8', danger: '#FF3D7F', spawn: { x: 1000, y: 1500 }, regions: [] };
    TG.GRIDS['r1982'] = { era: 'r1982', name: 'Mundo real 1982', full: 'Mundo real · Ciudad de ENCOM (1982)', w: 5600, h: 5600, color: '#FFB347', accent: '#FF5A3A', danger: '#FF4A1A', spawn: { x: 3400, y: 1900 }, regions: [], rw: true, style: '1982' };
    TG.GRIDS['r2010'] = { era: 'r2010', name: 'Mundo real 2010', full: 'Mundo real · La ciudad de Flynn y Sam (2010)', w: 6000, h: 6000, color: '#9FD8FF', accent: '#FF9A1F', danger: '#FF7A00', spawn: { x: 3000, y: 3400 }, regions: [], rw: true, style: '2010' };
    TG.GRIDS['r2025'] = { era: 'r2025', name: 'Mundo real 2025', full: 'Mundo real · Vancouver, Dillinger Systems (2025)', w: 6400, h: 6400, color: '#FF5C7C', accent: '#4DB8FF', danger: '#FF1744', spawn: { x: 2200, y: 2200 }, regions: [], rw: true, style: '2025' };
    Object.assign(TG.ERA_NAME, { '2003': 'Red ENCOM-fCon 2003', arq: 'Arq Grid', r1982: 'Mundo real 1982', r2010: 'Mundo real 2010', r2025: 'Mundo real 2025' });

    TG.LOCATIONS['1982'].push(
        L('digitizing_pad_82', 'Plataforma de Llegada', 700, 1500, 80, 'pad', 'Tron (1982)', { fac: 'ally', desc: 'Donde el láser de ENCOM te materializa dentro del sistema.' }),
        L('race_82', 'Pista de la Rejilla Exterior', 4200, 1800, 100, 'startline', 'Tron (1982)', { fac: 'enemy', act: { type: 'race', track: 'r82' }, desc: 'Carrera de ciclos de luz por el borde del sistema.' }),
        L('tank_arena_82', 'Arena de Tanques', 2200, 5600, 120, 'tankarena', 'Tron (1982)', { arena: 'tank', fac: 'enemy', desc: 'Combate de tanques de batalla del MCP.' }),
        L('discs_of_tron_82', 'Sala de Discs of Tron', 5200, 4600, 110, 'ring', 'Videojuego: Discs of Tron', { arena: 'disc', fac: 'enemy', desc: 'Duelos de disco a lo arcade.' }),
        L('grid_bug_field', 'Campo de Grid Bugs', 7600, 3800, 90, 'park', 'Videojuego: Grid Bugs (arcade de Tron)', { fac: 'neutral', desc: 'Una pradera digital infestada de pequeños bugs inofensivos.' }),
        L('recognizer_hangar_82', 'Hangar de Recognizers', 5800, 5400, 110, 'hangar', 'Tron (1982)', { interior: true, fac: 'enemy', props: ['Recognizer en reparación', 'Consola de vuelo', 'Rack de piezas', 'Jaula de patrullas'], desc: 'Donde se guardan los Recognizers del MCP.' })
    );
    TG.LOCATIONS['2010'].push(
        L('race_tron_city', 'Circuito de Tron City', 6400, 4300, 100, 'startline', 'Tron: Legacy', { fac: 'enemy', act: { type: 'race', track: 'tron_city' }, desc: 'Carrera urbana entre los rascacielos de Tron City.' }),
        L('race_outlands', 'Carrera de las Tierras Lejanas', 3400, 8700, 100, 'startline', 'Tron: Evolution', { fac: 'neutral', act: { type: 'race', track: 'outlands' }, desc: 'Un gran circuito por las Outlands.' }),
        L('race_argon', 'Rally de Argón', 3300, 3000, 90, 'startline', 'Tron: Uprising', { fac: 'neutral', act: { type: 'race', track: 'argon' }, desc: 'Carrera clandestina por los túneles y calles de Argón.' }),
        L('tank_arena_10', 'Arena de Tanques de la Grid', 8800, 6400, 120, 'tankarena', 'Tron: Evolution', { arena: 'tank', fac: 'enemy', desc: 'Entrenamiento de tanques en las afueras de Tron City.' }),
        L('iso_quarantine', 'Zona de Cuarentena ISO', 7800, 7000, 110, 'ruins', 'Tron: Evolution / Cómic: Betrayal', { fac: 'enemy', desc: 'Donde Clu 2 justificó la Purga de los ISO usando a Abraxas como virus.' }),
        L('cyrus_pit_cave', 'Cueva de la Soledad de Tron', 900, 8800, 90, 'cave', 'Tron: Uprising', { fac: 'ally', desc: 'Cueva solitaria fuera de Argón donde Tron vive en secreto.' }),
        L('sea_lighthouse', 'Faro del Mar de Simulación', 9900, 2400, 70, 'tower', 'Tron: Legacy', { solid: true, fac: 'neutral', desc: 'Torre de luz sobre el Mar de Simulación.' }),
        L('encom_server_room', 'Sala de Servidores de Flynn', 6900, 6900, 80, 'server', 'Tron: Legacy', { interior: true, fac: 'ally', props: ['Rack principal de Flynn', 'Consola de monitoreo', 'Archivo de ISOs'], desc: 'Respaldo del sistema que Flynn construyó bajo su arcade.' })
    );
    TG.LOCATIONS['2025'].push(
        L('race_2025', 'Circuito Dillinger', 5600, 2800, 100, 'startline', 'Tron: Ares', { fac: 'enemy', act: { type: 'race', track: 'dillinger' }, desc: 'Pista de pruebas de los ciclos de Dillinger.' }),
        L('tank_arena_25', 'Arena de Tanques Dillinger', 2400, 5600, 120, 'tankarena', 'Tron: Ares', { arena: 'tank', fac: 'enemy', desc: 'Simulación de combate blindado.' }),
        L('sark_disc_vault', 'Bóveda del Disco de Sark', 6200, 4200, 85, 'core', 'Tron: Ares', { interior: true, fac: 'enemy', props: ['Pedestal del disco de Sark', 'Terminal de acceso', 'Cápsula de contención'], desc: 'Donde Julian encuentra el disco de Sark.' }),
        L('ares_barracks', 'Barracones de Ares', 800, 2500, 90, 'hall', 'Tron: Ares', { interior: true, fac: 'enemy', props: ['Litera digital', 'Consola de Athena', 'Armero de entrenamiento'], desc: 'Donde descansan los soldados de Dillinger.' }),
        L('carlos_compile_room', 'Sala de Compilación de Carlos', 8800, 8900, 60, 'secret', 'Original del juego', { interior: true, hidden: true, fac: 'neutral', desc: 'Un cuarto oculto lleno de terminales: aquí trabaja Carlos Compiler.' })
    );
    TG.LOCATIONS['2003'] = [
        L('primary_digitizing', 'Digitalización Primaria', 900, 1000, 90, 'pad', T, { fac: 'ally', desc: 'Donde el láser deposita a Jet Bradley en el sistema.' }),
        L('combat_training_arena', 'Arena de Entrenamiento de Combate', 1900, 2000, 120, 'arena', T, { arena: 'both', fac: 'neutral', desc: 'Arena de práctica de combate.' }),
        L('light_cycle_arena_2003', 'Arena de Ciclos de Mercury', 3200, 1300, 130, 'cycle_arena', T, { arena: 'cycle', fac: 'neutral', desc: 'El territorio de Mercury, campeona de ciclos de luz.' }),
        L('race_2003', 'Circuito de Mercury', 2600, 3200, 100, 'startline', T, { fac: 'neutral', act: { type: 'race', track: 'mercury' }, desc: 'Circuito de carreras de ciclos del sistema.' }),
        L('legacy_code_vault', 'Cámara del Código Legado', 4800, 1900, 90, 'core', T, { interior: true, fac: 'ally', props: ['Código Legado de Tron', 'Terminal de Ma3a', 'Sello de ENCOM'], desc: 'El Código Legado que Jet debe encontrar.' }),
        L('alans_desktop_pc', 'Escritorio-PC de Alan', 1300, 3700, 100, 'hall', T, { interior: true, fac: 'ally', props: ['Carpeta de Alan', 'Papelera de reciclaje', 'Terminal de usuario'], desc: 'El PC de Alan Bradley convertido en nivel del sistema.' }),
        L('fcon_lab', 'Laboratorio fCon', 3700, 3700, 100, 'lab', T, { interior: true, fac: 'enemy', props: ['Cámara de digitalización', 'Terminal de Thorne', 'Archivo de Future Control'], desc: 'Laboratorio de Future Control Industries.' }),
        L('remote_access_node', 'Nodo de Acceso Remoto', 5300, 3900, 90, 'tower', T, { interior: true, solid: true, fac: 'enemy', props: ['Antena de enlace', 'Consola de red'], desc: 'Punto de conexión con el exterior.' }),
        L('security_server', 'Servidor de Seguridad', 2500, 5300, 110, 'hall', T, { interior: true, fac: 'enemy', props: ['Puesto del Kernel', 'Panel de ICPs', 'Celda de aislamiento'], desc: 'Dominio del Kernel y sus programas de comunicaciones.' }),
        L('correction_algorithms', 'Algoritmos de Corrección', 4500, 5500, 100, 'core', T, { interior: true, fac: 'ally', props: ['Núcleo de algoritmos de corrección', 'Banco de pruebas de digitalización'], desc: 'Los algoritmos que evitan que la digitalización salga mal.' }),
        L('ma3a_chamber', 'Cámara de Ma3a', 900, 2500, 70, 'chamber', T, { interior: true, fac: 'ally', props: ['Terminal de Ma3a', 'Registro de mejoras de Lora'], desc: 'Hogar de Ma3a, el programa asistente matemático.' }),
        L('transformer_hall', 'Sala de Transformadores de Mr. E', 6000, 700, 55, 'secret', 'Original del juego', { interior: true, hidden: true, fac: 'neutral', desc: 'Un zumbido eléctrico delata un cuarto oculto: allí trabaja Mr. E.' })
    ];
    TG.PORTALS['2003'] = [{ x: 900, y: 1280, to: '1982', name: 'Portal a la Grid ENCOM 1982', color: '#00D4FF' }, { x: 5600, y: 5400, to: '2025', name: 'Portal a la Grid de Dillinger 2025', color: '#FF1744' }];
    TG.LOCATIONS['arq'] = [
        L('arq_gate', 'Puerta del Servidor ARQ', 1000, 1300, 80, 'gate', I, { fac: 'ally', desc: 'Entrada a la Arq Grid desde el servidor de Flynn.' }),
        L('vertical_slice', 'Vertical Slice', 3800, 3800, 200, 'city', I, { fac: 'neutral', desc: 'La ciudad más antigua de la Arq Grid, fundada por Alpha y supervisada por Flynn.' }),
        L('terminal_bar', 'Terminal Bar', 2800, 3000, 85, 'club', I, { interior: true, fac: 'neutral', props: ['Barra de Prime', 'Mesa de contactos', 'Terminal de información'], desc: 'El bar donde se cruzan informantes y detectives.' }),
        L('arena_4a', 'Arena 4A', 5000, 2800, 130, 'arena', I, { arena: 'both', fac: 'enemy', desc: 'Arena de combate de Vertical Slice.' }),
        L('repository', 'El Repositorio', 5700, 4800, 100, 'server', I, { interior: true, fac: 'neutral', props: ['Archivo central de datos', 'Consola de consulta', 'Bóveda de memorias'], desc: 'Gran archivo de datos de la Arq Grid.' }),
        L('null_refinery', 'Refinería Null', 2000, 5200, 110, 'factory', I, { interior: true, fac: 'enemy', props: ['Línea de refinado de datos', 'Tanque de residuos', 'Oficina de capataz'], desc: 'Planta que procesa datos en bruto.' }),
        L('oasis_park', 'Oasis', 4300, 5900, 110, 'park', I, { fac: 'neutral', desc: 'Un parque de luz: el rincón tranquilo de la ciudad.' }),
        L('apartments_penthouse', 'Penthouse de los Apartamentos', 3300, 1700, 85, 'tower', I, { interior: true, solid: true, fac: 'neutral', props: ['Sala de Weaver', 'Mesa de negocios de datos', 'Balcón'], desc: 'Donde Weaver, la corredora de datos, hace sus tratos.' }),
        L('core_hq', 'Cuartel del Core', 6100, 1800, 110, 'tower', C, { interior: true, solid: true, fac: 'enemy', props: ['Sala de mando del Core', 'Armería', 'Celdas'], desc: 'Sede de los guardianes que gobiernan la Arq Grid.' }),
        L('flynns_arcade_arq', 'Flynn\'s Arcade (reconstrucción)', 1300, 2600, 80, 'arcade', I, { interior: true, fac: 'ally', props: ['Cabina de Light Cycles', 'Cabina de Space Paranoids', 'Terminal secreto'], desc: 'Una reconstrucción del arcade de Flynn dentro de la Arq Grid.' }),
        L('race_arq', 'Circuito de Vertical Slice', 4700, 4100, 95, 'startline', C, { fac: 'neutral', act: { type: 'race', track: 'arq' }, desc: 'Carrera de mensajeros por los distritos.' }),
        L('glitch_rift', 'Grieta de Glitch', 6500, 6300, 120, 'pit', C, { fac: 'enemy', desc: 'Una zona donde el tiempo se repite: la Arq Grid pierde estabilidad.' }),
        L('process_control_room', 'Sala de Control de Procesos de Mr. R', 700, 6900, 55, 'secret', 'Original del juego', { interior: true, hidden: true, fac: 'neutral', desc: 'Entre las tuberías de la Refinería hay una puerta oculta: allí trabaja Mr. R.' })
    ];
    TG.PORTALS['arq'] = [{ x: 1000, y: 1560, to: '2025', name: 'Portal al Servidor ARQ (Grid 2025)', color: '#FF1744' }];
    TG.PORTALS['2025'].push({ x: 8000, y: 6260, to: 'arq', name: 'Portal a la Arq Grid', color: '#B58CFF' });
    TG.LOCATIONS['r1982'] = moved.map(l => { l.x = { flynns_arcade: 1500, encom_laser_lab: 3400, dillinger_office: 4500 }[l.id]; l.y = { flynns_arcade: 2900, encom_laser_lab: 1400, dillinger_office: 1000 }[l.id]; return l; }).concat([
        L('encom_hq', 'Sede de ENCOM', 3900, 1750, 150, 'rwtower', 'Tron (1982)', { solid: true, fac: 'neutral', desc: 'El rascacielos de ENCOM, donde Dillinger y Gibbs trabajan.' }),
        L('arcade_street', 'Calle de los Arcades', 2400, 3000, 110, 'block', AMB, { fac: 'neutral', desc: 'Una calle ochentera con salas recreativas y neones.' }),
        L('diner_82', 'Cafetería "La Vuelta"', 800, 1600, 80, 'shop', AMB, { interior: true, fac: 'neutral', props: ['Barra', 'Máquina de discos', 'Mesa del fondo'], desc: 'Cafetería de barrio.' }),
        L('record_shop_82', 'Tienda de Discos', 2600, 1200, 70, 'shop', AMB, { interior: true, fac: 'neutral', props: ['Estantes de vinilos', 'Mostrador'], desc: 'Música de los ochenta.' }),
        L('encom_garage_82', 'Garaje de ENCOM', 5100, 2800, 90, 'garage', AMB, { interior: true, fac: 'neutral', props: ['Coches de ejecutivos', 'Oficina del vigilante'], desc: 'Garaje subterráneo de la empresa.' })
    ]);
    TG.PORTALS['r1982'] = [{ x: 3400, y: 1650, to: '1982', name: 'Láser de Digitalización (a la Grid ENCOM 1982)', color: '#00D4FF' }];
    TG.PORTALS['1982'].push({ x: 11200, y: 3400, to: 'r1982', name: 'Haz de la Torre I/O (al mundo real 1982)', color: '#FFB347' }, { x: 5600, y: 2000, to: '2003', name: 'Portal a la Red ENCOM-fCon 2003', color: '#7DFF6A' });
    TG.LOCATIONS['r2010'] = [
        L('flynns_arcade_r10', 'Flynn\'s Arcade (cerrado)', 3000, 3000, 85, 'arcade', 'Tron: Legacy', { interior: true, fac: 'ally', props: ['Cabina de Space Paranoids', 'Cabina de Tron', 'Cabina de Light Cycles', 'Puerta del sótano'], desc: 'Cerrado desde 1989; en el fondo hay un pasaje al sótano de Flynn.' }),
        L('flynn_basement_r10', 'Sótano de Flynn (láser)', 3000, 3350, 70, 'lab', 'Tron: Legacy', { interior: true, fac: 'ally', props: ['Láser del Portal', 'Servidor privado', 'Mesa de trabajo'], desc: 'El laboratorio oculto con el láser que lleva a la Grid.' }),
        L('encom_tower_r10', 'Torre ENCOM', 4800, 1700, 130, 'rwtower', 'Tron: Legacy', { interior: true, solid: true, fac: 'neutral', props: ['Sala de juntas de ENCOM', 'Oficina del presidente', 'Servidores'], desc: 'Aquí se reúne la junta de accionistas.' }),
        L('alan_house_r10', 'Casa de Alan Bradley', 1500, 1500, 80, 'house', 'Tron: Legacy', { interior: true, fac: 'ally', props: ['Despacho de Alan', 'Salón', 'Teléfono de 1989'], desc: 'Donde Alan recibe un mensaje desde el arcade.' }),
        L('sam_loft_r10', 'Hogar de Sam (ambientación)', 5000, 4400, 80, 'house', AMB, { interior: true, fac: 'neutral', props: ['Moto de Sam', 'Mesa de hacker', 'Cama'], desc: 'El refugio de Sam Flynn en la ciudad.' }),
        L('harbor_r10', 'Muelle de la Ciudad', 900, 4600, 100, 'dock', AMB, { fac: 'neutral', desc: 'Puerto de la ciudad.' }),
        L('highway_r10', 'Autopista de la Ciudad', 3000, 5000, 140, 'highway', AMB, { arena: 'cycle', fac: 'neutral', desc: 'Una autopista larga para carreras de moto.' })
    ];
    TG.PORTALS['r2010'] = [{ x: 3000, y: 3560, to: '2010', name: 'Láser del Sótano (al Portal de la Grid 2010)', color: '#19F0FF' }];
    TG.PORTALS['2010'].push({ x: 17200, y: 5980, to: 'r2010', name: 'El Portal (salida al mundo real 2010)', color: '#9FD8FF' });
    TG.PORTALS['2010'][2].x = 8600; TG.PORTALS['2010'][2].y = 3200;
    TG.LOCATIONS['r2025'] = [
        L('dillinger_hq_r', 'Sede de Dillinger Systems', 2200, 1700, 130, 'rwtower', 'Tron: Ares', { interior: true, solid: true, fac: 'enemy', props: ['Sala de la junta', 'Laboratorio de impresión', 'Despacho de Julian', 'Servidor de Ares'], desc: 'La torre corporativa de Julian Dillinger.' }),
        L('materialization_lab_r', 'Laboratorio de Materialización', 2200, 2400, 80, 'lab', 'Tron: Ares', { interior: true, fac: 'enemy', props: ['Láser de partículas', 'Cápsula de impresión', 'Terminal de Athena'], desc: 'Donde se imprimen los programas en el mundo real.' }),
        L('encom_tower_r25', 'Torre ENCOM', 4600, 2000, 120, 'rwtower', 'Tron: Ares', { interior: true, solid: true, fac: 'ally', props: ['Oficina de Eve Kim', 'Oficina original de Flynn', 'Sala de Ajay y Seth'], desc: 'Sede de ENCOM, con la oficina de Flynn preservada.' }),
        L('highway_bridge_r25', 'Puente de la Autopista', 3400, 4000, 160, 'highway', 'Tron: Ares', { arena: 'cycle', fac: 'neutral', desc: 'Puentes y calles de Vancouver donde se libra la persecución de ciclos.' }),
        L('harbor_r25', 'Puerto de la Ciudad', 5200, 5000, 100, 'dock', AMB, { fac: 'neutral', desc: 'Puerto de la ciudad.' })
    ];
    TG.PORTALS['r2025'] = [{ x: 2200, y: 2600, to: '2025', name: 'Láser de Partículas (a la Grid de Dillinger 2025)', color: '#FF1744' }];
    TG.PORTALS['2025'].push({ x: 4600, y: 6700, to: 'r2025', name: 'Puerto de Materialización (al mundo real 2025)', color: '#FF5C7C' });
    TG.TRACKS = {
        r82: { loc: 'race_82', rx: 1300, ry: 800, n: 10, laps: 2, name: 'Rejilla Exterior', fee: 40 }, tron_city: { loc: 'race_tron_city', rx: 1500, ry: 1000, n: 12, laps: 2, name: 'Tron City', fee: 60 },
        outlands: { loc: 'race_outlands', rx: 2600, ry: 1500, n: 14, laps: 1, name: 'Tierras Lejanas', fee: 80 }, argon: { loc: 'race_argon', rx: 1100, ry: 700, n: 10, laps: 3, name: 'Rally de Argón', fee: 50 },
        dillinger: { loc: 'race_2025', rx: 1400, ry: 900, n: 12, laps: 2, name: 'Circuito Dillinger', fee: 60 }, mercury: { loc: 'race_2003', rx: 1200, ry: 800, n: 10, laps: 2, name: 'Circuito de Mercury', fee: 40 },
        arq: { loc: 'race_arq', rx: 1400, ry: 1000, n: 12, laps: 2, name: 'Vertical Slice', fee: 60 }
    };
    TG.reindexLocations = function () { TG.locById = {}; TG.totalLocations = 0; for (const era of Object.keys(TG.LOCATIONS)) for (const l of TG.LOCATIONS[era]) { l.era = era; TG.locById[l.id] = l; TG.totalLocations++; } };
    TG.reindexLocations();
    TG.WORLD_ORDER = ['1982', 'r1982', '2003', '2010', 'r2010', '2025', 'r2025', 'arq'];
})(window.TG = window.TG || {});
