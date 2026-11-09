#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SWAT ONLINE APPLICATION CENTER - website server
Python 3.8+ , sirf standard library (koi extra install nahi).

    python server.py            ->  http://localhost:8080      (admin: /admin)

Environment (optional):  PORT=8080  HOST=0.0.0.0  TRUST_PROXY=1 (nginx/Caddy/Cloudflare ke peeche chalate waqt)
"""
import os
import re
import io
import sys
import csv
import json
import time
import zipfile
import shutil
import sqlite3
import hashlib
import secrets
import smtplib
import tempfile
import threading
import mimetypes
import traceback
import datetime as dt
from email.message import EmailMessage
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ROOT, "site")
DATA = os.environ.get("SOAC_DATA") or os.path.join(ROOT, "data")
UPLOADS = os.path.join(DATA, "uploads")
PRIVATE = os.path.join(DATA, "private_docs")
HISTORY = os.path.join(DATA, "content_history")
DB_FILE = os.path.join(DATA, "site.db")
CONTENT_FILE = os.path.join(DATA, "content.json")
ADMIN_FILE = os.path.join(DATA, "admin.json")
SECRETS_FILE = os.path.join(DATA, "secrets.json")
DEFAULT_CONTENT = os.path.join(ROOT, "default_content.json")

PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")
TRUST_PROXY = os.environ.get("TRUST_PROXY", "") == "1"
DEFAULT_USER, DEFAULT_PASS = "admin", "Swat@12345"

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".ico"}
VID_EXT = {".mp4", ".webm"}
DOC_EXT = {".pdf"}
MAX_IMG, MAX_VID, MAX_DOC = 40 * 1024 * 1024, 600 * 1024 * 1024, 20 * 1024 * 1024
MAX_PUBLIC_DOC = 8 * 1024 * 1024

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/webm", ".webm")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/manifest+json", ".webmanifest")

LOCK = threading.RLock()
SESSIONS = {}
HITS = {}


# ---------------------------------------------------------------- helpers
def now_iso():
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def today():
    return dt.date.today().isoformat()


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def jdump(o):
    return json.dumps(o, ensure_ascii=False)


def read_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def rate_ok(key, limit, window):
    """True if allowed. Sliding window in memory."""
    now = time.time()
    with LOCK:
        lst = [t for t in HITS.get(key, []) if now - t < window]
        if len(lst) >= limit:
            HITS[key] = lst
            return False
        lst.append(now)
        HITS[key] = lst
        if len(HITS) > 5000:
            for k in list(HITS)[:2000]:
                HITS.pop(k, None)
    return True


def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(salt), 200000).hex()
    return salt, h


def db():
    c = sqlite3.connect(DB_FILE, timeout=15)
    c.row_factory = sqlite3.Row
    return c


def init_storage():
    for d in (DATA, UPLOADS, PRIVATE, HISTORY):
        os.makedirs(d, exist_ok=True)
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS visits(day TEXT, vid TEXT, views INTEGER DEFAULT 1, PRIMARY KEY(day,vid));
        CREATE TABLE IF NOT EXISTS inquiries(id INTEGER PRIMARY KEY, ref TEXT UNIQUE, created TEXT, name TEXT, phone TEXT,
          email TEXT, city TEXT, service TEXT, message TEXT, status TEXT DEFAULT 'New', note TEXT DEFAULT '',
          public_note TEXT DEFAULT '', token TEXT, ip TEXT, seen INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS docs(id INTEGER PRIMARY KEY, inquiry_id INTEGER, stored TEXT, orig TEXT, size INTEGER, created TEXT);
        """)
    if not os.path.exists(ADMIN_FILE):
        salt, h = hash_pw(DEFAULT_PASS)
        write_json(ADMIN_FILE, {"user": DEFAULT_USER, "salt": salt, "hash": h, "must_change": True})
    if not os.path.exists(CONTENT_FILE):
        shutil.copy(DEFAULT_CONTENT, CONTENT_FILE)
    if not os.path.exists(SECRETS_FILE):
        write_json(SECRETS_FILE, {"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": "", "smtp_ssl": False, "notify_to": ""})


def load_content():
    default = read_json(DEFAULT_CONTENT, {})
    cur = read_json(CONTENT_FILE, None)
    if not isinstance(cur, dict):
        return default
    for k, v in default.items():            # new keys added in upgrades
        if k not in cur:
            cur[k] = v
        elif isinstance(v, dict) and isinstance(cur[k], dict):
            for kk, vv in v.items():
                cur[k].setdefault(kk, vv)
    return cur


