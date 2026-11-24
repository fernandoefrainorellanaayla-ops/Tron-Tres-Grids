#!/usr/bin/env python3
"""Genera las DOS versiones del juego desde el mismo código:
   build/web/         -> versión de página web (solo controles de PC)
   build/mobile/www/  -> versión de teléfono (controles táctiles, PWA, gráficos algo más ligeros) lista para Capacitor
Uso:  python3 tools/build.py"""
import os, re, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, 'build')
COMMON = ['index.html', 'build-config.js', 'css', 'js', 'minigames']; MOBILE_ONLY = ['manifest.webmanifest', 'sw.js', 'icons']
def copy(dst, items):
    for it in items:
        s = os.path.join(ROOT, it); d = os.path.join(dst, it)
        if os.path.isdir(s): shutil.copytree(s, d, ignore=shutil.ignore_patterns('__pycache__'))
        elif os.path.exists(s): os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(s, d)
def write(p, t): open(p, 'w', encoding='utf-8').write(t)
shutil.rmtree(OUT, ignore_errors=True)
web = os.path.join(OUT, 'web'); copy(web, COMMON); write(os.path.join(web, 'build-config.js'), "window.TRON_BUILD = 'web';\n")
idx = open(os.path.join(web, 'index.html'), encoding='utf-8').read()
for pat in (r'\s*<script src="js/touch.js"></script>', r'\s*<link rel="manifest"[^>]*>', r'\s*<link rel="apple-touch-icon"[^>]*>', r'\s*<link rel="stylesheet" href="css/mobile.css">'): idx = re.sub(pat, '', idx)
write(os.path.join(web, 'index.html'), idx); os.remove(os.path.join(web, 'js', 'touch.js')); os.remove(os.path.join(web, 'css', 'mobile.css'))
print('build/web         -> solo controles de PC')
mob = os.path.join(OUT, 'mobile'); www = os.path.join(mob, 'www'); copy(www, COMMON + MOBILE_ONLY); write(os.path.join(www, 'build-config.js'), "window.TRON_BUILD = 'mobile';\n")
for f in ('package.json', 'capacitor.config.json', 'README_APK.md'): shutil.copy2(os.path.join(ROOT, 'mobile', f), os.path.join(mob, f))
shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(mob, 'assets'))
# service worker con la lista COMPLETA de archivos de esta versión (juego sin conexión)
lst = []
for d, _, fs in os.walk(www):
    for f in fs:
        p = os.path.relpath(os.path.join(d, f), www).replace(os.sep, '/')
        if p != 'sw.js': lst.append('./' + p)
sw = open(os.path.join(www, 'sw.js'), encoding='utf-8').read(); sw = re.sub(r"ASSETS = \[.*?\];", "ASSETS = " + str(sorted(lst)) + ";", sw, count=1, flags=re.S)
write(os.path.join(www, 'sw.js'), sw)
print('build/mobile/www  -> controles táctiles + PWA   (siguiente paso para el APK: mobile/README_APK.md)')
