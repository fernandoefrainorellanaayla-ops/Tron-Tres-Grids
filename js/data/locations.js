/* ==========================================================================
   TRON: LAS TRES GRIDS — data/locations.js
   Todos los lugares de Tron (1982), Tron: Legacy (2010), Tron: Uprising (2012)
   y Tron: Ares (2025). Cada lugar indica su fuente en `src`.
   ========================================================================== */
(function (TG) {
    'use strict';

    const T82 = 'Tron (1982)', TL = 'Tron: Legacy', TU = 'Tron: Uprising', TA = 'Tron: Ares', JG = 'Original del juego';

    TG.GRIDS = {
        '1982': {
            era: '1982', name: 'ENCOM 1982', full: 'Grid ENCOM · Sistema del MCP (1982)', w: 4400, h: 4400,
            color: '#00D4FF', accent: '#FF8A00', danger: '#FF4A1A', spawn: { x: 420, y: 740 },
            regions: [{ type: 'sea', rect: [3300, 0, 4400, 4400], label: 'MAR DE SIMULACIÓN' }]
        },
        '2010': {
            era: '2010', name: 'Flynn 2010', full: 'Grid de Flynn · Sistema Tron (Legacy / Uprising)', w: 5600, h: 5600,
            color: '#19F0FF', accent: '#FF9A1F', danger: '#FF7A00', spawn: { x: 2800, y: 3200 },
            regions: [
                { type: 'sea', rect: [4700, 0, 5600, 2900], label: 'MAR DE SIMULACIÓN' },
                { type: 'outlands', rect: [0, 3950, 5600, 5600], label: 'LAS OUTLANDS' }
            ]
        },
        '2025': {
            era: '2025', name: 'Dillinger 2025', full: 'Grid de Dillinger · Dillinger Systems (Ares)', w: 4600, h: 4600,
            color: '#FF1744', accent: '#FFFFFF', danger: '#FF1744', spawn: { x: 700, y: 1020 },
            regions: []
        }
    };

    // L(id, nombre, x, y, radio, tipo, fuente, opciones)
    const L = (id, name, x, y, r, kind, src, o = {}) => Object.assign({ id, name, x, y, r, kind, src, interior: false }, o);

    TG.LOCATIONS = {
        '1982': [
            L('flynns_arcade', 'Flynn\'s Arcade', 500, 500, 70, 'arcade', T82, { interior: true, fac: 'ally', desc: 'El arcade de Kevin Flynn en el mundo real. Aquí se digitaliza al usuario.' }),
            L('encom_laser_lab', 'Laboratorio Láser de ENCOM', 900, 380, 70, 'lab', T82, { interior: true, fac: 'ally', desc: 'Sala del láser de digitalización creado por Gibbs y Lora.' }),
            L('dillinger_office', 'Oficina de Ed Dillinger', 1300, 330, 65, 'office', T82, { interior: true, fac: 'enemy', desc: 'Despacho del ejecutivo que robó los juegos de Flynn.' }),
            L('prison_cells_82', 'Celdas de los Juegos', 1500, 900, 80, 'prison', T82, { interior: true, fac: 'enemy', desc: 'Donde el MCP encierra a los programas entre partidas.' }),
            L('game_grid_82', 'Game Grid', 900, 1200, 110, 'arena', T82, { arena: 'both', fac: 'enemy', desc: 'El gran coliseo digital del MCP: discos y ciclos de luz.' }),
            L('disc_arena_82', 'Arena de Discos (Jai Alai)', 1600, 1500, 110, 'ring', T82, { arena: 'disc', fac: 'enemy', desc: 'Plataformas concéntricas: el duelo de Flynn contra Crom.' }),
            L('light_cycle_arena_82', 'Arena de Ciclos de Luz', 700, 1900, 125, 'cycle_arena', T82, { arena: 'cycle', fac: 'enemy', desc: 'La Light Cycle Grid: muros de luz y giros a 90°.' }),
            L('tank_maze_82', 'Laberinto de Tanques', 500, 2600, 100, 'maze', T82, { interior: true, fac: 'enemy', desc: 'Circuito de combate de los tanques de batalla.' }),
            L('recognizer_scrap_82', 'Chatarrería de Recognizers', 1800, 2300, 110, 'scrap', T82, { fac: 'neutral', desc: 'Restos de Recognizers; Flynn rescató uno aquí.' }),
            L('io_tower_82', 'Torre I/O', 2800, 800, 90, 'tower', T82, { interior: true, solid: true, fac: 'ally', desc: 'Torre de entrada/salida guardada por Dumont.' }),
            L('sailer_chamber_82', 'Cámara del Solar Sailer', 2400, 1500, 90, 'chamber', T82, { interior: true, fac: 'ally', desc: 'Cámara de simulación donde se construye el Solar Sailer.' }),
            L('sailer_dock_82', 'Muelle de Solar Sailer', 3150, 1500, 60, 'dock', T82, { dock: true, fac: 'ally', desc: 'Sube al Solar Sailer con [V].' }),
            L('sark_carrier_82', 'Portaaviones de Sark', 2300, 3000, 140, 'carrier', T82, { interior: true, fac: 'enemy', desc: 'La nave de mando móvil del comandante Sark.' }),
            L('mcp_tower', 'Cono del MCP', 3100, 3600, 120, 'cone', T82, { interior: true, solid: true, fac: 'enemy', desc: 'El núcleo del Programa de Control Maestro.' }),
            L('mesa_82', 'Mesa del Núcleo', 1700, 3700, 130, 'mesa', T82, { fac: 'neutral', desc: 'Meseta donde Tron y Sark libran su duelo final.' }),
            L('mr_c_chamber', 'Cámara de Mr. C', 4280, 760, 55, 'secret', JG, { interior: true, hidden: true, fac: 'neutral', desc: 'Un muro falso oculta al programa experto en estática.' })
        ],
        '2010': [
            // --- Tron: Legacy
            L('tron_city_2010', 'Ciudad de Tron', 2800, 2600, 170, 'city', TL, { fac: 'enemy', desc: 'Capital de la Grid bajo el mando de Clu.' }),
            L('flynns_arcade_2010', 'Flynn\'s Arcade (Grid)', 2800, 3050, 70, 'arcade', TL, { interior: true, fac: 'ally', desc: 'Réplica del arcade; lugar de llegada de Flynn a la Grid.' }),
            L('flynn_lab_2010', 'Laboratorio Secreto de Flynn', 3150, 3250, 60, 'lab', TL, { interior: true, fac: 'ally', desc: 'Sótano del arcade con el láser que abrió el Portal.' }),
            L('armory_2010', 'La Armería', 2400, 2950, 80, 'armory', TL, { interior: true, shop: 'armory', fac: 'enemy', desc: 'Donde los programas capturados reciben traje y disco.' }),
            L('light_cycle_grid_2010', 'Light Cycle Grid', 2000, 2300, 140, 'cycle_arena', TL, { arena: 'cycle', fac: 'enemy', desc: 'Arena de ciclos con rampas y cubiertas.' }),
            L('game_arena_2010', 'Game Arena (Discos)', 3500, 2300, 130, 'arena', TL, { arena: 'disc', fac: 'enemy', desc: 'La arena de Disc Wars de Tron City.' }),
            L('end_of_line', 'Club End of Line', 2800, 1850, 90, 'club', TL, { interior: true, fac: 'neutral', desc: 'La torre más alta de Tron City. Dueño: Castor/Zuse.' }),
            L('iso_city', 'Ciudad ISO (ruinas)', 3350, 2850, 120, 'ruins', TL, { fac: 'neutral', desc: 'Barrio de los ISO junto a Tron City, arrasado en la Purga.' }),
            L('sailer_station_2010', 'Estación de Solar Sailer', 3900, 2700, 65, 'dock', TL, { dock: true, fac: 'ally', desc: 'Línea directa hacia el Portal. Sube con [V].' }),
            L('portal_2010', 'El Portal', 4300, 1500, 90, 'gate', TL, { interior: true, fac: 'ally', desc: 'La salida de la Grid hacia el mundo real.' }),
            L('arjia_city', 'Ciudad de Arjia', 4200, 2000, 110, 'city', JG, { fac: 'neutral', desc: 'Gran asentamiento ISO en el Nexo del Flujo de Código.' }),
            L('rectifier', 'La Rectifier', 4600, 3500, 170, 'carrier', TL, { interior: true, fac: 'enemy', desc: 'Portaaviones de Clu para invadir el mundo real.' }),
            L('throne_ship', 'Nave del Trono de Clu', 4200, 3800, 110, 'ship', TL, { interior: true, fac: 'enemy', desc: 'Nave de mando que se acopla a la Rectifier.' }),
            // --- Tron: Uprising (sector de Argón)
            L('argon_city', 'Ciudad de Argón', 1100, 1000, 160, 'city', TU, { fac: 'neutral', desc: 'Puerto remoto con el mejor sistema de Light Rail de la Grid.' }),
            L('able_garage', 'Taller de Able', 1450, 1280, 70, 'garage', TU, { interior: true, shop: 'able', fac: 'ally', desc: 'Garaje de Able, donde trabajan Beck, Zed, Mara y Link.' }),
            L('argon_coliseum', 'Coliseo de Argón', 800, 1550, 130, 'coliseum', TU, { arena: 'both', fac: 'enemy', desc: 'Arena circular de Tesler: castigo mortal para disidentes.' }),
            L('argon_park', 'Parque de Argón', 1500, 700, 90, 'park', TU, { fac: 'neutral', desc: 'Zona de recreo y estación de Light Rail exprés a Purgos.' }),
            L('argon_refuel_tower', 'Torre de Reabastecimiento', 500, 800, 80, 'tower', TU, { solid: true, fac: 'neutral', desc: 'Torre de recarga de energía de Argón.' }),
            L('argon_square', 'Plaza de Argón', 1150, 1550, 90, 'plaza', TU, { fac: 'neutral', desc: 'Plaza central; escenario de discursos y de la bruma viral.' }),
            L('argon_docks', 'Muelles de Argón', 350, 1250, 90, 'dock', TU, { dock: true, fac: 'neutral', desc: 'Puerto con botes de luz. Sube con [V].' }),
            L('argon_tunnels', 'Túneles de Argón', 1800, 1750, 90, 'tunnel', TU, { fac: 'neutral', desc: 'Circuito subterráneo de carreras de ciclos.' }),
            L('club_0001001', 'Club 0001001', 1800, 1050, 70, 'club', TU, { interior: true, fac: 'neutral', desc: 'Club de Argón donde se vigila y arresta a sospechosos.' }),
            L('bismuth_station', 'Estación de Bismuth', 2000, 500, 80, 'station', TU, { fac: 'neutral', desc: 'Estación de Light Rail de la gran metrópoli de Bismuth.' }),
            L('tesler_command_ship', 'Nave de Mando de Tesler', 350, 400, 120, 'ship', TU, { interior: true, fac: 'enemy', desc: 'Centro de la Ocupación sobre Argón.' }),
            L('energy_drill', 'Taladro de Energía', 1500, 2250, 80, 'drill', TU, { fac: 'enemy', desc: 'Máquina que drena la energía de Argón.' }),
            L('purgos', 'Purgos', 600, 2500, 130, 'city', TU, { fac: 'neutral', desc: 'Asentamiento original junto a Argón; el barrio pobre.' }),
            L('purgos_alley', 'Callejón de Purgos', 950, 2750, 70, 'alley', TU, { interior: true, fac: 'neutral', desc: 'Casa de empeño y taller clandestino de Gorn.' }),
            L('purgos_factory', 'Fábrica Secreta de Dyson', 500, 3100, 110, 'factory', TU, { interior: true, fac: 'enemy', desc: 'Proyecto secreto de Clu supervisado por Dyson.' }),
            L('repurposing_facility', 'Instalación de Reprogramación', 1350, 3100, 100, 'facility', TU, { interior: true, fac: 'enemy', desc: 'Donde Dyson reprogramó a los programas leales a Tron.' }),
            // --- Outlands
            L('flynn_safehouse', 'Refugio de Kevin Flynn', 1200, 4700, 80, 'safehouse', TL, { interior: true, fac: 'ally', desc: 'El escondite de Flynn en las Outlands.' }),
            L('bostrum_colonies', 'Colonias Bostrum', 3600, 4800, 100, 'city', JG, { fac: 'neutral', desc: 'Colonia ISO establecida en las Outlands.' }),
            L('gallium', 'Gallium', 800, 4300, 100, 'city', TU, { fac: 'neutral', desc: 'Pequeña ciudad en el fondo de las Outlands.' }),
            L('tron_safehouse_uprising', 'Refugio de Tron (cumbre nevada)', 350, 4900, 90, 'snowpeak', TU, { interior: true, fac: 'ally', desc: 'Base secreta de Tron en un pico nevado.' }),
            L('pit_prison', 'Prisión de Espacio Comprimido', 2200, 5200, 90, 'pit', TU, { fac: 'enemy', desc: 'Foso que oculta una prisión secreta, en el camino a Gallium.' }),
            L('mr_l_observatory', 'Observatorio de Mr. L', 5000, 5000, 90, 'observatory', JG, { interior: true, hidden: true, fac: 'neutral', desc: 'Un observatorio oculto en el fin de las Outlands.' })
        ],
        '2025': [
            L('ares_training', 'Campo de Entrenamiento de Ares', 700, 800, 90, 'arena', JG, { fac: 'enemy', desc: 'Donde Dillinger prueba a sus soldados digitales.' }),
            L('dillinger_systems_hq', 'Sede de Dillinger Systems', 1500, 600, 90, 'office', TA, { interior: true, fac: 'enemy', desc: 'Cuartel corporativo de Julian Dillinger.' }),
            L('elisabeth_office', 'Oficina de Elisabeth Dillinger', 1850, 950, 60, 'office', TA, { interior: true, fac: 'enemy', desc: 'Despacho de la exdirectora de Dillinger Systems.' }),
            L('dillinger_tower', 'Torre Dillinger Systems', 2400, 600, 110, 'tower', TA, { interior: true, solid: true, fac: 'enemy', shop: 'julian', desc: 'La torre de la Grid de Dillinger.' }),
            L('permanence_lab', 'Laboratorio de Permanencia', 3700, 800, 80, 'lab', JG, { interior: true, fac: 'ally', desc: 'Investigación del Código de Permanencia.' }),
            L('lightcycle_bay_2025', 'Garaje de Ciclos de Dillinger', 3400, 1400, 90, 'garage', TA, { interior: true, fac: 'enemy', desc: 'Hangar de los ciclos que cruzan al mundo real.' }),
            L('ares_arena', 'Arena de Combate de Ares', 800, 1800, 120, 'arena', JG, { arena: 'both', fac: 'enemy', desc: 'Arena de discos y ciclos de la Grid Dillinger.' }),
            L('dillinger_grid_city', 'Ciudad de la Grid Dillinger', 2300, 1700, 170, 'city', TA, { fac: 'enemy', desc: 'Metrópolis digital que Athena sobrevuela con un Recognizer.' }),
            L('recognizer_bay_2025', 'Hangar de Super Recognizers', 1500, 2400, 110, 'hangar', TA, { interior: true, fac: 'enemy', desc: 'Donde se imprimen los Recognizers mejorados.' }),
            L('dillinger_server_core', 'Núcleo del Servidor Dillinger', 3600, 2400, 100, 'core', TA, { interior: true, fac: 'enemy', desc: 'Los servidores donde se restauran los programas.' }),
            L('vancouver_streets', 'Autopista del Mundo Real', 3300, 3200, 150, 'highway', TA, { arena: 'cycle', fac: 'neutral', desc: 'Calles y puentes donde Ares y Athena persiguen a Eve.' }),
            L('materialization_port', 'Puerto de Materialización', 2300, 3200, 100, 'pad', TA, { fac: 'enemy', desc: 'Donde la Grid imprime objetos en el mundo físico.' }),
            L('encom_grid_2025', 'Grid ENCOM', 800, 3400, 110, 'city', TA, { fac: 'ally', desc: 'La Grid digital de ENCOM, atacada por Julian.' }),
            L('encom_tower_office', 'Oficina Preservada de Flynn', 1500, 3900, 80, 'office', TA, { interior: true, fac: 'ally', desc: 'En la Torre ENCOM: el láser de partículas sube a Ares a la Grid original.' }),
            L('flynn_alaska_outpost', 'Puesto de Flynn en Alaska', 3800, 3900, 90, 'outpost', TA, { interior: true, fac: 'ally', desc: 'Antiguo taller de Flynn donde Eve halló el Código de Permanencia.' }),
            L('flynn_original_grid_gate', 'Puerta a la Grid Original de Flynn', 2300, 4200, 80, 'gate', TA, { fac: 'ally', desc: 'Acceso a la Grid de 1982, preservada.' }),
            L('arq_server', 'Servidor ARQ de Flynn', 4000, 3000, 85, 'server', JG, { interior: true, fac: 'ally', desc: 'Respaldo de ISOs y memorias de Flynn.' }),
            L('sailer_dock_2025', 'Muelle de Solar Sailer', 4200, 4200, 55, 'dock', JG, { dock: true, fac: 'neutral', desc: 'Sube al Solar Sailer con [V].' })
        ]
    };

    TG.PORTALS = {
        '1982': [
            { x: 2300, y: 650, to: '2010', name: 'Portal a la Grid de Flynn 2010', color: '#19F0FF' },
            { x: 1000, y: 3400, to: '2025', name: 'Portal a la Grid de Dillinger 2025', color: '#FF1744' }
        ],
        '2010': [
            { x: 3000, y: 1100, to: '1982', name: 'Portal a la Grid ENCOM 1982', color: '#00D4FF' },
            { x: 4000, y: 4600, to: '2025', name: 'Portal a la Grid de Dillinger 2025', color: '#FF1744' }
        ],
        '2025': [
            { x: 2300, y: 4330, to: '1982', name: 'Portal a la Grid Original (1982)', color: '#00D4FF' },
            { x: 4100, y: 1400, to: '2010', name: 'Portal a la Grid de Flynn 2010', color: '#19F0FF' }
        ]
    };

    TG.locById = {};
    for (const era of Object.keys(TG.LOCATIONS)) for (const l of TG.LOCATIONS[era]) { l.era = era; TG.locById[l.id] = l; }

    // Total de lugares visitables (para el Atlas)
    TG.totalLocations = Object.values(TG.LOCATIONS).reduce((n, a) => n + a.length, 0);

    // Nombre legible de cada era
    TG.ERA_NAME = { '1982': 'Grid ENCOM 1982', '2010': 'Grid de Flynn 2010', '2025': 'Grid de Dillinger 2025' };

})(window.TG = window.TG || {});
