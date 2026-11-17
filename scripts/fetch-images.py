#!/usr/bin/env python3
"""Descarga las fotos de cada categoría a assets/images según los IDs de Unsplash."""
import argparse
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "images")

PHOTOS = {
    # Mototaxis / transporte en moto por la ciudad
    "mototaxis": [
        "1558981806-ec527fa84c39",
        "1558618666-fcd25c85cd64",
        "1568772585407-9361f9bf3a87",
        "1591638331781-45a1e1b0d1c1",
        "1508357501282-8ee0f0f2c0b2",
    ],
    # Tianguis: puestos callejeros con toldos, ropa y mercado
    "tianguis": [
        "1488459716781-31db52582fe9",
        "1542838132-92c53300491e",
        "1560472354-b33ff0c44a43",
        "1595246140625-573b715d11dc",
        "1556909114-f6e7ad7d3136",
    ],
    # Comercios de barrio: tienda, veterinaria, mercería, vasos/artículos
    "comercios": [
        "1441986300917-64674bd600d8",
        "1567401893414-76b7b1e5a7a5",
        "1604014237800-1c9102c219da",
        "1583337130417-3346a1be7dee",
        "1563514227-84e3ff7f86e1",
    ],
    # Mantenimiento residencial: albañilería, carpintería, cerrajería, herrería, vidrio
    "mantenimiento": [
        "1504307651254-35680f356dfd",
        "1581093450021-4a7360e9a6b5",
        "1621905251189-08b45d6a269e",
        "1517420704952-d9f39e95b43e",
        "1517646287270-a5a9ca602e5c",
    ],
    # Solo Mujeres: uñas, maquillaje, bolsas, zapatos, salón, compras
    "mujeres": [
        "1604654894610-df63bc536371",
        "1522335789203-aabd1fc54bc9",
        "1584917865442-de89df76afd3",
        "1543163521-1bf539c55dd2",
        "1560066984-138dadb4c035",
        "1512496015851-a90fb38ba796",
    ],
    # Solo Hombres: calzado, camisa, perfume, barbería, ropa
    "hombres": [
        "1549298916-b41d501d3772",
        "1521572163474-6864f9cf17ab",
        "1594035910387-fea47794261f",
        "1503951914875-452162b0f3f1",
        "1490578474895-699cd4e2cf59",
    ],
    # Estudiantes: cuadernos, útiles, mochila, escritorio
    "estudiantes": [
        "1503676260728-1c00da094a0b",
        "1523240795612-9a054b0db644",
        "1456513080510-7bf3a84b82f8",
        "1553062407-98eeb64c6a62",
        "1513475382585-d06e58bcb0e0",
    ],
    # Salud y bienestar: productos naturales, spa, cuidado personal
    "salud": [
        "1600334089648-b0d9d3028eb2",
        "1544367567-0f2fcb009e0b",
        "1512290923902-8a9f81dc236c",
        "1608571423902-eed4a5ad8108",
        "1519823551278-64ac92734fb1",
    ],
    # Comida / delivery
    "comida": [
        "1504674900247-0877df9cc836",
        "1565299624946-b28f40a0ae38",
        "1513104890138-7c749659a591",
        "1550547660-d9450f859349",
        "1529042410759-befb1204b468",
    ],
}

UA = {"User-Agent": "Mozilla/5.0 (AllCancun-assets)"}


def download(category, ids):
    os.makedirs(OUT, exist_ok=True)
    ok = fail = 0
    for index, pid in enumerate(ids, start=1):
        dest = os.path.join(OUT, f"{category}-{index}.jpg")
        url = f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w=640&h=900&q=70"
        try:
            request = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(request, timeout=25) as response:
                data = response.read()
            if len(data) < 5000:
                raise ValueError("archivo demasiado pequeño")
            with open(dest, "wb") as handle:
                handle.write(data)
            ok += 1
        except Exception as error:  # noqa: BLE001
            fail += 1
            print(f"FALLO {category}-{index}: {error}")
    print(f"{category}: ok={ok} fallos={fail}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*", help="Categorías a descargar")
    args = parser.parse_args()
    targets = args.only or list(PHOTOS.keys())
    for name in targets:
        download(name, PHOTOS[name])
