#!/usr/bin/env python3
"""Lista archivos de una categoría de Wikimedia Commons (con subcategorías).

Uso:
    python3 scripts/commons-category.py "Category:Cancún" 200
"""
import json
import sys
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "AllCancunApp/1.0 (local dev script)"


def api(params: dict, retries: int = 4) -> dict:
    params = {"format": "json", **params}
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
                continue
            raise
    return {}


def members(category: str):
    files, subs, cont = [], [], None
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category,
            "cmlimit": "500",
        }
        if cont:
            params["cmcontinue"] = cont
        data = api(params)
        for item in data.get("query", {}).get("categorymembers", []):
            if item["ns"] == 6:
                files.append(item["title"])
            elif item["ns"] == 14:
                subs.append(item["title"])
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            break
        time.sleep(0.3)
    return files, subs


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 1
    root = argv[0]
    depth = int(argv[1]) if len(argv) > 1 else 1
    seen = set()

    def walk(cat: str, level: int):
        if cat in seen or level > depth:
            return
        seen.add(cat)
        try:
            files, subs = members(cat)
        except Exception as exc:  # noqa: BLE001
            print(f"# {cat} -> error: {exc}")
            return
        if files:
            print(f"\n## {cat} ({len(files)} archivos)")
            for f in files:
                print(f"  {f}")
        for sub in subs:
            walk(sub, level + 1)
            time.sleep(0.3)

    walk(root, 0)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
