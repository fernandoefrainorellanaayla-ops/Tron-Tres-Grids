"""TRON — mp_relay.py: relé de MULTIJUGADOR (WebSocket) con salas. Solo biblioteca estándar.
Un cliente de PC y otro de teléfono se conectan al MISMO relé (crossplay): crean/entran a una sala con un código de 5 letras,
se ven en el mismo mapa, chatean y pueden «ir con» el otro. El relé solo reenvía mensajes pequeños; no ejecuta lógica de juego.
Seguridad: comprobación de Origin/Host (misma regla que el servidor), máx. 8 jugadores por sala, 80 salas, mensajes ≤ 2 KB, 40 msg/s por jugador."""
import asyncio, base64, hashlib, json, random, struct, sys, time

GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
MAX_ROOM, MAX_ROOMS, MAX_MSG, RATE = 8, 80, 2048, 40
ROOMS = {}          # código -> {id: Client}
NEXT_ID = [1]


class Client:
    def __init__(self, reader, writer):
        self.r, self.w, self.id = reader, writer, NEXT_ID[0]
        NEXT_ID[0] += 1
        self.room, self.name, self.color, self.form = None, "Usuario", "#00D4FF", "human"
        self.state, self.tokens, self.last = {}, float(RATE), time.time()

    async def send(self, obj):
        data = json.dumps(obj, separators=(",", ":")).encode("utf-8")
        n = len(data)
        head = bytes([0x81]) + (bytes([n]) if n < 126 else b"\x7e" + struct.pack(">H", n) if n < 65536 else b"\x7f" + struct.pack(">Q", n))
        try:
            self.w.write(head + data)
            await self.w.drain()
        except Exception:
            pass

    def allow(self):
        now = time.time()
        self.tokens = min(RATE, self.tokens + (now - self.last) * RATE)
        self.last = now
        if self.tokens < 1:
            return False
        self.tokens -= 1
        return True


async def read_frame(c):
    h = await c.r.readexactly(2)
    fin, op, ln = h[0] & 0x80, h[0] & 0x0F, h[1] & 0x7F
    masked = h[1] & 0x80
    if ln == 126:
        ln = struct.unpack(">H", await c.r.readexactly(2))[0]
    elif ln == 127:
        ln = struct.unpack(">Q", await c.r.readexactly(8))[0]
    if ln > MAX_MSG or not masked or not fin:
        raise ValueError("trama no válida")
    mask = await c.r.readexactly(4)
    data = bytearray(await c.r.readexactly(ln))
    for i in range(ln):
        data[i] ^= mask[i % 4]
    return op, bytes(data)


def clean(s, n):
    return "".join(ch for ch in str(s)[:n] if ch.isprintable()).strip()


def code():
    for _ in range(50):
        c = "".join(random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(5))
        if c not in ROOMS:
            return c
    return None


async def broadcast(c, obj, me=False):
    for o in list(ROOMS.get(c.room, {}).values()):
        if me or o is not c:
            await o.send(obj)


def public(c):
    s = dict(c.state)
    s.update({"id": c.id, "name": c.name, "color": c.color, "form": c.form})
    return s


