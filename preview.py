#!/usr/bin/env python3
"""本機預覽：把 _data 裡的內容組成 data.local.json，再開一個本機網站。

用法：在這個資料夾打開終端機，輸入  python3 preview.py
然後用瀏覽器打開 http://localhost:8000
（正式網站不需要這個檔案，GitHub Pages 會自己產生 data.json）
"""
import glob, http.server, json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def folder(name):
    out = {}
    for p in sorted(glob.glob(os.path.join(ROOT, "_data", name, "*.json"))):
        out[os.path.splitext(os.path.basename(p))[0]] = read(p)
    return out

def build():
    data = {
        "site": read(os.path.join(ROOT, "_data", "site.json")),
        "topics": folder("topics"),
        "qa": read(os.path.join(ROOT, "_data", "qa.json")),
        "notes": folder("notes"),
    }
    with open(os.path.join(ROOT, "data.local.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"已更新 data.local.json：{len(data['topics'])} 個主題、{len(data['notes'])} 篇筆記、{len(data['qa'])} 題問答")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def do_GET(self):
        # 本機沒有 Jekyll，所以 data.json 直接回 404，網站會改讀 data.local.json
        if self.path.split("?")[0] == "/data.json":
            self.send_error(404)
            return
        if self.path.split("?")[0] == "/data.local.json":
            build()
        super().do_GET()
    def log_message(self, *a):
        pass

if __name__ == "__main__":
    build()
    if "--build-only" in sys.argv:
        sys.exit()
    port = int(os.environ.get("PORT", 8000))
    print(f"本機預覽：http://localhost:{port}（按 Ctrl+C 結束）")
    http.server.ThreadingHTTPServer(("", port), Handler).serve_forever()
