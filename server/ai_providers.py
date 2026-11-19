"""
ai_providers.py - Proveedores de IA para los NPCs de TRON: Las Tres Grids.

Solo usa la biblioteca estándar de Python (urllib/json). El único proveedor que
necesita un paquete extra es el modelo local `llama_cpp` (pip install llama-cpp-python).

Proveedores:
  llama_cpp     Modelo GGUF local, sin internet ni claves (recomendado para jugar gratis).
  anthropic     API de Claude (Messages API).
  gemini        API de Google Gemini (generateContent).
  openai_compat Cualquier API estilo OpenAI /chat/completions: OpenAI, DeepSeek,
                OpenRouter, Groq, LM Studio, llama.cpp-server, vLLM...
  mock          Respuestas de prueba sin IA (para comprobar que todo está conectado).
"""
import json
import os
import threading
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMEOUT = 45


class ProviderError(Exception):
    """Error al llamar al proveedor (el detalle se registra en el servidor, no se envía al navegador)."""


def _post_json(url, payload, headers, timeout=TIMEOUT):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    for k, v in headers.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", "replace")[:300]
        except Exception:
            pass
        raise ProviderError("HTTP %s: %s" % (e.code, body))
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
        raise ProviderError("Conexión fallida: %s" % e)


def _read_key(cfg):
    """La clave se lee de una variable de entorno (api_key_env) o, si no, de `api_key` en el JSON."""
    env = cfg.get("api_key_env")
    if env and os.environ.get(env):
        return os.environ[env].strip()
    return (cfg.get("api_key") or "").strip()


class Provider:
    name = "base"

    def __init__(self, cfg, glob):
        self.cfg = cfg
        self.glob = glob
        self.model = cfg.get("model", "")

    def available(self):
        return True

    def generate(self, system, messages, max_tokens, temperature):  # pragma: no cover
        raise NotImplementedError


class Mock(Provider):
    name = "mock"

    def generate(self, system, messages, max_tokens, temperature):
        last = messages[-1]["content"] if messages else ""
        who = "un programa de la Grid"
        for line in system.splitlines():
            if line.startswith("Eres "):
                who = line[5:].split(",")[0]
                break
        return "(respuesta de prueba) Soy %s. Recibí tu mensaje: «%s». La IA real todavía no está configurada." % (who, last[:80])


class Anthropic(Provider):
    name = "anthropic"

    def __init__(self, cfg, glob):
        super().__init__(cfg, glob)
        self.key = _read_key(cfg)
        self.base = cfg.get("base_url", "https://api.anthropic.com").rstrip("/")
        self.model = cfg.get("model", "claude-haiku-5-5")

    def available(self):
        return bool(self.key)

    def generate(self, system, messages, max_tokens, temperature):
        out = _post_json(
            self.base + "/v1/messages",
            {"model": self.model, "max_tokens": max_tokens, "temperature": temperature, "system": system, "messages": messages},
            {"x-api-key": self.key, "anthropic-version": "2023-06-01"},
        )
        parts = [b.get("text", "") for b in out.get("content", []) if b.get("type") == "text"]
        text = "".join(parts).strip()
        if not text:
            raise ProviderError("Respuesta vacía de Anthropic")
        return text


