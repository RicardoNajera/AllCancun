#!/usr/bin/env python3
"""Descarga fotos REALES de Cancún desde Wikimedia Commons.

Cada entrada está verificada por su nombre de archivo/título de Commons, es decir,
el tema descrito es de Cancún (Mercado 28, negocios cancunenses, calles, comida
callejera). Licencias libres (CC BY / CC BY-SA / dominio público); revisar autor
en la página del archivo antes de publicar.

Uso:
    python3 scripts/fetch-cancun-images.py --only tianguis comercios
    python3 scripts/fetch-cancun-images.py --list
"""
import argparse
import json
import os
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "images")
CREDITS = os.path.join(ROOT, "assets", "images", "CREDITS.md")

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "AllCancunApp/1.0 (local asset script)"}
WIDTH = 720

# Clave = prefijo de archivo destino. Valores = títulos exactos en Commons.
SOURCES = {
    # Tianguis / mercado: Mercado 28, el mercado más representativo de Cancún.
    "tianguis": [
        "File:Mercado 28 Cancun, Mexico Julio 2012 - 01.jpg",
        "File:Mercado 28 Cancun, Mexico (8951343195).jpg",
        "File:Mexican Souvenirs (12983408614).jpg",
        "File:Mercado 28 (4068002661).jpg",
        "File:Mercado 28, Cancún 2014.jpg",
    ],
    # Comercios: negocios reales de Cancún (fachadas, locales, tiendas).
    "comercios": [
        "File:Negocios cancunenses 27.jpg",
        "File:Cancun, Quintana Roo, Mexico - Chedraui Junio 2021.jpg",
        "File:Negocios cancunenses 17.jpg",
        "File:Cancun, Mexico - Fuente y Office Depot.jpg",
        "File:Negocios cancunenses 04.jpg",
    ],
    # Calles reales de Cancún (Avenida Tulum, Sm. 29, Avenida Yaxchilán).
    "calles": [
        "File:Avenida Tulum, Cancun, Quintana Roo, Mexico 2021.jpg",
        "File:Avenida Tulum, Cancun, Quintana Roo, Mexico Junio 2021.jpg",
        "File:Avenida Yaxchilan at night in Cancun, Mexico.jpg",
        "File:Centro Cancún noche 01.jpg",
        "File:Cancun, Quintana Roo, Mexico - Calle con arboles y flores.jpg",
    ],
    # Comida callejera de Cancún.
    "comida": [
        "File:Food Stalls along the beach - Cancun QR 2020.jpg",
        "File:Eating Tacos at a food truck - Cancun QR 2020.jpg",
        "File:El kibi.jpg",
        "File:Panuchos! Absolutely delicious - 8 pesos.jpg",
        "File:Parque de las Palapas 1.jpg",
    ],
}


def image_info(titles: list[str]) -> dict[str, dict]:
    params = {
        "action": "query",
        "format": "json",
        "titles": "|".join(titles),
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": str(WIDTH),
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as resp:
        data = json.load(resp)
    info = {}
    for page in data.get("query", {}).get("pages", {}).values():
        details = page.get("imageinfo", [{}])[0]
        meta = details.get("extmetadata", {})
        info[page["title"]] = {
            "url": details.get("thumburl"),
            "page": details.get("descriptionurl"),
            "w": details.get("thumbwidth"),
            "h": details.get("thumbheight"),
            "artist": meta.get("Artist", {}).get("value", ""),
            "license": meta.get("LicenseShortName", {}).get("value", ""),
        }
    return info


def fetch(category: str, titles: list[str], info: dict[str, dict]) -> list[str]:
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for index, title in enumerate(titles, start=1):
        dest_name = f"{category}-{index}.jpg"
        dest = os.path.join(OUT, dest_name)
        details = info.get(title)
        if not details or not details.get("url"):
            print(f"FALLO {dest_name}: no encontrado en Commons ({title})")
            continue
        try:
            req = urllib.request.Request(details["url"], headers=UA)
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if len(data) < 5000:
                raise ValueError("archivo demasiado pequeño")
            with open(dest, "wb") as handle:
                handle.write(data)
            rows.append(
                f"| `{dest_name}` | [{title[5:]}]({details['page']}) | "
                f"{details['license'] or 's/d'} | {details['artist'] or 's/d'} |"
            )
            print(f"OK    {dest_name}  {details['w']}x{details['h']}  {title}")
        except Exception as error:  # noqa: BLE001
            print(f"FALLO {dest_name}: {error}")
        time.sleep(1.2)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*", help="Categorías a descargar")
    parser.add_argument("--list", action="store_true", help="Solo listar la fuente")
    args = parser.parse_args()

    targets = args.only or list(SOURCES.keys())
    if args.list:
        for name in targets:
            print(f"\n{name}:")
            for title in SOURCES[name]:
                print(f"  {title}")
        return 0

    credit_rows = []
    for name in targets:
        titles = SOURCES[name]
        try:
            info = image_info(titles)
        except Exception as error:  # noqa: BLE001
            print(f"FALLO consultando {name}: {error}")
            time.sleep(5)
            continue
        credit_rows.extend(fetch(name, titles, info))
        time.sleep(2)

    if credit_rows and os.path.exists(CREDITS):
        with open(CREDITS, "a", encoding="utf-8") as handle:
            handle.write("\n" + "\n".join(credit_rows) + "\n")
    elif credit_rows:
        with open(CREDITS, "w", encoding="utf-8") as handle:
            handle.write("# Créditos de imágenes\n\n| Archivo | Fuente (Wikimedia Commons) | Licencia | Autor |\n| --- | --- | --- | --- |\n")
            handle.write("\n".join(credit_rows) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