MAP_OK = re.compile(r"^https://(www\.google\.com/maps|maps\.google\.com|www\.openstreetmap\.org|maps\.app\.goo\.gl|goo\.gl/maps)", re.I)


def clean_content(c):
    if not isinstance(c, dict):
        raise ValueError("Content galat hai")
    for key in ("settings", "hero"):
        if not isinstance(c.get(key), dict):
            raise ValueError("'%s' section gayab hai" % key)
    for key in ("services", "steps", "why", "updates", "gallery", "testimonials", "faq", "stats"):
        if not isinstance(c.get(key, []), list):
            raise ValueError("'%s' list honi chahiye" % key)
    s = c["settings"]
    if s.get("map_embed") and not MAP_OK.match(str(s["map_embed"])):
        s["map_embed"] = ""
    ph = re.sub(r"\D", "", str(s.get("whatsapp", "")))
    if ph.startswith("0"):
        ph = "92" + ph[1:]
    s["whatsapp"] = ph
    return c


def save_content(c):
    c = clean_content(c)
    with LOCK:
        if os.path.exists(CONTENT_FILE):
            shutil.copy(CONTENT_FILE, os.path.join(HISTORY, "content-%s.json" % dt.datetime.now().strftime("%Y%m%d-%H%M%S")))
            hist = sorted(os.listdir(HISTORY))
            for old in hist[:-30]:
                try:
                    os.remove(os.path.join(HISTORY, old))
                except OSError:
                    pass
        write_json(CONTENT_FILE, c)


def secrets_cfg():
    return read_json(SECRETS_FILE, {})


def send_mail(subject, body, to=None):
    cfg = secrets_cfg()
    to = to or cfg.get("notify_to")
    if not (cfg.get("smtp_host") and to):
        return False, "Email settings adhoori hain"
    try:
        msg = EmailMessage()
        msg["Subject"], msg["From"], msg["To"] = subject, cfg.get("smtp_user") or to, to
        msg.set_content(body)
        port = int(cfg.get("smtp_port") or 587)
        if cfg.get("smtp_ssl"):
            s = smtplib.SMTP_SSL(cfg["smtp_host"], port, timeout=20)
        else:
            s = smtplib.SMTP(cfg["smtp_host"], port, timeout=20)
            s.starttls()
        if cfg.get("smtp_user"):
            s.login(cfg["smtp_user"], cfg.get("smtp_pass", ""))
        s.send_message(msg)
        s.quit()
        return True, "ok"
    except Exception as e:  # noqa
        try:
            with open(os.path.join(DATA, "mail_errors.log"), "a", encoding="utf-8") as f:
                f.write("%s %s\n" % (now_iso(), e))
        except OSError:
            pass
        return False, str(e)


def sniff(head, ext):
    """Check file signature so a renamed file cannot pose as an image/video/pdf."""
    if ext in (".jpg", ".jpeg"):
        return head[:3] == b"\xff\xd8\xff"
    if ext == ".png":
        return head[:8] == b"\x89PNG\r\n\x1a\n"
    if ext == ".gif":
        return head[:4] == b"GIF8"
    if ext == ".webp":
        return head[:4] == b"RIFF" and head[8:12] == b"WEBP"
    if ext == ".avif":
        return head[4:8] == b"ftyp"
    if ext == ".ico":
        return head[:4] == b"\x00\x00\x01\x00"
    if ext == ".mp4":
        return head[4:8] == b"ftyp"
    if ext == ".webm":
        return head[:4] == b"\x1a\x45\xdf\xa3"
    if ext == ".pdf":
        return head[:5] == b"%PDF-"
    return False


def safe_name(name):
    base = os.path.basename(unquote(name or "file"))
    stem, ext = os.path.splitext(base)
    stem = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-")[:40] or "file"
    return stem, ext.lower()


JSONLD_TYPE = "ProfessionalService"


def abs_url(handler, path):
    if not path:
        return ""
    if path.startswith("http"):
        return path
    return handler.base_url() + path