class Gemini(Provider):
    name = "gemini"

    def __init__(self, cfg, glob):
        super().__init__(cfg, glob)
        self.key = _read_key(cfg)
        self.base = cfg.get("base_url", "https://generativelanguage.googleapis.com").rstrip("/")
        self.model = cfg.get("model", "gemini-2.5-flash")

    def available(self):
        return bool(self.key)

    def generate(self, system, messages, max_tokens, temperature):
        contents = [{"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]} for m in messages]
        out = _post_json(
            "%s/v1beta/models/%s:generateContent" % (self.base, self.model),
            {"systemInstruction": {"parts": [{"text": system}]}, "contents": contents,
             "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature}},
            {"x-goog-api-key": self.key},
        )
        try:
            parts = out["candidates"][0]["content"]["parts"]
            text = "".join(p.get("text", "") for p in parts).strip()
        except (KeyError, IndexError, TypeError):
            raise ProviderError("Respuesta inesperada de Gemini")
        if not text:
            raise ProviderError("Respuesta vacía de Gemini")
        return text


class OpenAICompat(Provider):
    name = "openai_compat"

    def __init__(self, cfg, glob):
        super().__init__(cfg, glob)
        self.key = _read_key(cfg)
        self.base = cfg.get("base_url", "https://api.openai.com/v1").rstrip("/")
        self.model = cfg.get("model", "gpt-4o-mini")
        self.local = self.base.startswith("http://localhost") or self.base.startswith("http://127.0.0.1")

    def available(self):
        # los servidores locales (LM Studio, llama.cpp-server) no necesitan clave
        return bool(self.key) or self.local

    def generate(self, system, messages, max_tokens, temperature):
        headers = {"Authorization": "Bearer " + self.key} if self.key else {}
        out = _post_json(
            self.base + "/chat/completions",
            {"model": self.model, "max_tokens": max_tokens, "temperature": temperature,
             "messages": [{"role": "system", "content": system}] + messages},
            headers,
        )
        try:
            text = (out["choices"][0]["message"]["content"] or "").strip()
        except (KeyError, IndexError, TypeError):
            raise ProviderError("Respuesta inesperada del proveedor")
        if not text:
            raise ProviderError("Respuesta vacía")
        return text


class LlamaCpp(Provider):
    name = "llama_cpp"
    _lock = threading.Lock()

    def __init__(self, cfg, glob):
        super().__init__(cfg, glob)
        path = cfg.get("model_path", "server/models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf")
        self.path = path if os.path.isabs(path) else os.path.join(ROOT, path)
        self.model = os.path.basename(self.path)
        self.llm = None
        self.err = None

    def available(self):
        if not os.path.isfile(self.path):
            self.err = "No existe el modelo: %s (ejecuta descargar_modelo.py)" % self.path
            return False
        try:
            import llama_cpp  # noqa: F401
        except ImportError:
            self.err = "Falta el paquete: pip install llama-cpp-python"
            return False
        return True

    def _load(self):
        if self.llm is None:
            from llama_cpp import Llama
            threads = int(self.cfg.get("n_threads", 0)) or None
            self.llm = Llama(model_path=self.path, n_ctx=int(self.cfg.get("n_ctx", 2048)), n_threads=threads, verbose=False)
        return self.llm

    def generate(self, system, messages, max_tokens, temperature):
        with self._lock:  # llama.cpp no es seguro entre hilos
            try:
                llm = self._load()
                out = llm.create_chat_completion(
                    messages=[{"role": "system", "content": system}] + messages,
                    max_tokens=max_tokens, temperature=temperature, top_p=0.92, repeat_penalty=1.1)
                text = (out["choices"][0]["message"]["content"] or "").strip()
            except Exception as e:  # el paquete lanza tipos variados
                raise ProviderError("llama.cpp: %s" % e)
        if not text:
            raise ProviderError("Respuesta vacía del modelo local")
        return text


PROVIDERS = {"llama_cpp": LlamaCpp, "anthropic": Anthropic, "gemini": Gemini, "openai_compat": OpenAICompat, "mock": Mock}

# Orden de la detección automática (provider = "auto")
AUTO_ORDER = [
    ("anthropic", "ANTHROPIC_API_KEY", {}),
    ("gemini", "GEMINI_API_KEY", {}),
    ("openai_compat", "DEEPSEEK_API_KEY", {"base_url": "https://api.deepseek.com", "model": "deepseek-chat", "api_key_env": "DEEPSEEK_API_KEY"}),
    ("openai_compat", "OPENAI_API_KEY", {"api_key_env": "OPENAI_API_KEY"}),
]


def load_config():
    path = os.path.join(ROOT, "server", "config.json")
    cfg = {}
    if os.path.isfile(path):
        with open(path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    cfg.setdefault("provider", "auto")
    cfg.setdefault("max_tokens", 150)
    cfg.setdefault("temperature", 0.8)
    cfg.setdefault("allow_file_origin", True)
    return cfg


def build_provider(cfg):
    """Devuelve (provider|None, motivo). Con provider='auto' prueba claves en el entorno y luego el modelo local."""
    want = str(cfg.get("provider", "auto")).lower()
    if want in ("none", "off", "local_fallback"):
        return None, "IA desactivada en config.json"
    if want != "auto":
        if want not in PROVIDERS:
            return None, "Proveedor desconocido: %s (usa: %s)" % (want, ", ".join(PROVIDERS))
        p = PROVIDERS[want](cfg.get(want, {}), cfg)
        if p.available():
            return p, "ok"
        return None, getattr(p, "err", None) or "Falta la clave de API para '%s' (variable %s)" % (want, cfg.get(want, {}).get("api_key_env", "?"))
    for name, env, extra in AUTO_ORDER:
        if os.environ.get(env):
            sub = dict(cfg.get(name, {}))
            for k, v in extra.items():
                sub.setdefault(k, v)
            sub.setdefault("api_key_env", env)
            p = PROVIDERS[name](sub, cfg)
            if p.available():
                return p, "auto: " + env
    p = LlamaCpp(cfg.get("llama_cpp", {}), cfg)
    if p.available():
        return p, "auto: modelo local"
    return None, "Sin proveedor: define una clave de API (p. ej. ANTHROPIC_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY) o instala el modelo local"
