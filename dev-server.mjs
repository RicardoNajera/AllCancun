/**
 * All Cancún — Servidor de desarrollo en vivo
 *
 * Uso:
 *     node dev-server.mjs          (o: node dev-server.mjs --port 5500)
 *
 * Abre http://127.0.0.1:8766 en el navegador.
 * Cualquier cambio en HTML/CSS/JS recarga la página automáticamente.
 * No requiere instalar nada: usa solo Node.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : 8766);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/* Cliente de recarga: se inyecta antes de </body> */
const LIVERELOAD = `
<script>
  (function () {
    var es = new EventSource("/__livereload");
    es.onmessage = function (e) {
      if (e.data === "reload") {
        es.close();
        location.reload();
      }
    };
    es.onerror = function () {
      /* El servidor se reinició: reintenta conectar */
    };
  })();
</script>
`;

const clients = new Set();
let reloadTimer = null;

/* Vigila el proyecto y avisa a los navegadores */
function scheduleReload(filename) {
  if (filename && /(^|\/)(\.git|node_modules|\.[^/]*\.swp)/.test(filename)) return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    console.log(`↻  recarga  ·  ${filename || "cambio"}`);
    for (const res of clients) res.write("data: reload\n\n");
  }, 60);
}

fs.watch(ROOT, { recursive: true }, (_event, filename) => scheduleReload(filename));

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  /* Endpoint de Server-Sent Events */
  if (url.pathname === "/__livereload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let filePath = path.join(ROOT, decodeURIComponent(url.pathname));
  if (url.pathname === "/") filePath = path.join(ROOT, "index.html");

  /* Nunca salir de la carpeta del proyecto */
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Prohibido");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 — No existe: ${url.pathname}`);
      console.log(`404  ${url.pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    /* El service worker estorba en desarrollo: se desactiva */
    if (url.pathname === "/sw.js") {
      res.writeHead(200, { "Content-Type": MIME[".js"], "Cache-Control": "no-store" });
      res.end("/* dev: service worker desactivado */\nself.addEventListener('install', () => self.skipWaiting());\n");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(500).end("Error leyendo el archivo");
        return;
      }

      if (ext === ".html") {
        let html = data.toString("utf8");
        html = html.includes("</body>")
          ? html.replace("</body>", `${LIVERELOAD}</body>`)
          : html + LIVERELOAD;
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
        res.end(html);
        return;
      }

      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(data);
    });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("  All Cancún — modo desarrollo en vivo");
  console.log(`  ➜  http://127.0.0.1:${PORT}`);
  console.log("");
  console.log("  Guarda cualquier archivo y el navegador se recarga solo.");
  console.log("  Ctrl+C para detener.");
  console.log("");
});