async def handle_msg(c, m):
    t = m.get("t")
    if t == "join" and not c.room:
        c.name = clean(m.get("name"), 16) or "Usuario"
        col = str(m.get("color", ""))
        c.color = col if len(col) == 7 and col[0] == "#" and all(x in "0123456789abcdefABCDEF" for x in col[1:]) else "#00D4FF"
        c.form = clean(m.get("form"), 12) or "human"
        rc = clean(m.get("room"), 5).upper()
        if not rc:
            if len(ROOMS) >= MAX_ROOMS:
                return await c.send({"t": "err", "msg": "El servidor tiene demasiadas salas."})
            rc = code()
            ROOMS[rc] = {}
        elif rc not in ROOMS:
            return await c.send({"t": "err", "msg": "No existe la sala %s." % rc})
        if len(ROOMS[rc]) >= MAX_ROOM:
            return await c.send({"t": "err", "msg": "La sala está llena (máx. %d)." % MAX_ROOM})
        c.room = rc
        ROOMS[rc][c.id] = c
        await c.send({"t": "joined", "id": c.id, "room": rc, "players": [public(o) for o in ROOMS[rc].values() if o is not c]})
        await broadcast(c, {"t": "joined2", "p": public(c)})
    elif not c.room:
        return
    elif t == "s":
        st = {k: m.get(k) for k in ("era", "a", "x", "y", "ang", "f", "mode", "mv") if k in m}
        for k in ("x", "y", "ang"):
            if k in st and not isinstance(st[k], (int, float)):
                return
        if "era" in st:
            st["era"] = clean(st["era"], 8)
        if "a" in st:
            st["a"] = clean(st["a"], 40)
        if "mode" in st:
            st["mode"] = clean(st["mode"], 8)
        c.state.update(st)
        await broadcast(c, dict(st, t="s", id=c.id))
    elif t == "chat":
        txt = clean(m.get("text"), 120)
        if txt:
            await broadcast(c, {"t": "chat", "id": c.id, "name": c.name, "text": txt}, me=True)
    elif t == "emote":
        await broadcast(c, {"t": "emote", "id": c.id, "e": clean(m.get("e"), 4)})
    elif t == "ping":
        await c.send({"t": "pong"})


async def client_loop(reader, writer, host_ok):
    c = Client(reader, writer)
    try:
        head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 8)
        lines = head.decode("latin-1").split("\r\n")
        hd = {}
        for ln in lines[1:]:
            if ":" in ln:
                k, v = ln.split(":", 1)
                hd[k.strip().lower()] = v.strip()
        origin = hd.get("origin", "")
        host = hd.get("host", "")
        hostname = host.rsplit(":", 1)[0] if not host.startswith("[") else host.split("]")[0] + "]"
        ok = host_ok(hostname)
        if origin and origin != "null":
            from urllib.parse import urlparse
            ok = ok and host_ok(urlparse(origin).hostname or "")
        if hd.get("upgrade", "").lower() != "websocket" or "sec-websocket-key" not in hd or not ok:
            writer.write(b"HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n")
            await writer.drain()
            return
        acc = base64.b64encode(hashlib.sha1((hd["sec-websocket-key"] + GUID).encode()).digest()).decode()
        writer.write(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: %s\r\n\r\n" % acc).encode())
        await writer.drain()
        while True:
            op, data = await read_frame(c)
            if op == 8:
                break
            if op == 9:
                writer.write(b"\x8a" + bytes([len(data)]) + data[:125])
                await writer.drain()
                continue
            if op != 1 or not c.allow():
                continue
            try:
                m = json.loads(data.decode("utf-8"))
                if isinstance(m, dict):
                    await handle_msg(c, m)
            except (ValueError, UnicodeDecodeError):
                pass
    except (asyncio.IncompleteReadError, asyncio.TimeoutError, ConnectionError, ValueError, OSError):
        pass
    finally:
        if c.room and c.id in ROOMS.get(c.room, {}):
            del ROOMS[c.room][c.id]
            await broadcast(c, {"t": "left", "id": c.id})
            if not ROOMS[c.room]:
                del ROOMS[c.room]
        try:
            writer.close()
        except Exception:
            pass


def run(host, port, host_ok):
    """Arranca el relé en un hilo aparte (bucle asyncio propio)."""
    async def main():
        srv = await asyncio.start_server(lambda r, w: client_loop(r, w, host_ok), host, port)
        async with srv:
            await srv.serve_forever()
    try:
        asyncio.run(main())
    except OSError as e:
        sys.stderr.write("[multijugador] no se pudo abrir el puerto %s: %s\n" % (port, e))
