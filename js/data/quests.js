/* ==========================================================================
   TRON: LAS TRES GRIDS — data/quests.js
   Misiones como datos. Tipos de paso:
     visit {loc} · talk {npc} · kill {n, spawn?} · arena {mode} · cycle {dist}
     grid {to} · bits {n} · minigame {id}
     cnodes · cpylons {n} · cprobes {n}          (cadena de Mr. C)
     puzzle {kind, n} · bounce {n}               (cadena de Mr. L)
   `reward.fx` se resuelve en systems.js (TG.REWARD_FX).
   ========================================================================== */
(function (TG) {
    'use strict';

    const Q = (id, title, giver, grid, desc, steps, reward, o = {}) => Object.assign({ id, title, giver, grid, desc, steps, reward, requires: [], special: false }, o);
    const R = (bits, fx, text) => ({ bits, fx, text });

    TG.QUESTS = {};
    const add = (q) => { TG.QUESTS[q.id] = q; };

    // ------------------------------------------------------------- Línea de Tron (original del juego)
    add(Q('tron_1', 'Entrenamiento Tron I: Reflejos', 'tron_82', '1982', 'Afina tus reflejos derrotando a un guardia con tu disco.',
        [{ type: 'kill', n: 1, spawn: { name: 'Guardia de Práctica', count: 1 }, text: 'Derrota a 1 guardia' }], R(200, 'dodge10', '200 Bits + 10% de velocidad')));
    add(Q('tron_2', 'Entrenamiento Tron II: Duelo Gladiatorial', 'beck_2010', '2010', 'Gana un duelo de discos en una arena.',
        [{ type: 'arena', mode: 'disc', text: 'Gana un duelo de discos' }], R(300, 'dmg15', '300 Bits + 15% de daño')));
    add(Q('tron_3', 'Entrenamiento Tron III: La Prueba de Rinzler', 'rinzler_2010', '2010', 'Demuestra tu maniobrabilidad: recorre distancia sobre un ciclo de luz.',
        [{ type: 'cycle', dist: 4000, text: 'Recorre 4000 m en ciclo de luz' }], R(400, null, '400 Bits')));
    add(Q('tron_4', 'Entrenamiento Tron IV: Resistencia en Argón', 'able_2010', '2010', 'Visita el Taller de Able y habla con Mara.',
        [{ type: 'visit', loc: 'able_garage', text: 'Entra al Taller de Able' }, { type: 'talk', npc: 'mara_2010', text: 'Habla con Mara' }], R(500, 'res20', '500 Bits + 20% de resistencia')));
    add(Q('tron_5', 'El Legado de Rinzler: Doble Disco', 'tron_82', '1982', 'Completa los cuatro entrenamientos y derrota a cinco enemigos.',
        [{ type: 'kill', n: 5, spawn: { name: 'Gladiador del MCP', count: 5 }, text: 'Derrota a 5 gladiadores' }], R(0, 'dualDisc', '🔓 DOBLE DISCO (clic derecho)'),
        { requires: ['tron_1', 'tron_2', 'tron_3', 'tron_4'] }));

    // ------------------------------------------------------------- Línea del Código de Permanencia (original del juego)
    add(Q('perm_1', 'Código de Permanencia I: Rumores en Alaska', 'eve_kim', '2025', 'Visita el viejo Puesto de Flynn en Alaska, donde Eve halló la pista.',
        [{ type: 'visit', loc: 'flynn_alaska_outpost', text: 'Entra al Puesto de Flynn en Alaska' }], R(300, null, '300 Bits')));
    add(Q('perm_2', 'Código de Permanencia II: La Oficina de Flynn', 'flynn_echo', '2025', 'Entra a la oficina preservada de Flynn en la Torre ENCOM.',
        [{ type: 'visit', loc: 'encom_tower_office', text: 'Entra a la Oficina Original de Flynn' }], R(500, 'frag1', '500 Bits + Fragmento 1/2')));
    add(Q('perm_3', 'Código de Permanencia III: Athena', 'athena_2025', '2025', 'Confronta a una réplica de Athena para obtener el código maestro.',
        [{ type: 'kill', n: 1, spawn: { name: 'Réplica de Athena', count: 1, hp: 140 }, text: 'Derrota a la réplica de Athena' }], R(800, 'frag2', '800 Bits + Fragmento 2/2'), { requires: ['perm_2'] }));
    add(Q('perm_4', 'Código de Permanencia IV: Inmunidad Digital', 'ares_2025', '2025', 'Ensambla los fragmentos en el Puerto de Materialización.',
        [{ type: 'visit', loc: 'materialization_port', text: 'Llega al Puerto de Materialización' }], R(0, 'permanence', '✨ CÓDIGO DE PERMANENCIA (inmunidad a la degradación)'), { requires: ['perm_2', 'perm_3'] }));

    // ------------------------------------------------------------- Misiones nuevas por Grid
    add(Q('g82_scrap', 'Puerta Trasera', 'flynn_82', '1982', 'Flynn rescató un Recognizer averiado en la chatarrería. Revisa el lugar.',
        [{ type: 'visit', loc: 'recognizer_scrap_82', text: 'Llega a la Chatarrería de Recognizers' }], R(150, null, '150 Bits')));
    add(Q('g82_msg', 'Mensaje a los Usuarios', 'yori_82', '1982', 'Lleva el pedido de Yori hasta la Torre I/O y habla con Dumont.',
        [{ type: 'visit', loc: 'io_tower_82', text: 'Entra a la Torre I/O' }, { type: 'talk', npc: 'dumont_82', text: 'Habla con Dumont' }], R(250, 'res10', '250 Bits + 10% de resistencia')));
    add(Q('g82_ram', 'Aritmética del Gladiador', 'ram_82', '1982', 'Ram quiere comprobar su estadística: gana un duelo de discos.',
        [{ type: 'arena', mode: 'disc', text: 'Gana un duelo de discos' }], R(300, 'atk10', '300 Bits + 10% de ataque')));
    add(Q('g82_mesa', 'Mirada al Núcleo', 'dumont_82', '1982', 'Dumont quiere saber cómo luce la Mesa del Núcleo.',
        [{ type: 'visit', loc: 'mesa_82', text: 'Llega a la Mesa del Núcleo' }], R(200, null, '200 Bits')));
    add(Q('g82_dillinger', 'Pruebas contra Dillinger', 'kleinberg_82', '1982', 'Roy sospecha de Dillinger. Visita su oficina y escucha lo que dice.',
        [{ type: 'visit', loc: 'dillinger_office', text: 'Entra a la Oficina de Dillinger' }, { type: 'talk', npc: 'dillinger_82', text: 'Habla con Ed Dillinger' }], R(200, null, '200 Bits')));

    add(Q('g10_tunnel', 'Ruta de los Túneles', 'mara_2010', '2010', 'Mara quiere saber si los Túneles de Argón siguen abiertos.',
        [{ type: 'visit', loc: 'argon_tunnels', text: 'Llega a los Túneles de Argón' }], R(200, 'speed5', '200 Bits + 5% de velocidad')));
    add(Q('g10_purgos', 'Dyson en Purgos', 'able_2010', '2010', 'Able sospecha del proyecto secreto de Dyson en Purgos.',
        [{ type: 'visit', loc: 'purgos_factory', text: 'Entra a la Fábrica Secreta de Dyson' }], R(350, null, '350 Bits')));
    add(Q('g10_portal', 'Un Amanecer Prestado', 'quorra_2010', '2010', 'Quorra sueña con el Portal. Ve a verlo por ella.',
        [{ type: 'visit', loc: 'portal_2010', text: 'Entra a la Cámara del Portal' }], R(300, null, '300 Bits')));
    add(Q('g10_disc', 'El Disco de mi Padre', 'sam_flynn', '2010', 'Sam necesita cobertura: despeja a los Guardias Negros cercanos.',
        [{ type: 'kill', n: 4, spawn: { name: 'Guardia Negro', count: 4 }, text: 'Derrota a 4 Guardias Negros' }], R(450, 'dmg15', '450 Bits + 15% de daño')));
    add(Q('g10_gorn', 'Memoria a Medida', 'gorn_2010', '2010', 'Gorn necesita datos de la Instalación de Reprogramación.',
        [{ type: 'visit', loc: 'repurposing_facility', text: 'Entra a la Instalación de Reprogramación' }], R(300, null, '300 Bits')));
    add(Q('g10_drill', 'Lección de Tron', 'tron_2010', '2010', 'Tron quiere que inspecciones el Taladro de Energía bajo Argón.',
        [{ type: 'visit', loc: 'energy_drill', text: 'Llega al Taladro de Energía' }], R(400, 'res10', '400 Bits + 10% de resistencia')));
    add(Q('g10_bismuth', 'Hasta Bismuth', 'ada_2010', '2010', 'Ada pide que busques a Keller en la estación de Bismuth.',
        [{ type: 'visit', loc: 'bismuth_station', text: 'Llega a la Estación de Bismuth' }, { type: 'talk', npc: 'keller_2010', text: 'Habla con Keller' }], R(250, null, '250 Bits')));
    add(Q('g10_end', 'Camino a la Armería', 'gem_2010', '2010', 'Gem quiere que recorras la Ciudad de Tron hasta la Armería.',
        [{ type: 'visit', loc: 'armory_2010', text: 'Entra a La Armería' }], R(200, null, '200 Bits')));

    add(Q('g25_server', 'Servidor Blindado', 'ajay_2025', '2025', 'Ajay necesita saber cómo está el núcleo del servidor de Dillinger.',
        [{ type: 'visit', loc: 'dillinger_server_core', text: 'Entra al Núcleo del Servidor Dillinger' }], R(300, null, '300 Bits')));
    add(Q('g25_highway', 'Fuga por la Autopista', 'seth_2025', '2025', 'Revive la persecución: gana una carrera de ciclos en la Autopista del Mundo Real.',
        [{ type: 'arena', mode: 'cycle', text: 'Gana una batalla de ciclos' }], R(400, 'speed5', '400 Bits + 5% de velocidad')));
    add(Q('g25_family', 'Cuentas de Familia', 'elisabeth_2025', '2025', 'Elisabeth pide que hables con su hijo Julian.',
        [{ type: 'talk', npc: 'julian_dillinger', text: 'Habla con Julian Dillinger' }], R(250, null, '250 Bits')));

    add(Q('grids_tour', 'Viajero de Grids', 'flynn_82', '1982', 'Cruza los portales: visita la Grid de Flynn (2010) y la de Dillinger (2025).',
        [{ type: 'grid', to: '2010', text: 'Viaja a la Grid de Flynn 2010' }, { type: 'grid', to: '2025', text: 'Viaja a la Grid de Dillinger 2025' }], R(600, 'speed5', '600 Bits + 5% de velocidad')));

    // ------------------------------------------------------------- Mr. U — La Última Cabalgata
    add(Q('mru_ride', 'La Última Cabalgata', 'mr_u', 'any', 'Mr. U te invita a una última cabalgata al anochecer: dos motos, un solo camino, estelas de fuego.',
        [{ type: 'minigame', id: 'ghost_ride', text: 'Completa la cabalgata junto a Mr. U' }],
        R(0, 'mrUBike', '🔥 LA BICICLETA DE MR. U (el ciclo de luz más rápido, con estela de fuego)'), { special: true }));

    // ------------------------------------------------------------- Mr. C — Maestría Electrostática (Grid 1982)
    add(Q('mrc_1', 'Mr. C · Ley del Equilibrio', 'mr_c', '1982', 'En la estática, un cuerpo en reposo está en equilibrio. Quédate quieto en los tres nodos hasta que se carguen.',
        [{ type: 'cnodes', text: 'Carga los 3 nodos quedándote quieto sobre cada uno' }], R(300, null, '300 Bits'), { special: true }));
    add(Q('mrc_2', 'Mr. C · Carga del Condensador', 'mr_c', '1982', 'La electricidad necesita un condensador. Golpea los tres pilones con tu disco para cargarlos.',
        [{ type: 'cpylons', n: 3, text: 'Golpea los 3 pilones con tu disco' }], R(400, null, '400 Bits'), { special: true, requires: ['mrc_1'] }));
    add(Q('mrc_3', 'Mr. C · Descarga Controlada', 'mr_c', '1982', 'Destruye cuatro sondas estáticas y vuelve con Mr. C: tendrás la Maestría Electrostática.',
        [{ type: 'cprobes', n: 4, text: 'Destruye 4 sondas estáticas' }, { type: 'talk', npc: 'mr_c', text: 'Vuelve con Mr. C' }],
        R(0, 'staticMastery', '⚡ MAESTRÍA ELECTROSTÁTICA (carga estática en reposo + disco eléctrico en cadena)'), { special: true, requires: ['mrc_2'] }));

    // ------------------------------------------------------------- Mr. L — Mente Analítica (Grid 2010, Outlands)
    add(Q('mrl_1', 'Mr. L · Matemática: Secuencias', 'mr_l', '2010', 'Resuelve tres problemas de matemática: secuencias, ecuaciones y geometría.',
        [{ type: 'puzzle', kind: 'math', n: 3, text: 'Resuelve 3 problemas de matemática' }], R(300, null, '300 Bits'), { special: true }));
    add(Q('mrl_2', 'Mr. L · Física: Rebote Perfecto', 'mr_l', '2010', 'En física, el ángulo de incidencia es igual al de reflexión. Acierta tres blancos con discos que hayan rebotado.',
        [{ type: 'bounce', n: 3, text: 'Acierta 3 blancos con rebote' }], R(400, null, '400 Bits'), { special: true, requires: ['mrl_1'] }));
    add(Q('mrl_3', 'Mr. L · Electricidad: Circuitos', 'mr_l', '2010', 'Resuelve tres problemas de circuitos eléctricos (Ley de Ohm, serie y paralelo) y vuelve con Mr. L.',
        [{ type: 'puzzle', kind: 'ohm', n: 3, text: 'Resuelve 3 problemas de circuitos' }, { type: 'talk', npc: 'mr_l', text: 'Vuelve con Mr. L' }],
        R(0, 'analyticMind', '📐 MENTE ANALÍTICA (proyección balística + rebotes perfectos + inducción magnética)'), { special: true, requires: ['mrl_2'] }));

    // Misiones iniciales (aceptadas automáticamente al empezar)
    TG.AUTO_QUESTS = ['tron_1'];

    // Índices
    TG.questsByGiver = {};
    for (const q of Object.values(TG.QUESTS)) (TG.questsByGiver[q.giver] = TG.questsByGiver[q.giver] || []).push(q.id);

})(window.TG = window.TG || {});