# ---------------------------------------------------------------- HTTP handler
class Handler(BaseHTTPRequestHandler):
    server_version = "SOAC"
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    # --- plumbing
    def ip(self):
        if TRUST_PROXY:
            xf = self.headers.get("X-Forwarded-For", "")
            if xf:
                return xf.split(",")[0].strip()
        return self.client_address[0]

    def base_url(self):
        host = self.headers.get("Host", "localhost")
        if not re.fullmatch(r"[A-Za-z0-9.\-:\[\]]+", host):
            host = "localhost"
        proto = "https" if (TRUST_PROXY and self.headers.get("X-Forwarded-Proto") == "https") else "http"
        return "%s://%s" % (proto, host)

    def secure_cookie(self):
        return TRUST_PROXY and self.headers.get("X-Forwarded-Proto") == "https"

    def headers_common(self, nonce=None):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        if nonce:
            self.send_header("Content-Security-Policy",
                             "default-src 'self'; script-src 'self' 'nonce-%s'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                             "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; "
                             "frame-src https://www.google.com https://maps.google.com https://www.openstreetmap.org https://www.youtube.com; "
                             "connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" % nonce)

    def reply(self, code, body, ctype="application/json; charset=utf-8", extra=None, nonce=None, cache="no-store"):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", cache)
        self.headers_common(nonce)
        for k, v in (extra or []):
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def jerr(self, code, msg, **kw):
        self.reply(code, jdump(dict({"ok": False, "error": msg}, **kw)))

    def jok(self, **kw):
        self.reply(200, jdump(dict({"ok": True}, **kw)))

    def read_body(self, limit):
        n = int(self.headers.get("Content-Length") or 0)
        if n > limit:
            raise ValueError("File bohat barhi hai")
        return self.rfile.read(n) if n else b""

    def read_json_body(self, limit=200_000):
        try:
            b = self.read_body(limit)
            d = json.loads(b or b"{}")
            return d if isinstance(d, dict) else {}
        except (ValueError, json.JSONDecodeError):
            raise ValueError("Bad request")

    def save_raw_upload(self, dest_dir, limit, allowed, name):
        """Stream request body to a file. Returns saved filename."""
        stem, ext = safe_name(name)
        if ext not in allowed:
            raise ValueError("Is qism ki file allowed nahi (%s)" % ext)
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0:
            raise ValueError("File khali hai")
        if n > limit:
            raise ValueError("File bohat barhi hai (limit %d MB)" % (limit // 1048576))
        final = "%s-%s-%s%s" % (dt.datetime.now().strftime("%Y%m%d"), secrets.token_hex(4), stem, ext)
        tmp = os.path.join(dest_dir, ".up-" + secrets.token_hex(6))
        left, first = n, b""
        try:
            with open(tmp, "wb") as f:
                while left > 0:
                    chunk = self.rfile.read(min(1 << 20, left))
                    if not chunk:
                        raise ValueError("Upload adhoora reh gaya")
                    if not first:
                        first = chunk[:16]
                    f.write(chunk)
                    left -= len(chunk)
            if not sniff(first, ext):
                raise ValueError("File ka format theek nahi lagta")
            os.replace(tmp, os.path.join(dest_dir, final))
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
        return final, n

    # --- sessions
    def session(self):
        ck = self.headers.get("Cookie", "")
        m = re.search(r"(?:^|;\s*)sid=([A-Za-z0-9_\-]+)", ck)
        if not m:
            return None
        s = SESSIONS.get(m.group(1))
        if not s or s["exp"] < time.time():
            SESSIONS.pop(m.group(1), None)
            return None
        return s

    # --- routing
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            u = urlparse(self.path)
            path, q = u.path, parse_qs(u.query)
            if path in ("/", "/index.html"):
                return self.page_index()
            if path in ("/admin", "/admin/"):
                return self.static_file(os.path.join(SITE, "admin", "index.html"), nonce_none=True)
            if path.startswith("/api/"):
                return self.api_get(path[5:], q)
            if path == "/robots.txt":
                return self.reply(200, "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: %s/sitemap.xml\n" % self.base_url(), "text/plain; charset=utf-8")
            if path == "/sitemap.xml":
                return self.reply(200, '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>%s/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>' % self.base_url(), "application/xml")
            if path == "/manifest.webmanifest":
                s = load_content()["settings"]
                return self.reply(200, jdump({"name": s.get("site_name"), "short_name": "SOAC", "start_url": "/", "display": "standalone", "background_color": "#040b14",
                                              "theme_color": "#040b14", "icons": [{"src": s.get("favicon") or "/assets/defaults/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"}]}), "application/manifest+json")
            if path == "/healthz":
                return self.reply(200, "ok", "text/plain")
            if path.startswith("/uploads/"):
                return self.static_file(self.safe_join(UPLOADS, path[len("/uploads/"):]), cache="public, max-age=604800")
            if path.startswith("/assets/"):
                return self.static_file(self.safe_join(os.path.join(SITE, "assets"), path[len("/assets/"):]), cache="public, max-age=300")
            if path.startswith("/admin/"):
                return self.static_file(self.safe_join(os.path.join(SITE, "admin"), path[len("/admin/"):]), cache="no-cache")
            self.reply(404, "<h1>404</h1><p>Page nahi mila.</p><p><a href='/'>Home</a></p>", "text/html; charset=utf-8")
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:  # noqa
            self.log_exc()
            self.jerr(500, "Server error")

    def do_POST(self):
        try:
            u = urlparse(self.path)
            if not u.path.startswith("/api/"):
                return self.jerr(404, "Not found")
            self.api_post(u.path[5:], parse_qs(u.query))
        except ValueError as e:
            self.jerr(400, str(e))
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:  # noqa
            self.log_exc()
            self.jerr(500, "Server error")

    def log_exc(self):
        try:
            with open(os.path.join(DATA, "server_errors.log"), "a", encoding="utf-8") as f:
                f.write("%s %s\n%s\n" % (now_iso(), self.path, traceback.format_exc()))
        except OSError:
            pass

    # --- static
    def safe_join(self, base, rel):
        p = os.path.realpath(os.path.join(base, unquote(rel)))
        b = os.path.realpath(base)
        if p != b and not p.startswith(b + os.sep):
            return ""
        return p

    def static_file(self, path, cache="no-cache", nonce_none=False):
        if not path or not os.path.isfile(path) or os.path.basename(path).startswith("."):
            return self.reply(404, "Not found", "text/plain")
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        size = os.path.getsize(path)
        start, end, code = 0, size - 1, 200
        rng = self.headers.get("Range")
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
            if m and (m.group(1) or m.group(2)):
                if m.group(1):
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else size - 1
                else:
                    start = max(0, size - int(m.group(2)))
                end = min(end, size - 1)
                if start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", "bytes */%d" % size)
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                code = 206
        length = end - start + 1
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", cache)
        if code == 206:
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.headers_common()
        self.end_headers()
        if self.command == "HEAD":
            return
        with open(path, "rb") as f:
            f.seek(start)
            left = length
            while left > 0:
                chunk = f.read(min(1 << 20, left))
                if not chunk:
                    break
                self.wfile.write(chunk)
                left -= len(chunk)

    def page_index(self):
        c = load_content()
        s, h = c["settings"], c["hero"]
        with open(os.path.join(SITE, "index.html"), "r", encoding="utf-8") as f:
            html = f.read()
        nonce = secrets.token_urlsafe(12)
        base = self.base_url()
        ld = {"@context": "https://schema.org", "@type": JSONLD_TYPE, "name": s.get("site_name"), "url": base + "/", "telephone": "+" + (s.get("whatsapp") or ""),
              "image": abs_url(self, s.get("og_image", "")), "address": {"@type": "PostalAddress", "addressLocality": "Swat", "addressRegion": "Khyber Pakhtunkhwa", "addressCountry": "PK"},
              "openingHours": "Mo-Sa 09:00-21:00", "priceRange": "$"}
        if s.get("email"):
            ld["email"] = s["email"]
        content = jdump(c).replace("</", "<\\/").replace("<!--", "<\\!--")
        rep = {"%%LANG%%": "en", "%%TITLE%%": esc("%s | %s" % (s.get("site_name", ""), s.get("tagline_en", ""))),
               "%%DESC%%": esc(h.get("sub_en", "")), "%%OGIMG%%": esc(abs_url(self, s.get("og_image", ""))), "%%URL%%": esc(base + "/"),
               "%%ICON%%": esc(s.get("favicon") or "/assets/defaults/favicon.svg"), "%%ACCENT%%": esc(s.get("accent", "#19e3b1")),
               "%%NONCE%%": nonce, "%%JSONLD%%": jdump(ld).replace("</", "<\\/"), "%%CONTENT%%": content}
        for k, v in rep.items():
            html = html.replace(k, v)
        self.reply(200, html, "text/html; charset=utf-8", nonce=nonce)

    # --- API: public + admin GET
    def api_get(self, name, q):
        if name == "content":
            return self.reply(200, jdump(load_content()))
        if name.startswith("admin/"):
            return self.admin_get(name[6:], q)
        self.jerr(404, "Not found")

    def api_post(self, name, q):
        if name.startswith("admin/"):
            return self.admin_post(name[6:], q)
        ip = self.ip()
        if name == "visit":
            d = self.read_json_body()
            vid = re.sub(r"[^A-Za-z0-9]", "", str(d.get("vid", "")))[:32]
            if vid and rate_ok("visit:" + ip, 120, 3600):
                with db() as c:
                    c.execute("INSERT INTO visits(day,vid,views) VALUES(?,?,1) ON CONFLICT(day,vid) DO UPDATE SET views=views+1", (today(), vid))
            return self.jok()
        if name == "inquiry":
            return self.public_inquiry(ip)
        if name == "upload-doc":
            return self.public_doc(ip, q)
        if name == "track":
            return self.public_track(ip)
        self.jerr(404, "Not found")

    def public_inquiry(self, ip):
        d = self.read_json_body(20_000)
        if d.get("website"):                       # honeypot
            return self.jok(ref="SOAC-000000", token="x")
        if not rate_ok("inq:" + ip, 6, 1800):
            return self.jerr(429, "Bohat zyada requests. Thori der baad try karein.")
        name = str(d.get("name", "")).strip()[:80]
        phone = re.sub(r"[^\d+]", "", str(d.get("phone", "")))[:16]
        digits = re.sub(r"\D", "", phone)
        if len(name) < 2:
            return self.jerr(400, "Naam likhein")
        if not 10 <= len(digits) <= 13:
            return self.jerr(400, "Sahi phone number likhein")
        email = str(d.get("email", "")).strip()[:100]
        if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            return self.jerr(400, "Email sahi nahi hai")
        city = str(d.get("city", "")).strip()[:60]
        service = str(d.get("service", "")).strip()[:120]
        message = str(d.get("message", "")).strip()[:2000]
        token = secrets.token_urlsafe(16)
        with db() as c:
            for _ in range(20):
                ref = "SOAC-%06d" % (secrets.randbelow(900000) + 100000)
                if not c.execute("SELECT 1 FROM inquiries WHERE ref=?", (ref,)).fetchone():
                    break
            c.execute("INSERT INTO inquiries(ref,created,name,phone,email,city,service,message,token,ip) VALUES(?,?,?,?,?,?,?,?,?,?)",
                      (ref, now_iso(), name, phone, email, city, service, message, token, ip))
        threading.Thread(target=send_mail, args=("New application request %s - %s" % (ref, name),
                         "Ref: %s\nName: %s\nPhone: %s\nEmail: %s\nCity: %s\nService: %s\n\n%s\n" % (ref, name, phone, email, city, service, message)), daemon=True).start()
        self.jok(ref=ref, token=token)

    def public_doc(self, ip, q):
        if not rate_ok("doc:" + ip, 30, 1800):
            return self.jerr(429, "Bohat zyada uploads")
        ref, token = (q.get("ref") or [""])[0], (q.get("token") or [""])[0]
        with db() as c:
            r = c.execute("SELECT * FROM inquiries WHERE ref=?", (ref,)).fetchone()
            if not r or not secrets.compare_digest(r["token"] or "", token):
                return self.jerr(403, "Ijazat nahi")
            if c.execute("SELECT COUNT(*) FROM docs WHERE inquiry_id=?", (r["id"],)).fetchone()[0] >= 6:
                return self.jerr(400, "Zyada se zyada 6 files")
            orig = (q.get("name") or ["file"])[0]
            final, n = self.save_raw_upload(PRIVATE, MAX_PUBLIC_DOC, {".jpg", ".jpeg", ".png", ".webp", ".pdf"}, orig)
            c.execute("INSERT INTO docs(inquiry_id,stored,orig,size,created) VALUES(?,?,?,?,?)", (r["id"], final, os.path.basename(orig)[:80], n, now_iso()))
        self.jok()

    def public_track(self, ip):
        if not rate_ok("trk:" + ip, 20, 600):
            return self.jerr(429, "Thori der baad try karein")
        d = self.read_json_body(2000)
        ref = str(d.get("ref", "")).strip().upper()
        ph = re.sub(r"\D", "", str(d.get("phone", "")))[-10:]
        with db() as c:
            r = c.execute("SELECT * FROM inquiries WHERE ref=?", (ref,)).fetchone()
        if not r or len(ph) < 10 or re.sub(r"\D", "", r["phone"])[-10:] != ph:
            return self.jerr(404, "Reference number ya phone number sahi nahi")
        self.jok(status=r["status"], service=r["service"], created=r["created"][:10], note=r["public_note"], name=r["name"])

    # --- admin
    def need_admin(self, allow_change=False):
        s = self.session()
        if not s:
            self.jerr(401, "Login karein")
            return None
        if self.command == "POST" and self.headers.get("X-Requested-With") != "soac":
            self.jerr(403, "Bad request")
            return None
        if s.get("must_change") and not allow_change:
            self.jerr(403, "Pehle password badlein", must_change=True)
            return None
        return s

    def admin_get(self, name, q):
        if name == "me":
            s = self.session()
            if not s:
                return self.jerr(401, "Login karein")
            return self.jok(user=s["user"], must_change=bool(s.get("must_change")), new=self.count_new())
        if self.need_admin() is None:
            return
        if name == "content":
            return self.reply(200, jdump(load_content()))
        if name == "secrets":
            c = secrets_cfg()
            c["smtp_pass"] = "********" if c.get("smtp_pass") else ""
            return self.reply(200, jdump(c))
        if name == "media":
            items = []
            for fn in sorted(os.listdir(UPLOADS), reverse=True):
                p = os.path.join(UPLOADS, fn)
                if os.path.isfile(p) and not fn.startswith("."):
                    ext = os.path.splitext(fn)[1].lower()
                    items.append({"name": fn, "url": "/uploads/" + fn, "size": os.path.getsize(p), "kind": "video" if ext in VID_EXT else "image", "time": int(os.path.getmtime(p))})
            return self.reply(200, jdump({"items": items}))
        if name == "inquiries":
            return self.admin_inquiries(q)
        if name == "export.csv":
            return self.admin_export()
        if name == "inquiry-doc":
            return self.admin_doc(q)
        if name == "stats":
            return self.admin_stats()
        if name == "history":
            return self.reply(200, jdump({"items": sorted(os.listdir(HISTORY), reverse=True)}))
        if name == "backup":
            return self.admin_backup()
        self.jerr(404, "Not found")

    def count_new(self):
        with db() as c:
            return c.execute("SELECT COUNT(*) FROM inquiries WHERE status='New'").fetchone()[0]

    def admin_inquiries(self, q):
        status = (q.get("status") or [""])[0]
        term = "%" + (q.get("q") or [""])[0].strip() + "%"
        sql, args = "SELECT * FROM inquiries WHERE (name LIKE ? OR phone LIKE ? OR ref LIKE ? OR service LIKE ? OR message LIKE ?)", [term] * 5
        if status:
            sql += " AND status=?"
            args.append(status)
        with db() as c:
            rows = [dict(r) for r in c.execute(sql + " ORDER BY id DESC LIMIT 500", args)]
            for r in rows:
                r.pop("token", None)
                r["docs"] = [dict(d) for d in c.execute("SELECT id,orig,size,created FROM docs WHERE inquiry_id=?", (r["id"],))]
            c.execute("UPDATE inquiries SET seen=1 WHERE seen=0")
        self.reply(200, jdump({"items": rows}))

    def admin_export(self):
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["ref", "created", "name", "phone", "email", "city", "service", "status", "message", "note"])
        with db() as c:
            for r in c.execute("SELECT * FROM inquiries ORDER BY id DESC"):
                w.writerow([r["ref"], r["created"], r["name"], r["phone"], r["email"], r["city"], r["service"], r["status"], r["message"], r["note"]])
        self.reply(200, "\ufeff" + buf.getvalue(), "text/csv; charset=utf-8", extra=[("Content-Disposition", 'attachment; filename="applications-%s.csv"' % today())])

    def admin_doc(self, q):
        try:
            did = int((q.get("id") or ["0"])[0])
        except ValueError:
            return self.jerr(400, "Bad id")
        with db() as c:
            r = c.execute("SELECT * FROM docs WHERE id=?", (did,)).fetchone()
        if not r:
            return self.jerr(404, "Not found")
        p = os.path.join(PRIVATE, r["stored"])
        with open(p, "rb") as f:
            data = f.read()
        ext = os.path.splitext(r["stored"])[1].lower()
        ct = "application/pdf" if ext == ".pdf" else "image/" + ("jpeg" if ext in (".jpg", ".jpeg") else ext[1:])
        self.reply(200, data, ct, extra=[("Content-Disposition", 'inline; filename="%s"' % re.sub(r"[^\w.\- ]", "_", r["orig"]))])

    def admin_stats(self):
        with db() as c:
            days = []
            for i in range(29, -1, -1):
                d = (dt.date.today() - dt.timedelta(days=i)).isoformat()
                r = c.execute("SELECT COUNT(*), COALESCE(SUM(views),0) FROM visits WHERE day=?", (d,)).fetchone()
                days.append({"day": d, "visitors": r[0], "views": r[1]})
            tot = c.execute("SELECT COUNT(DISTINCT vid), COALESCE(SUM(views),0) FROM visits").fetchone()
            by_status = {r[0]: r[1] for r in c.execute("SELECT status, COUNT(*) FROM inquiries GROUP BY status")}
            top = [dict(r) for r in c.execute("SELECT service, COUNT(*) n FROM inquiries WHERE service<>'' GROUP BY service ORDER BY n DESC LIMIT 6")]
            total_inq = c.execute("SELECT COUNT(*) FROM inquiries").fetchone()[0]
        self.reply(200, jdump({"days": days, "unique_total": tot[0], "views_total": tot[1], "today": days[-1], "inquiries": total_inq, "by_status": by_status, "top_services": top}))

    def admin_backup(self):
        fd, tmp = tempfile.mkstemp(suffix=".zip")
        os.close(fd)
        try:
            with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
                for folder, _, files in os.walk(DATA):
                    if os.path.basename(folder) == "content_history":
                        continue
                    for fn in files:
                        if fn.endswith((".tmp", "-wal", "-shm")) or fn.startswith(".up-"):
                            continue
                        full = os.path.join(folder, fn)
                        z.write(full, os.path.relpath(full, ROOT))
            with open(tmp, "rb") as f:
                data = f.read()
        finally:
            os.remove(tmp)
        self.reply(200, data, "application/zip", extra=[("Content-Disposition", 'attachment; filename="website-backup-%s.zip"' % today())])

    def admin_post(self, name, q):
        ip = self.ip()
        if name == "login":
            if not rate_ok("login:" + ip, 8, 600):
                return self.jerr(429, "Bohat zyada koshishein. 10 minute baad try karein.")
            d = self.read_json_body(2000)
            a = read_json(ADMIN_FILE, {})
            ok_user = secrets.compare_digest(str(d.get("u", "")).strip().lower(), str(a.get("user", "")).lower())
            _, h = hash_pw(str(d.get("p", "")), a.get("salt", "00"))
            if not (ok_user and secrets.compare_digest(h, a.get("hash", ""))):
                time.sleep(0.6)
                return self.jerr(401, "Username ya password galat hai")
            sid = secrets.token_urlsafe(32)
            SESSIONS[sid] = {"user": a["user"], "exp": time.time() + 12 * 3600, "must_change": bool(a.get("must_change"))}
            ck = "sid=%s; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200" % sid + ("; Secure" if self.secure_cookie() else "")
            return self.reply(200, jdump({"ok": True, "must_change": bool(a.get("must_change"))}), extra=[("Set-Cookie", ck)])
        if name == "logout":
            ck = self.headers.get("Cookie", "")
            m = re.search(r"sid=([A-Za-z0-9_\-]+)", ck)
            if m:
                SESSIONS.pop(m.group(1), None)
            return self.reply(200, jdump({"ok": True}), extra=[("Set-Cookie", "sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict")])
        if name == "password":
            s = self.need_admin(allow_change=True)
            if s is None:
                return
            d = self.read_json_body(2000)
            a = read_json(ADMIN_FILE, {})
            _, h = hash_pw(str(d.get("old", "")), a["salt"])
            if not secrets.compare_digest(h, a["hash"]):
                return self.jerr(400, "Purana password galat hai")
            new = str(d.get("new", ""))
            nu = str(d.get("user", "")).strip() or a["user"]
            if len(new) < 8 or new.lower() == DEFAULT_PASS.lower():
                return self.jerr(400, "Naya password kam az kam 8 characters ka aur alag hona chahiye")
            if not re.fullmatch(r"[A-Za-z0-9_.@-]{3,32}", nu):
                return self.jerr(400, "Username 3-32 characters (letters, numbers, . _ - @)")
            salt, h = hash_pw(new)
            write_json(ADMIN_FILE, {"user": nu, "salt": salt, "hash": h, "must_change": False})
            s["must_change"] = False
            s["user"] = nu
            return self.jok()
        s = self.need_admin()
        if s is None:
            return
        if name == "content":
            d = self.read_json_body(3_000_000)
            save_content(d.get("content"))
            return self.jok()
        if name == "secrets":
            d = self.read_json_body(5000)
            cur = secrets_cfg()
            for k in ("smtp_host", "smtp_user", "notify_to"):
                cur[k] = str(d.get(k, cur.get(k, ""))).strip()[:200]
            cur["smtp_port"] = int(d.get("smtp_port") or 587)
            cur["smtp_ssl"] = bool(d.get("smtp_ssl"))
            if d.get("smtp_pass") and d["smtp_pass"] != "********":
                cur["smtp_pass"] = str(d["smtp_pass"])
            write_json(SECRETS_FILE, cur)
            return self.jok()
        if name == "test-email":
            ok, msg = send_mail("Test email - Swat Online Application Center", "Email notifications theek kaam kar rahi hain.")
            return self.jok(sent=ok, message=msg)
        if name == "upload":
            nm = (q.get("name") or ["file"])[0]
            _, ext = safe_name(nm)
            lim = MAX_VID if ext in VID_EXT else MAX_IMG
            final, n = self.save_raw_upload(UPLOADS, lim, IMG_EXT | VID_EXT, nm)
            return self.jok(url="/uploads/" + final, name=final, size=n, kind="video" if ext in VID_EXT else "image")
        if name == "media-delete":
            d = self.read_json_body(2000)
            p = self.safe_join(UPLOADS, str(d.get("name", "")))
            if p and os.path.isfile(p):
                os.remove(p)
            return self.jok()
        if name == "inquiry-update":
            d = self.read_json_body(10_000)
            if d.get("status") not in ("New", "Received", "In Progress", "Waiting for Documents", "Completed", "Cancelled"):
                return self.jerr(400, "Status galat hai")
            with db() as c:
                c.execute("UPDATE inquiries SET status=?, note=?, public_note=? WHERE id=?",
                          (d["status"], str(d.get("note", ""))[:2000], str(d.get("public_note", ""))[:500], int(d["id"])))
            return self.jok()
        if name == "inquiry-delete":
            d = self.read_json_body(2000)
            with db() as c:
                for r in c.execute("SELECT stored FROM docs WHERE inquiry_id=?", (int(d["id"]),)).fetchall():
                    try:
                        os.remove(os.path.join(PRIVATE, r["stored"]))
                    except OSError:
                        pass
                c.execute("DELETE FROM docs WHERE inquiry_id=?", (int(d["id"]),))
                c.execute("DELETE FROM inquiries WHERE id=?", (int(d["id"]),))
            return self.jok()
        if name == "history-restore":
            d = self.read_json_body(2000)
            p = self.safe_join(HISTORY, str(d.get("file", "")))
            if not p or not os.path.isfile(p):
                return self.jerr(404, "Version nahi mila")
            save_content(read_json(p, {}))
            return self.jok()
        if name == "reset-content":
            save_content(read_json(DEFAULT_CONTENT, {}))
            return self.jok()
        self.jerr(404, "Not found")


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def local_ips():
    import socket
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    return sorted(ips)


def make_server(port=None, host=None):
    init_storage()
    return Server((host or HOST, port or PORT), Handler)


def main():
    srv = make_server()
    print("=" * 66)
    print("  SWAT ONLINE APPLICATION CENTER - website chal gayi")
    print("  Website : http://localhost:%d" % srv.server_address[1])
    for ip in local_ips():
        print("            http://%s:%d   (usi WiFi ke doosre devices ke liye)" % (ip, srv.server_address[1]))
    print("  Admin   : http://localhost:%d/admin" % srv.server_address[1])
    a = read_json(ADMIN_FILE, {})
    if a.get("must_change"):
        print("  Pehli dafa login:  username = %s    password = %s" % (DEFAULT_USER, DEFAULT_PASS))
        print("  (login ke baad software khud naya password mangega)")
    print("  Band karne ke liye ye window band karein ya Ctrl+C dabayein.")
    print("=" * 66)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
