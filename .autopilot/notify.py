#!/usr/bin/env python3
"""Helper notifikasi Telegram untuk autopilot Magnoo.

Dipakai robot (Claude) untuk melaporkan progres ke owner lewat HP.

Penggunaan:
    python3 notify.py "teks pesan"                 # kirim teks
    python3 notify.py "caption" /path/gambar.png   # kirim foto + caption
    echo "teks panjang" | python3 notify.py -      # baca teks dari stdin

chat_id owner dibaca dari .autopilot/owner_chat.txt (diisi otomatis oleh
magnoo_bot.py saat owner mengirim pesan apa pun ke bot).
"""
import os
import sys
import json
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))


def _load_token():
    tok = os.environ.get("MAGNOO_BOT_TOKEN")
    if tok:
        return tok.strip()
    try:
        with open(os.path.join(HERE, "bot_token.txt")) as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""


TOKEN = _load_token()
API = f"https://api.telegram.org/bot{TOKEN}"
CHAT_FILE = os.path.join(HERE, "owner_chat.txt")


def owner_chat_id():
    try:
        with open(CHAT_FILE) as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def send_message(chat_id, text):
    # Telegram batas 4096 char; potong aman.
    text = text[:4000]
    data = urllib.parse.urlencode({"chat_id": chat_id, "text": text}).encode()
    with urllib.request.urlopen(f"{API}/sendMessage", data=data, timeout=60) as r:
        return json.load(r)


def send_photo(chat_id, caption, path):
    # multipart/form-data manual (tanpa dependensi luar)
    boundary = "----magnoozilla7395"
    with open(path, "rb") as f:
        photo = f.read()
    parts = []
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n{chat_id}\r\n".encode())
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n{caption[:1000]}\r\n".encode())
    parts.append(
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"photo\"; "
        f"filename=\"{os.path.basename(path)}\"\r\nContent-Type: image/png\r\n\r\n".encode()
    )
    parts.append(photo)
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(parts)
    req = urllib.request.Request(f"{API}/sendPhoto", data=body)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def main():
    chat_id = owner_chat_id()
    if not chat_id:
        print("BELUM ADA chat_id owner. Minta owner kirim 1 pesan ke bot dulu "
              "(owner_chat.txt masih kosong).", file=sys.stderr)
        sys.exit(2)

    args = sys.argv[1:]
    if not args:
        print("Pakai: notify.py \"pesan\" [gambar.png]", file=sys.stderr)
        sys.exit(1)

    text = args[0]
    if text == "-":
        text = sys.stdin.read()

    photo = args[1] if len(args) > 1 else None
    try:
        if photo and os.path.exists(photo):
            res = send_photo(chat_id, text, photo)
        else:
            res = send_message(chat_id, text)
        print("OK" if res.get("ok") else f"GAGAL: {res}")
    except Exception as e:
        print(f"ERROR kirim Telegram: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
