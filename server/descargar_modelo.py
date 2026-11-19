#!/usr/bin/env python3
"""
descargar_modelo.py - Descarga un modelo GGUF pequeño para la IA LOCAL de los NPCs.

Por defecto: Qwen2.5-1.5B-Instruct (cuantizado Q4_K_M, ~1 GB, licencia Apache-2.0).
Funciona bien en español y corre en un PC normal sin tarjeta gráfica.

Uso:   python server/descargar_modelo.py
       python server/descargar_modelo.py --url <otra URL .gguf> --nombre mimodelo.gguf
Después instala el motor:   pip install llama-cpp-python
(En Windows, si falla la compilación, usa la rueda precompilada:
   pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu )
"""
import argparse
import os
import sys
import urllib.request

URL = "https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf"
NAME = "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    ap.add_argument("--nombre", default=NAME)
    a = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    folder = os.path.join(here, "models")
    os.makedirs(folder, exist_ok=True)
    dest = os.path.join(folder, a.nombre)
    if os.path.isfile(dest) and os.path.getsize(dest) > 50_000_000:
        print("El modelo ya existe:", dest)
        return
    tmp = dest + ".part"
    print("Descargando", a.url)
    print("Destino   ", dest)
    req = urllib.request.Request(a.url, headers={"User-Agent": "tron-grids-model-downloader"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r, open(tmp, "wb") as f:
            total = int(r.headers.get("Content-Length") or 0)
            done = 0
            while True:
                chunk = r.read(1 << 20)
                if not chunk:
                    break
                f.write(chunk)
                done += len(chunk)
                if total:
                    sys.stdout.write("\r  %5.1f%%  (%d / %d MB)" % (done * 100 / total, done >> 20, total >> 20))
                else:
                    sys.stdout.write("\r  %d MB" % (done >> 20))
                sys.stdout.flush()
    except Exception as e:
        print("\nError de descarga:", e)
        print("Puedes bajar el archivo .gguf a mano y copiarlo en:", folder)
        if os.path.exists(tmp):
            os.remove(tmp)
        sys.exit(1)
    os.replace(tmp, dest)
    print("\nListo. Ahora instala el motor:  pip install llama-cpp-python")


if __name__ == "__main__":
    main()
