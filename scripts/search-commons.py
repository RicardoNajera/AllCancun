#!/usr/bin/env python3
"""Busca imágenes en Wikimedia Commons y lista título + tamaño + URL.

Uso:
    python3 scripts/search-commons.py "mototaxi Cancun" "tianguis Cancun"
"""
import json
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "AllCancunApp/1.0 (local dev script)"


def search(query: str, limit: int = 12) -> list[dict]:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": "900",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    pages = data.get("query", {}).get("pages", {})
    out = []
    for page in sorted(pages.values(), key=lambda p: p.get("index", 99)):
        info = page.get("imageinfo", [{}])[0]
        out.append(
            {
                "title": page["title"],
                "w": info.get("thumbwidth") or info.get("width"),
                "h": info.get("thumbheight") or info.get("height"),
                "url": info.get("thumburl") or info.get("url"),
                "page": info.get("descriptionurl"),
            }
        )
    return out


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 1
    for query in argv:
        print(f"\n=== {query} ===")
        try:
            results = search(query)
        except Exception as exc:  # noqa: BLE001
            print(f"  error: {exc}")
            continue
        if not results:
            print("  (sin resultados)")
            continue
        for item in results:
            print(f"  {item['w']}x{item['h']}  {item['title']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
