# TRON · Las Grids

Juego de exploración basado en **Tron (1982)**, **Tron: Legacy (2010)**, **Tron: Uprising (2012)** y **Tron: Ares (2025)**, con contenido de **Tron 2.0, Tron: Evolution, Tron: Identity, Tron: Catalyst** y el cómic **Tron: Betrayal** (cada fuente está marcada en el Atlas; Tron 2.0 está en continuidad alternativa).

**Lenguajes:** el juego es **JavaScript puro** (Canvas 2D y WebAudio, sin motor ni librerías) + **HTML/CSS**. **Python** (solo biblioteca estándar) únicamente para el servidor de IA de los NPC. El APK de teléfono se envuelve con **Capacitor**.

---------------------------------------------------------------------------

## 1) ¿Qué hay que instalar?

| Para qué | Qué necesitas |
|---|---|
| Jugar | **Nada.** Un navegador moderno (Chrome, Edge o Firefox). |
| IA de los NPC en PC | **Python 3.9+** (https://www.python.org/downloads/, en Windows marca *Add python.exe to PATH*). Ningún paquete extra. |
| IA en la nube (opcional) | Una clave de API de Gemini, Claude, DeepSeek u OpenAI. |
| IA local gratis (opcional) | `pip install llama-cpp-python` y `python server/descargar_modelo.py` (~1 GB). |
| IA **sin Python** (teléfono o PC) | Nada: abre **⚙ Ajustes de IA** y pega tu clave (modo *Directo*). |

Sin ninguna IA el juego funciona igual: los NPC responden con frases propias de su personaje.

## 2) Cómo iniciar

* **Windows:** doble clic en `iniciar.bat` → `http://localhost:8765/`. **Linux/macOS:** `./iniciar.sh`.
* **Desde el teléfono (misma Wi-Fi):** `python server/npc_ai_server.py --lan` y abre la dirección que muestra en el teléfono.
* **Dos versiones desde el mismo código:** `python tools/build.py` genera `build/web` (solo controles de PC) y `build/mobile/www` (controles táctiles, PWA y gráficos algo más ligeros). Para el **APK** mira `mobile/README_APK.md`.

## 3) Configurar la IA de los NPC (elige UNA opción)

**A. Nube con servidor Python.** Copia `server/config.local.bat.example` a `server/config.local.bat`, quita el `REM` de tu proveedor y pega la clave. La clave se queda en tu PC y nunca llega al navegador.
**B. Modelo local.** `pip install llama-cpp-python` y `python server/descargar_modelo.py` (Qwen2.5-1.5B-Instruct, Apache-2.0).
**C. Sin Python (directo).** En el juego: **⚙ Ajustes de IA → Directo**, elige proveedor, pega tu clave y (opcional) el modelo. Se guarda solo en ese dispositivo. Alternativa: **Servidor**, escribiendo la URL de tu PC (`http://192.168.x.x:8765`).
**D. Avanzado.** `server/config.example.json` → `server/config.json` (`llama_cpp`, `anthropic`, `gemini`, `openai_compat`, `mock`). Los nombres de modelo cambian con el tiempo: si tu proveedor rechaza uno, cámbialo.

## 4) Controles

| PC | Acción |
|---|---|
| WASD | Moverse · **SHIFT** Esquiva Táctica (tras ganarla) |
| Clic / ESPACIO | Lanzar disco (clic der.: segundo disco) |
| E | Interactuar (hablar, entrar, portales, arenas; mantener E para hackear) |
| V | Montar / bajar del ciclo de luz · ← → ↑ ↓ conducir |
| Q diario · M atlas · I mejoras · **K contactos (amigos)** · **P Disco de Salto** | 1-4 consumibles · **Y** Reescritura · **F** Jaula de Faraday · **H** Inyección de Script · B bloom · X sonido |
| Tab (en la terminal) | Escritura automática |

**Teléfono:** joystick izquierdo, botón **DISCO** (apunta solo al enemigo más cercano; también puedes tocar la pantalla), E, CICLO, botones de habilidades (aparecen al desbloquearlas), y barra superior MISIONES / MAPA / 🛒 / ♥ / ✕. La terminal de la intro escribe sola.

## 5) Historia y misiones

El diario (Q) separa **★ Historia principal** y **Secundarias/Especiales**. La dificultad empieza en **Normal** (se puede elegir Fácil/Difícil) y la **Amenaza** sube poco a poco con la historia y el tiempo de juego.

**Arco de Flynn y Tron** (principal):
1. **Grid 1982:** *Un Usuario en el Sistema* (Tron te da la **Esquiva Táctica**), *Muros de Luz* (**Protocolo de Seguridad**, pasiva) y *El Mensaje de Flynn* (**Reescritura**, tecla Y: convierte a un enemigo en aliado 12 s).
2. **Grid de Flynn (2010, antes de la traición):** Flynn, Tron y Clu viven en una Grid luminosa. Clu va **probando cosas** (sensores de perfección, el milagro de los ISO, toques de queda y centinelas, las pruebas de Tron) y la Grid se va llenando de estandartes y líneas naranjas.
3. **La Traición de Clu:** combates **codo con codo con Tron**. Después **la Grid de 2010 cambia**: sigue siendo la misma Grid, pero con la presencia de Clu en todas partes (Guardias Negros, Recognizers naranjas, tinte cálido). Todas las misiones de 2010 (Uprising, Legacy, Evolution) se desbloquean **después**.
4. **El Exilio de Flynn:** escoltas a Flynn hasta su refugio y te entrega el **Disco de Salto** (tecla P): viaja entre Grids y mundos reales ya visitados (3 cargas, 1 carga cada 75 s, no se puede usar en combate ni en interiores). *El Último Deber de Tron* lo esconde en su cueva.
5. Después: acto de Dillinger (Código de Permanencia, mundo real con límite de tiempo) y acto de la **Arq Grid**.

Las misiones tienen temporizadores, jefes, escoltas, defensa de zonas, recolección, hackeo, válvulas, bobinas, carreras… Si se agota el tiempo, el objetivo se reinicia.

## 6) Programas especiales y sus habilidades

| Programa | Dónde | Habilidad |
|---|---|---|
| **Mr. U** | Aparece al azar en cualquier mapa | Minijuego «Ghost Rider» → **Bicicleta de Mr. U** (ciclo 16, estela de fuego) |
| **Mr. C** (cola de caballo y lentes) | Grid 1982, cámara secreta del mar | **Maestría Electrostática**: carga estática, −40% daño, disco eléctrico |
| **Mr. L** (bigote y lentes) | Grid 2010, observatorio en las Outlands | **Mente Analítica**: proyección balística, 4 rebotes, inducción |
| **Mr. E** (lentes) | Red ENCOM-fCon 2003, Sala de Transformadores | **Jaula de Faraday** (F): 6 s de campo eléctrico, −60% daño y descargas a los enemigos cercanos |
| **Mr. R** | Arq Grid, Sala de Control de Procesos | **Control PID**: regeneración proporcional a la vida perdida, daño amortiguado (derivativo) y vehículos estables |
| **Carlos Compiler** | Grid 2025, Sala de Compilación (oculta) | **Dominio del Código** (H): virus que daña y se contagia entre enemigos |

Detalle de **todos** los NPC (dónde aparecen y qué recompensa dan): `LISTADO_NPCS.md`.

## 7) Mundos, portales y digitalización

8 mapas: **Grid 1982**, **Red ENCOM-fCon 2003** (Tron 2.0), **Grid 2010**, **Grid 2025**, **Arq Grid** (Identity/Catalyst) y 3 **mundos reales** (1982, 2010 y 2025), cada uno con **su propia salida** (haz de la Torre I/O, el Portal del sótano de Flynn, el Puerto de Materialización). En el mundo real de 2025 tu programa tiene tiempo limitado, como en Ares, salvo que tengas el Código de Permanencia. Los mapas originales son el doble de grandes.
Antes de cruzar un portal tu programa **levanta el disco** bajo un haz de luz (como en los pósters de Tron y Legacy) y luego se **digitaliza con un efecto distinto por época**: escaneo láser (1982), cubos y vórtice (Legacy), láser de partículas que "imprime" la escena (Ares) y glitch (Arq).

## 8) Sistema económico
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


## 9) Compañeros

Habla con Tron, Beck, Quorra, Jet, Exo, Cass… para ganar amistad (≥25) y **invítalos con K** (máx. 2): te siguen a pie o en ciclo, luchan, comentan y puedes **ir juntos a un lugar**. En la Grid de 2010 tras la traición Tron "está muerto": se oculta en lugares públicos.

## 10) Estructura

```
index.html · iniciar.bat/.sh · LISTADO_NPCS.md · manifest.webmanifest · sw.js · build-config.js
css/  main hud menus dialogs mobile          js/   core platform difficulty fx gfx_chars gfx_world entities
js/data/ locations expansion interiors npcs npcs2 quests story                 systems_combat systems_core
js/   missions companions abilities special market ui intro tutorial touch ai_direct main
minigames/ghost-ride.html     server/ npc_ai_server.py ai_providers.py descargar_modelo.py     tools/ build.py make_listing.py
mobile/ (Capacitor + guía del APK)   .github/workflows/android.yml (APK en la nube)
```

## 11) Qué está y qué no (estado honesto)

**Probado en navegador automatizado:** arranque, intro y terminal, tutorial, los 8 mapas y 67 interiores, el arco de Flynn/Tron completo (incluida la traición, el exilio y el Disco de Salto), las cadenas de Carlos/Mr. E/Mr. R y sus habilidades, la animación del portal, los 4 estilos de digitalización, el guardado/carga, el mercado, la versión móvil (joystick, botones, terminal automática), la versión web sin táctil, la IA directa (con APIs **simuladas**) y el servidor con `--lan`.
**No probado (no puedo desde este entorno):** el APK real, llamadas reales a Gemini/OpenAI/DeepSeek/Claude, llama.cpp y la descarga del modelo, `iniciar.bat` en Windows y el rendimiento en una GPU o teléfono reales.
**Todavía NO incluido:** carreras con checkpoints, batallas de ciclos en arenas grandes con zoom y tanques, eventos aleatorios (fallas de la Grid, carreras/torneos ilegales con arresto), multitudes y vehículos ambientales, y el **multijugador en línea con crossplay**. Las `act:`/`arena:'tank'` de `js/data/expansion.js` ya marcan dónde irán.

## 12) Fuentes verificadas
Wikipedia: Tron: Betrayal, Tron: The Ghost in the Machine, Tron 2.0, Tron: Evolution, Tron: Identity/Catalyst, Tron: Legacy/Uprising/Ares y la lista de personajes de la franquicia; entrevistas y reseñas de Tron: Evolution (PSP/Battle Grids) para las actividades.
# Tron-Tres-Grids
