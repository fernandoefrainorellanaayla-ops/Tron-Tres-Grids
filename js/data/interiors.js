/* ==========================================================================
   TRON: LAS TRES GRIDS — data/interiors.js
   Interiores explorables. Elementos: B = caja, C = cilindro, K = núcleo de luz.
   La salida siempre está abajo al centro.
   ========================================================================== */
(function (TG) {
    'use strict';

    const B = (x, y, w, h, label, color, hgt) => ({ t: 'box', x, y, w, h, label, color, hgt });
    const C = (x, y, r, label, color, hgt) => ({ t: 'cyl', x, y, r, label, color, hgt });
    const K = (x, y, r, label, color) => ({ t: 'core', x, y, r, label, color });
    const I = (name, elements, o = {}) => Object.assign({ name, w: 1100, h: 850, elements }, o);

    TG.INTERIORS = {
        // ------------------------------------------------------------- 1982
        flynns_arcade: I('Flynn\'s Arcade (1982)', [
            B(120, 120, 90, 60, 'Space Paranoids', '#0b3a66'), B(260, 120, 90, 60, 'Matrix Blaster', '#0b3a66'),
            B(400, 120, 90, 60, 'Vice Squad', '#0b3a66'), B(540, 120, 90, 60, 'Light Cycles', '#0b3a66'),
            B(680, 120, 90, 60, 'TRON', '#124a80'), K(550, 430, 70, 'Haz del Cañón Láser', '#00D4FF'),
            B(850, 480, 170, 110, 'Terminal de Flynn', '#052238'), B(110, 420, 160, 90, 'Mostrador', '#10202e')
        ]),
        encom_laser_lab: I('Laboratorio Láser de ENCOM', [
            K(550, 330, 80, 'Cañón Láser de Digitalización', '#00D4FF'), B(150, 140, 200, 80, 'Consola de Gibbs', '#06304d'),
            B(780, 140, 200, 80, 'Consola de Lora', '#06304d'), B(170, 520, 160, 90, 'Escritorio de Alan', '#0a2233'),
            B(800, 520, 160, 90, 'Banco de Pruebas', '#0a2233')
        ]),
        dillinger_office: I('Oficina de Ed Dillinger', [
            B(380, 190, 320, 110, 'Escritorio de Dillinger', '#3a1608', 40), B(110, 120, 150, 380, 'Archivo de Proyectos', '#2a1a10'),
            B(820, 140, 190, 90, 'Terminal del MCP', '#552200'), C(880, 520, 50, 'Maqueta de ENCOM', '#7a3a10')
        ]),
        prison_cells_82: I('Celdas de los Juegos', [
            B(100, 140, 190, 200, 'Celda de Ram', '#2a0a00'), B(350, 140, 190, 200, 'Celda de Flynn', '#2a0a00'),
            B(600, 140, 190, 200, 'Celda de Tron', '#2a0a00'), B(850, 140, 170, 200, 'Celda 4', '#2a0a00'),
            B(300, 470, 500, 60, 'Pasillo de Guardias Rojos', '#401500')
        ]),
        tank_maze_82: I('Laberinto de Tanques', [
            B(150, 150, 260, 36, '', '#082a40'), B(560, 150, 36, 280, '', '#082a40'), B(150, 330, 300, 36, '', '#082a40'),
            B(700, 260, 280, 36, '', '#082a40'), B(250, 520, 36, 200, '', '#082a40'), B(700, 520, 300, 36, '', '#082a40'),
            C(880, 150, 40, 'Tanque Rojo', '#a02800'), C(180, 440, 40, 'Tanque Azul', '#0a60b0')
        ]),
        io_tower_82: I('Santuario de la Torre I/O', [
            K(550, 300, 85, 'Haz de Transmisión a los Usuarios', '#FFD700'), B(430, 520, 240, 60, 'Pedestal de Dumont', '#6a5200'),
            C(180, 220, 45, 'Columna de Datos', '#6a5200'), C(920, 220, 45, 'Columna de Datos', '#6a5200')
        ]),
        sailer_chamber_82: I('Cámara del Solar Sailer', [
            B(330, 190, 440, 150, 'Solar Sailer en construcción', '#06304d', 50), B(110, 420, 190, 100, 'Consola de Simulación de Yori', '#0a2c44'),
            K(900, 300, 60, 'Emisor de Haz', '#00D4FF')
        ]),
        sark_carrier_82: I('Portaaviones de Sark', [
            B(380, 120, 340, 110, 'Puente de Mando', '#401000', 40), B(110, 300, 220, 120, 'Celdas de Reclutas', '#2a0a00'),
            B(770, 300, 220, 120, 'Hangar de Tanques', '#2a0a00'), C(550, 450, 60, 'Mesa de Estrategia de Sark', '#802800')
        ]),
        mcp_tower: I('Cono del MCP', [
            K(550, 270, 100, 'CARA VIRTUAL DEL MCP', '#FF2A00'), B(160, 520, 190, 90, 'Consola de Sark', '#520800'),
            B(750, 520, 190, 90, 'Celda de Desintegración', '#520800'), C(130, 260, 40, 'Nodo de Datos', '#520800'), C(970, 260, 40, 'Nodo de Datos', '#520800')
        ]),
        mr_c_chamber: I('Cámara Oculta de Mr. C', [
            K(550, 200, 60, 'Condensador Madre', '#7DFFFF')
        ], { w: 1100, h: 850, secret: true }),

        // ------------------------------------------------------------- 2010
        flynns_arcade_2010: I('Flynn\'s Arcade (Grid)', [
            B(120, 130, 90, 60, 'Space Paranoids', '#08323f'), B(270, 130, 90, 60, 'Tron', '#0b4455'),
            B(420, 130, 90, 60, 'Light Cycles', '#08323f'), B(570, 130, 90, 60, 'Stunt Cycle', '#08323f'),
            B(800, 160, 180, 110, 'Pasaje oculto al sótano', '#041c26'), K(550, 440, 70, 'Punto de llegada de Flynn', '#19F0FF')
        ]),
        flynn_lab_2010: I('Laboratorio Secreto de Flynn', [
            K(550, 280, 85, 'Láser del Portal', '#19F0FF'), B(140, 160, 220, 90, 'Servidor Privado de Flynn', '#06232c'),
            B(760, 160, 220, 90, 'Consola de Control', '#06232c'), B(150, 520, 200, 90, 'Mesa de Trabajo', '#08202a')
        ]),
        armory_2010: I('La Armería', [
            B(110, 150, 200, 100, 'Rack de Discos', '#2a1600'), B(800, 150, 200, 100, 'Estación de Trajes', '#2a1600'),
            C(550, 310, 85, 'Cámara de Procesamiento', '#a35a00'), B(120, 480, 220, 110, 'Banco de Armas', '#331c00'),
            B(780, 480, 220, 110, 'Taquilla de Programas', '#331c00')
        ]),
        end_of_line: I('Club End of Line', [
            B(420, 140, 260, 80, 'Cabina de DJ de Castor', '#6a4a00'), B(130, 330, 280, 130, 'Pista de Baile Iluminada', '#2c1d00'),
            B(700, 330, 280, 100, 'Bar de Cócteles Digitales', '#3a2700'), B(420, 560, 260, 90, 'Sillón VIP de Zuse', '#4a3200')
        ]),
        portal_2010: I('Cámara del Portal', [
            K(550, 330, 130, 'EL PORTAL', '#FFFFFF'), C(150, 200, 45, 'Pilar de Energía', '#0b4a52'), C(950, 200, 45, 'Pilar de Energía', '#0b4a52'),
            B(430, 560, 240, 60, 'Plataforma de Cruce', '#0b3a42')
        ]),
        rectifier: I('La Rectifier', [
            C(550, 320, 110, 'Fábrica Giratoria de Reprogramación', '#a35a00'), B(110, 130, 260, 90, 'Cubierta de Light Jets', '#3a2000'),
            B(730, 130, 260, 90, 'Cubierta de Light Fighters', '#3a2000'), B(420, 600, 260, 80, 'Torre de Acoplamiento', '#552e00')
        ]),
        throne_ship: I('Nave del Trono de Clu', [
            K(550, 260, 70, 'Interfaz del Disco de Flynn', '#FF9A1F'), B(380, 480, 340, 80, 'Trono de Clu', '#552a00'),
            C(160, 300, 45, 'Columna de Mando', '#552a00'), C(940, 300, 45, 'Columna de Mando', '#552a00')
        ]),
        able_garage: I('Taller de Able', [
            B(150, 150, 220, 120, 'Elevador de Ciclos 1', '#06424f'), B(720, 150, 220, 120, 'Elevador de Ciclos 2', '#06424f'),
            B(440, 330, 220, 90, 'Banco de Trabajo de Beck y Zed', '#042c36'), B(130, 520, 150, 190, 'Estantes de Herramientas', '#032430'),
            B(800, 480, 210, 110, 'Oficina de Able (Bit antiguo y ENCOM 786)', '#06323f')
        ]),
        club_0001001: I('Club 0001001', [
            B(420, 130, 260, 80, 'Escenario', '#40124a'), B(130, 320, 280, 120, 'Pista', '#220a28'),
            B(700, 320, 280, 100, 'Barra', '#30103a'), B(420, 540, 260, 80, 'Mesa de Interrogatorio', '#401050')
        ]),
        tesler_command_ship: I('Nave de Mando de Tesler', [
            B(380, 130, 340, 110, 'Puente de Mando', '#3a1500', 40), K(550, 400, 60, 'Mapa Táctico de Argón', '#FF9A1F'),
            B(110, 300, 200, 110, 'Celdas de Detenidos', '#2a0f00'), B(790, 300, 200, 110, 'Armería de la Ocupación', '#2a0f00')
        ]),
        purgos_alley: I('Callejón de Purgos', [
            B(130, 140, 280, 140, 'Casa de Empeño', '#2a1a40'), B(690, 140, 280, 140, 'Taller de Gorn (discos)', '#2a1a40'),
            C(550, 440, 60, 'Estación de Memoria', '#5a2a90')
        ]),
        purgos_factory: I('Fábrica Secreta de Dyson', [
            B(110, 150, 400, 70, 'Línea de Montaje A', '#3a1500'), B(590, 150, 400, 70, 'Línea de Montaje B', '#3a1500'),
            C(550, 380, 90, 'Núcleo del Proyecto de Clu', '#a35a00'), B(120, 520, 200, 100, 'Barraca de Obreros', '#2a1000')
        ]),
        repurposing_facility: I('Instalación de Reprogramación', [
            B(150, 150, 150, 220, 'Tanque de Reprogramación 1', '#3a1000'), B(475, 150, 150, 220, 'Tanque de Reprogramación 2', '#3a1000'),
            B(800, 150, 150, 220, 'Tanque de Reprogramación 3', '#3a1000'), B(380, 500, 340, 90, 'Mesa de Dyson', '#521a00')
        ]),
        flynn_safehouse: I('Refugio de Kevin Flynn', [
            B(400, 300, 220, 100, 'Mesa con Tablero de Go', '#3a3a3a'), B(130, 160, 160, 320, 'Estantería de Libros del Mundo Real', '#222222'),
            K(850, 400, 70, 'Zona de Meditación', '#FFFFFF'), B(700, 140, 260, 90, 'Cocina de Quorra', '#2a2a2a')
        ]),
        tron_safehouse_uprising: I('Refugio de Tron (cumbre nevada)', [
            B(140, 150, 260, 110, 'Consola Táctica de Tron', '#06323f'), K(780, 300, 70, 'Núcleo de Seguridad', '#19F0FF'),
            B(140, 480, 230, 110, 'Esterilla de Entrenamiento', '#0a2a36'), C(870, 560, 50, 'Disco de Respaldo', '#0a4a5a')
        ]),
        mr_l_observatory: I('Observatorio de Mr. L', [
            K(550, 190, 55, 'Telescopio de Datos', '#B9A7FF')
        ], { w: 1100, h: 850, secret: true }),


        carlos_compile_room: I('Sala de Compilación de Carlos', [K(550, 200, 60, 'Compilador Central', '#6AFFB0'), B(110, 150, 190, 80, 'Terminal A', '#06402a'), B(800, 150, 190, 80, 'Terminal B', '#06402a'), B(110, 470, 190, 80, 'Terminal C', '#06402a')], { secret: true }),
        transformer_hall: I('Sala de Transformadores de Mr. E', [K(550, 190, 60, 'Generador Principal', '#FFE45C'), C(130, 200, 45, 'Bobina 1', '#6a5a00', 60), C(970, 200, 45, 'Bobina 2', '#6a5a00', 60), C(130, 560, 45, 'Bobina 3', '#6a5a00', 60)], { secret: true }),
        process_control_room: I('Sala de Control de Procesos de Mr. R', [B(120, 140, 220, 90, 'Panel de Instrumentos', '#4a2a00'), B(780, 140, 220, 90, 'Sala de Control (SCADA)', '#4a2a00'), C(550, 190, 55, 'Tanque Principal', '#a35a00', 70), B(120, 480, 160, 80, 'Válvula Maestra', '#4a2a00')], { secret: true }),
        // ------------------------------------------------------------- 2025
        dillinger_systems_hq: I('Sede de Dillinger Systems', [
            B(380, 140, 340, 100, 'Sala de la Junta', '#400010', 40), K(550, 420, 70, 'Holograma de Ares', '#FF1744'),
            B(110, 300, 200, 110, 'Pantallas de Inversores', '#2a000a'), B(790, 300, 200, 110, 'Laboratorio de Impresión', '#2a000a')
        ]),
        elisabeth_office: I('Oficina de Elisabeth Dillinger', [
            B(380, 160, 340, 100, 'Escritorio de Elisabeth', '#3a0010', 40), B(120, 140, 160, 360, 'Archivo de Ed Dillinger', '#2a0008'),
            C(870, 360, 55, 'Retrato de la Familia', '#600018')
        ]),
        dillinger_tower: I('Torre Dillinger Systems', [
            K(550, 270, 95, 'Núcleo de Mando de Dillinger', '#FF1744'), B(130, 520, 220, 90, 'Terminal de Julian', '#520010'),
            B(750, 520, 220, 90, 'Sala de Control de Athena', '#520010')
        ]),
        permanence_lab: I('Laboratorio de Permanencia', [
            K(550, 250, 80, 'Cámara de Láser de Permanencia', '#FF1744'), B(160, 480, 230, 90, 'Terminal de Investigación de Eve Kim', '#40000e'),
            B(710, 480, 230, 90, 'Servidor de Muestras 3D', '#40000e')
        ]),
        lightcycle_bay_2025: I('Garaje de Ciclos de Dillinger', [
            B(130, 150, 240, 110, 'Rack de Ciclos A', '#400010'), B(730, 150, 240, 110, 'Rack de Ciclos B', '#400010'),
            C(550, 360, 80, 'Plataforma de Impresión', '#a0102a'), B(130, 520, 220, 100, 'Banco de Athena', '#2a000a')
        ]),
        recognizer_bay_2025: I('Hangar de Super Recognizers', [
            B(180, 140, 280, 150, 'Super Recognizer 1', '#40000e', 60), B(640, 140, 280, 150, 'Super Recognizer 2', '#40000e', 60),
            K(550, 470, 55, 'Impresora de Recognizers', '#FF1744')
        ]),
        dillinger_server_core: I('Núcleo del Servidor Dillinger', [
            K(550, 300, 100, 'Núcleo de Restauración de Programas', '#FF1744'), B(110, 160, 150, 280, 'Rack de Servidores', '#2a000a'),
            B(840, 160, 150, 280, 'Rack de Servidores', '#2a000a')
        ]),
        encom_tower_office: I('Oficina Original de Kevin Flynn', [
            B(380, 160, 340, 100, 'Escritorio de Flynn (preservado)', '#06304d', 40), K(550, 440, 65, 'Láser de Partículas', '#00D4FF'),
            B(120, 140, 160, 380, 'Estante de Disquetes', '#0a2233'), B(820, 160, 190, 110, 'Computadora de 1982', '#06304d')
        ]),
        flynn_alaska_outpost: I('Puesto de Flynn en Alaska', [
            B(380, 160, 340, 100, 'Computadora de Flynn', '#06304d', 40), B(120, 140, 200, 120, 'Taller de Madera', '#2a1f12'),
            C(850, 420, 60, 'Estufa', '#4a2a10'), B(140, 480, 240, 100, 'Mesa de Disquetes', '#0a2233')
        ]),
        arq_server: I('Servidor ARQ de Flynn', [
            K(550, 330, 95, 'Núcleo de Respaldo de ISOs', '#00D4FF'), B(120, 160, 160, 300, 'Rack de Memoria', '#06304d'),
            B(820, 160, 160, 300, 'Rack de Memoria', '#06304d')
        ])
    };

    // Interior genérico para cualquier lugar con `interior:true` que no tenga definición propia
    TG.getInterior = function (loc) {
        let def = TG.INTERIORS[loc.id];
        if (!def) {
            const pr = loc.props && loc.props.length ? loc.props : [loc.name], els = [], cols = ['#06304d', '#0a2c44', '#08323f', '#10202e'];
            pr.forEach((label, i) => { if (i % 5 === 4) els.push(K(200 + (i % 4) * 230, 330 + Math.floor(i / 4) * 40, 55, label, '#19F0FF')); else els.push(B(110 + (i % 4) * 250, 130 + Math.floor(i / 4) * 230, 210, 90, label, cols[i % 4], 42)); });
            els.push(K(550, 470, 55, 'Núcleo de energía', '#19F0FF'));
            def = I(loc.name, els);
            TG.INTERIORS[loc.id] = def;
        }
        def.id = loc.id; def.era = loc.era; def.loc = loc;
        def.exit = { x: def.w / 2, y: def.h - 60, r: 38 };
        def.entry = { x: def.w / 2, y: def.h - 150 };
        return def;
    };

})(window.TG = window.TG || {});
