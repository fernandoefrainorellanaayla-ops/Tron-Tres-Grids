# TRON · Las Grids

Juego de exploración basado en **Tron (1982)**, **Tron: Legacy (2010)**, **Tron: Uprising**, **Tron: Ares (2025)** y contenido de **Tron 2.0, Tron: Evolution, Tron: Identity, Tron: Catalyst** y el cómic **Tron: Betrayal** (cada fuente está marcada en el Atlas; Tron 2.0 está en continuidad alternativa).

**Lenguajes:** el juego es **JavaScript puro** (Canvas 2D y WebAudio, sin motor ni librerías) + **HTML/CSS**. **Python** (solo biblioteca estándar) para el servidor de IA de los NPC y el relé de multijugador. El APK de teléfono se envuelve con **Capacitor**.

---------------------------------------------------------------------------

## 1) ¿Qué hay que instalar?

| Para qué | Qué necesitas |
|---|---|
| Jugar | **Nada.** Un navegador moderno (Chrome, Edge o Firefox). |
| IA de los NPC y multijugador en PC | **Python 3.9+** (https://www.python.org/downloads/, en Windows marca *Add python.exe to PATH*). Ningún paquete extra. |
| IA en la nube (opcional) | Una clave de API de Gemini, Claude, DeepSeek u OpenAI. |
| IA local gratis (opcional) | `pip install llama-cpp-python` y `python server/descargar_modelo.py` (~1 GB). |
| IA **sin Python** (teléfono o PC) | Nada: abre **⚙ Ajustes de IA** y pega tu clave (modo *Directo*). |
| APK de Android | Cuenta de GitHub (el workflow lo compila en la nube) o Android Studio. Ver `mobile/README_APK.md`. |

Sin ninguna IA el juego funciona igual: los NPC responden con frases propias de su personaje.

## 2) Cómo iniciar

* **Windows:** doble clic en `iniciar.bat` → `http://localhost:8765/`. **Linux/macOS:** `./iniciar.sh`.
* **Desde el teléfono (misma Wi-Fi):** `python server/npc_ai_server.py --lan` y abre la dirección que muestra en el teléfono.
* **Dos versiones desde el mismo código:** `python tools/build.py` genera `build/web` (solo controles de PC) y `build/mobile/www` (controles táctiles, PWA, gráficos algo más ligeros) listas para publicar o para Capacitor.

## 3) Configurar la IA de los NPC (elige UNA opción)

**A. Nube con servidor Python.** Copia `server/config.local.bat.example` a `server/config.local.bat`, quita el `REM` de tu proveedor y pega la clave. La clave se queda en tu PC y nunca llega al navegador.
**B. Modelo local.** `pip install llama-cpp-python` y `python server/descargar_modelo.py` (Qwen2.5-1.5B-Instruct, Apache-2.0).
**C. Sin Python (directo).** **⚙ Ajustes de IA → Directo**: elige proveedor, pega tu clave y (opcional) el modelo. Se guarda solo en ese dispositivo. Alternativa: **Servidor**, escribiendo la URL de tu PC (`http://192.168.x.x:8765`).
**D. Avanzado.** `server/config.example.json` → `server/config.json`.

> **Gemini:** Google retira modelos con el tiempo (`gemini-2.5-flash` se cerró a finales de 2026). El juego usa por defecto `gemini-flash-lite-latest` y, si el modelo falla (404/503/400), **consulta la lista de modelos de tu clave y elige uno válido automáticamente**. Si algo falla, el estado de IA muestra el **error real** (clave inválida, sin cuota, etc.).

## 4) Controles

| PC | Acción |
|---|---|
| WASD | Moverse · **SHIFT** Esquiva Táctica (tras ganarla) |
| Clic / ESPACIO | Lanzar disco (clic der.: segundo disco) · en tanques: disparar |
| E | Interactuar (hablar, entrar, portales, arenas, carreras; mantener E para hackear o reparar) |
| V | Montar / bajar del ciclo de luz · ← → ↑ ↓ conducir |
| Q diario · M atlas · I mejoras · **K contactos (amigos)** · **P Disco de Salto** · **O multijugador** | 1-4 consumibles · **Y** Reescritura · **F** Jaula de Faraday · **H** Inyección de Script · B bloom · X sonido |
| Tab (en la terminal de la intro) | Escritura automática |

**Teléfono:** joystick izquierdo, botón **DISCO** (apunta solo al enemigo más cercano; también puedes tocar la pantalla), E, CICLO, botones de habilidades (aparecen al desbloquearlas) y barra superior MISIONES / MAPA / 🛒 / ♥ / 🌐 / ✕. La terminal de la intro escribe sola. El minijuego de Mr. U se juega **dentro del juego** con botones táctiles (▲▼ carriles, ◀▶ distancia, 🔥 llama).

## 5) Historia y misiones

El diario (Q) separa **★ Historia principal** y **Secundarias/Especiales**. La dificultad empieza en **Normal** (se puede elegir Fácil/Difícil) y la **Amenaza** sube poco a poco con la historia y el tiempo de juego. Si una misión está bloqueada, el NPC la muestra con 🔒 y te dice qué te falta.

**Arco de Flynn y Tron** (principal):
1. **Grid 1982:** *Un Usuario en el Sistema* (Tron te da la **Esquiva Táctica**), *Muros de Luz* (**Protocolo de Seguridad**, pasiva) y *El Mensaje de Flynn* (**Reescritura**, tecla Y: convierte a un enemigo en aliado 12 s).
2. **Grid de Flynn (2010, antes de la traición):** Flynn, Tron y Clu en una Grid luminosa. Clu va **probando cosas** (sensores, el milagro de los ISO, toques de queda y centinelas, las pruebas de Tron) y la Grid se llena de estandartes y líneas naranjas.
3. **La Traición de Clu:** combates **codo con codo con Tron**. Después **la Grid de 2010 cambia**: la misma Grid, pero con la presencia de Clu en todas partes. Las misiones de Uprising/Legacy/Evolution de 2010 se desbloquean **después** (las de los programas especiales, como Mr. L, **no** dependen de esto).
4. **El Exilio de Flynn:** escoltas a Flynn y te entrega el **Disco de Salto** (tecla P): viaja entre Grids y mundos reales ya visitados (3 cargas, 1 cada 75 s; no en combate ni en interiores). *El Último Deber de Tron* lo esconde en su cueva.
5. Después: acto de Dillinger (Código de Permanencia, mundo real con límite de tiempo) y acto de la **Arq Grid**.

Las misiones tienen temporizadores, jefes, escoltas, defensa de zonas, recolección, hackeo, válvulas, bobinas, carreras y batallas. Si se agota el tiempo, el objetivo se reinicia.

## 6) Programas especiales y sus habilidades

| Programa | Dónde | Habilidad |
|---|---|---|
| **Mr. U** | Aparece al azar en cualquier mapa | Minijuego «Ghost Rider» → **Bicicleta de Mr. U** (ciclo 16, estela de fuego) |
| **Mr. C** (cola de caballo y lentes) | Grid 1982, cámara secreta del mar | **Maestría Electrostática** |
| **Mr. L** (bigote y lentes) | Grid 2010, observatorio en las Outlands | **Mente Analítica** (3 misiones: desafíos de matemática, 3 blancos con rebote, circuitos y **volver a hablar con Mr. L** para recibirla) |
| **Mr. E** (lentes) | Red ENCOM-fCon 2003, Sala de Transformadores | **Jaula de Faraday** (F) |
| **Mr. R** | Arq Grid, Sala de Control de Procesos | **Control PID** (pasiva) |
| **Carlos Compiler** | Grid 2025, Sala de Compilación (oculta) | **Dominio del Código** (H) |

Todos los NPC, dónde aparecen y qué recompensa dan: `LISTADO_NPCS.md`.

## 7) Mundos, actividades y eventos

* **8 mapas:** Grid 1982, Red ENCOM-fCon 2003 (Tron 2.0), Grid 2010, Grid 2025, Arq Grid (Identity/Catalyst) y 3 **mundos reales** (1982, 2010, 2025) con su propia salida. Antes de cruzar un portal tu programa **levanta el disco** bajo un haz de luz y luego se **digitaliza con un efecto distinto por época** (escaneo láser, cubos y vórtice, láser de partículas, glitch).
* **Carreras de ciclos** (7 circuitos con checkpoints, vueltas, rivales con IA, premios por puesto y apuestas) en las líneas de salida del mapa (🏁).
* **Batallas de ciclos en arena grande** (≈7 veces más espacio, con zoom): **clásica** (giros de 90°) y **libre** (las estelas se desvanecen).
* **Batalla de tanques** (3 oleadas, muros, tanques ligeros y pesados; en táctil apunta solo).
* **Eventos aleatorios con aviso en pantalla:** *Falla de la Grid* (partes del suelo se caen; repara el nodo manteniendo E), *Carrera ilegal* (únete o mira), *Torneo ilegal de discos* (participa o mira) y **redadas**: si te atrapan puedes **pagar la multa o aceptar la anulación**; *Apagón*.
* **Mundo con vida:** ciudadanos que pasean y ciclos que circulan.
* **Compañeros (K):** invita hasta 2 amigos (Tron, Beck, Quorra, Jet, Exo…): te siguen a pie o en ciclo, luchan, comentan y puedes ir juntos a un lugar. En la Grid 2010 tras la traición Tron "está muerto" y se oculta en lugares públicos.

## 8) Multijugador en línea con crossplay (PC + teléfono)

1. En la PC: `python server/npc_ai_server.py --lan` (abre también el relé de multijugador en el puerto siguiente, p. ej. 8766).
2. Cada jugador abre el juego (PC o teléfono) y pulsa **🌐** (o la tecla **O**). Uno pulsa **CREAR SALA** y comparte el código de 5 letras; el otro escribe el código y pulsa **UNIRSE**. La dirección por defecto es `ws://<tu-servidor>:<puerto+1>`; en la app de Android escribe la dirección de tu PC (p. ej. `ws://192.168.1.20:8766`).
3. Os veis en el mismo mapa (con nombre y forma/color), podéis **chatear**, mandar emotes y usar **IR CON** para encontraros aunque estéis en mapas o interiores distintos.
Cada uno conserva su propia partida; el relé solo comparte posición, apariencia y chat. Para jugar por Internet (no solo en la misma Wi-Fi) necesitas que el puerto sea alcanzable (túnel, p. ej. Cloudflare Tunnel, o un servidor alojado) y añadir el dominio a `allowed_hosts` en `server/config.json`. **Seguridad del relé:** solo orígenes permitidos, máx. 8 jugadores por sala, mensajes ≤ 2 KB y límite de velocidad.

## 9) Sistema económico
Los **bits** (◈) se ganan al derrotar enemigos, recoger bits (lluvias de bits, drops), ganar arenas (+200 duelo / +250 ciclos), completar misiones y apostando. Se gastan en:

* **Terminal de Mejoras** (tecla **I** o botón 🛒; no disponible durante el entrenamiento ni en pleno combate):
  * **9 mejoras por niveles** (precio = base × 1,6 por cada nivel): Vitalidad, Potencia del Disco, Propulsores, Blindaje, Retorno del Disco, Regeneración, Motor del Ciclo, Botín (+% bits) e Imán de Datos (radio de recogida).
  * **Estilo**: estela del ciclo (blanca, oro, vacío, arcoíris, infierno), estilo de disco (doble anillo, hoja hexagonal, llama, iónico), aura (chispas, voxels, órbita, pulso) y color de acento. Se compran una vez y se equipan cuando quieras.
  * **Consumibles** (máx. 9 de cada uno, teclas **1-4**): Cápsula de Energía (+60 % vida), Pulso EMP (aturde y daña en 450 px), Escudo de Fase (invulnerable 6 s) y Amplificador de Bits (×2 durante 60 s).
  * **Oferta relámpago**: cada 150 s un artículo al azar baja un 25 %.
  * **Estadísticas**: bits ganados/gastados, enemigos, mejoras, estilos y apuestas.
* **Apuestas en las arenas** (50 / 100 / 250 ◈): si ganas recibes el doble; si pierdes o abandonas, lo pierdes.
* **Tiendas de los NPC** (Yori, Sark, Able, Julian, Eve, la Armería): artículos propios que se suman a lo anterior.

Todo se guarda con la partida.



## 10) Versión de teléfono y APK

La interfaz táctil está **diseñada aparte** (menú compacto, ventanas desplazables, avisos pequeños que no tapan los botones; probada en 667×375, 844×390 y 932×430). Como app: icono y pantalla de inicio, pantalla completa, bloqueo horizontal, pantalla encendida y vibración al recibir daño.
**Sin conexión:** el minijuego se carga en memoria al abrir el juego y un *service worker* guarda todos los archivos (PWA; requiere https o localhost). En el **APK** los archivos van dentro de la app, así que todo funciona sin internet salvo la IA y el multijugador. Guía paso a paso: `mobile/README_APK.md` (PWA, GitHub Actions o Android Studio).

## 11) Estructura

```
index.html · iniciar.bat/.sh · LISTADO_NPCS.md · manifest.webmanifest · sw.js · build-config.js
css/   main hud menus dialogs mobile            js/   core platform difficulty fx gfx_chars gfx_world entities
js/data/ locations expansion interiors npcs npcs2 quests story        systems_combat systems_core
js/    missions activities life companions abilities multiplayer special market ui intro tutorial touch ai_direct main
minigames/ghost-ride.html   server/ npc_ai_server.py ai_providers.py mp_relay.py descargar_modelo.py   tools/ build.py make_listing.py
mobile/ (Capacitor + guía del APK)  assets/ (icono y splash)  .github/workflows/android.yml
```

## 12) Qué está y qué no (estado honesto)

**Probado en navegador automatizado:** arranque, intro y terminal, tutorial, los 8 mapas y 67 interiores, el arco de Flynn/Tron completo (traición, exilio y Disco de Salto), las cadenas de Mr. L, Mr. C, Carlos, Mr. E y Mr. R, la animación del portal, los 4 estilos de digitalización, carreras, arenas grandes, tanques, fallas, apagón, carreras/torneos ilegales con redada y arresto, ciudadanos, guardado/carga, mercado, la versión móvil (en 3 tamaños de teléfono, minijuego táctil y sin conexión), la IA directa (con APIs **simuladas**, incluida la detección automática del modelo de Gemini) y el multijugador (dos clientes + pruebas de seguridad del relé).
**No probado (no puedo desde este entorno):** el APK real (compilación y firma), llamadas reales a Gemini/OpenAI/DeepSeek/Claude, llama.cpp y la descarga del modelo, `iniciar.bat` en Windows, el rendimiento y el tamaño de los botones en un teléfono real, y el multijugador por Internet fuera de la red local.
**Límites actuales:** en multijugador solo se comparten posición, chat y emotes (las carreras, eventos y misiones son individuales); no están las actividades HyperBall, Light Runners ni Recognizer Run de Tron: Evolution.

## 13) Fuentes verificadas
Wikipedia: Tron: Betrayal, Tron: The Ghost in the Machine, Tron 2.0, Tron: Evolution, Tron: Identity/Catalyst, Tron: Legacy/Uprising/Ares y la lista de personajes de la franquicia; entrevistas y reseñas de Tron: Evolution (PSP/Battle Grids) para las actividades; documentación y avisos de Google sobre el retiro de modelos de Gemini.
