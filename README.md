# All Cancún

Progressive Web App (PWA) exclusiva para teléfono en orientación vertical.
Pantalla en blanco lista para recibir el diseño.

## Estructura

```
All Cancún/
├── index.html              # Pantalla en blanco, contenedor vertical (100dvh)
├── manifest.webmanifest    # Manifest PWA (standalone, portrait, tema blanco)
├── sw.js                   # Service Worker (offline / cache app shell)
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable-512.png
```

## Cómo probarla

El Service Worker y el manifest requieren HTTP (no `file://`):

```bash
cd "~/Desktop/All Cancún"
python3 -m http.server 8080
```

Abre `http://localhost:8080` en el navegador y usa el modo responsive de las
DevTools con un viewport de teléfono (por ejemplo iPhone 14 Pro, 393×852).

Para instalarla en un teléfono real necesita estar publicada en HTTPS
(Netlify, Vercel, GitHub Pages, etc.).

## Notas de diseño

- Solo móvil: ancho máximo 480px centrado, `100dvh` y `safe-area-inset` para
  notch y barra inferior.
- Fondo y tema: blanco puro (`#ffffff`), sin contenido todavía.
- `orientation: "portrait"` en el manifest.
- Zoom desactivado (`user-scalable=no`) para comportamiento tipo app.
