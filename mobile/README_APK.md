# Cómo crear el APK de teléfono

El juego es **JavaScript puro**; el APK es un envoltorio (Capacitor) que lo abre a pantalla completa. El APK no se puede compilar ni firmar desde el chat (hace falta el SDK de Android), así que tienes 3 caminos:

## Camino 0 — sin APK: instalarlo como app (PWA)
1. Sirve `build/mobile/www` (o la carpeta del juego) por HTTPS o por tu red (`python3 server/npc_ai_server.py --lan`).
2. En el teléfono abre la dirección en Chrome → menú ⋮ → **Instalar aplicación / Añadir a pantalla de inicio**. Se abre a pantalla completa y funciona sin conexión.

## Camino 1 — APK en la nube con GitHub Actions (sin instalar nada)
1. Sube esta carpeta del proyecto a un repositorio de GitHub.
2. Pestaña **Actions → "Android APK" → Run workflow**.
3. Al terminar, descarga el artefacto **tron-las-grids-debug-apk** (APK de depuración: instálalo activando «instalar apps desconocidas»).

## Camino 2 — en tu PC con Android Studio
```bash
python3 tools/build.py            # genera build/mobile/www
cd build/mobile
npm install
npx cap add android
npx cap sync android
npx cap open android              # Android Studio -> Build > Build APK(s)
```
Para bloquear la pantalla en horizontal: en `android/app/src/main/AndroidManifest.xml` añade a `<activity ...>` el atributo `android:screenOrientation="sensorLandscape"`.

## IA de los NPC en el teléfono
Python no corre en el teléfono. Dentro del juego abre **⚙ Ajustes de IA** y elige:
* **Directo**: pega tu clave de Gemini / OpenAI / DeepSeek / Claude (se guarda solo en el teléfono).
* **Servidor**: escribe la URL de tu PC, p. ej. `http://192.168.1.20:8765`.
Sin nada de eso, los NPC responden con sus frases propias.
