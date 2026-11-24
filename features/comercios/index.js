/**
 * All Cancún — Comercios · Vista
 *
 * Conecta el panel del comerciante con la app del cliente:
 * esto lee lo que el comerciante publicó en Supabase.
 *
 * Dos pantallas dentro de la misma vista:
 *   #comercios              → lista de negocios publicados
 *   #comercios/<slug>       → ficha con menú y WhatsApp
 *
 * Las fotos viven en Cloudflare R2; aquí solo se usa su URL.
 */

import { hero, sectionTitle } from "../shared/ui.js";
import { content } from "./content.js";
import { listarNegocios, getNegocioPorSlug, getMenu, PAGINA } from "./datos.js";
import { agregar, leer } from "../carrito/datos.js";
import { lista } from "./vista-lista.js";
import { ficha } from "./vista-ficha.js";
import { cargando, vacio, error as estadoError } from "./vista-estados.js";

/* Lee el slug de la ruta: "#comercios/hilo-y-trapillo" → "hilo-y-trapillo" */
function slugDeRuta() {
  const partes = String(location.hash || "").replace(/^#/, "").split("/");
  return partes[1] ? decodeURIComponent(partes[1]) : "";
}

/* Lo mismo, pero desde la ruta que entrega el router. */
function slugDe(route) {
  const partes = String(route || "").replace(/^#/, "").split("/");
  return partes[1] ? decodeURIComponent(partes[1]) : "";
}

/*
 * La ficha se arma después del render: aquí solo va el esqueleto, para no
 * dejar un hueco en blanco mientras llega la respuesta de Supabase.
 */
function esqueletoFicha(route) {
  const slug = slugDe(route) || slugDeRuta();
  return {
    html: `<div class="co-mount" data-vista="ficha">${cargando()}</div>`,
    onMount(root) {
      const mount = root.querySelector(".co-mount");
      if (mount) pintarFicha(mount, slug);
    },
  };
}

export default {
  id: "comercios",
  accent: "comercios",
  styles: "features/comercios/view.css",
  content,

  /* La ruta llega como contexto ("comercios/hilo-y-trapillo"). Se prefiere
     esa sobre location.hash porque el navegador escribe el hash DESPUÉS de
     montar la vista: leerlo aquí devolvería la ruta anterior. */
  render({ category, route } = {}) {
    if (slugDe(route) || (!route && slugDeRuta())) return esqueletoFicha(route);

    const cover = (category?.images || [])[0];

    return {
      html: `
        ${hero({
          cover,
          eyebrow: content.eyebrow,
          title: content.title,
          lead: content.lead,
        })}
        <div class="fv-body co-body">
          ${sectionTitle("Negocios cerca de ti")}
          <div class="co-mount" data-vista="lista">${cargando()}</div>
        </div>
      `,
      onMount(root) {
        const mount = root.querySelector(".co-mount");
        if (mount) pintarLista(mount);
      },
    };
  },
};

/* ---------------- Lista ---------------- */

async function pintarLista(mount) {
  let negocios = [];
  let desde = 0;

  mount.innerHTML = cargando();

  const { negocios: primera, hayMas: mas, error } = await listarNegocios({ desde: 0 });

  if (error) {
    mount.innerHTML = estadoError(error);
    mount.querySelector('[data-accion="reintentar"]')?.addEventListener("click", () =>
      pintarLista(mount)
    );
    return;
  }

  negocios = primera;

  if (!negocios.length) {
    mount.innerHTML = vacio(false);
    return;
  }

  mount.innerHTML = lista(negocios, mas);

  // "Ver más" pide la siguiente página. Sin esto, el navegador tendría
  // que bajar todos los negocios de golpe y el egress se dispara.
  mount.querySelector('[data-accion="mas"]')?.addEventListener("click", async (ev) => {
    const boton = ev.currentTarget;
    boton.disabled = true;
    boton.textContent = "Cargando…";

    desde += PAGINA;
    const { negocios: siguientes, hayMas } = await listarNegocios({ desde });

    negocios = negocios.concat(siguientes);
    mount.innerHTML = lista(negocios, hayMas);
  });
}

/* ---------------- Ficha ---------------- */

async function pintarFicha(mount, slug) {
  mount.innerHTML = cargando();

  const { negocio, error } = await getNegocioPorSlug(slug);

  if (error) {
    mount.innerHTML = estadoError(error);
    return;
  }

  if (!negocio) {
    mount.innerHTML = `
      <div class="co-estado">
        <p class="co-estado__title">Este negocio no está disponible</p>
        <p class="co-estado__txt">Puede que lo hayan despublicado.</p>
        <a class="co-mas" href="#comercios">Ver otros negocios</a>
      </div>
    `;
    return;
  }

  const { productos } = await getMenu(negocio.id);
  mount.innerHTML = ficha(negocio, productos);

  /* Agregar al carrito. Se escucha en el contenedor (un solo listener para
     todos los botones) y se confirma con un aviso corto en la barra. */
  const barra = mount.querySelector("[data-barra-carrito]");
  const barraTxt = mount.querySelector("[data-barra-txt]");

  const pintarBarra = () => {
    const carrito = leer();
    const grupo = carrito[String(negocio.id)];
    const piezas = grupo ? grupo.items.reduce((s, i) => s + i.cantidad, 0) : 0;
    const total = grupo ? grupo.items.reduce((s, i) => s + i.precio * i.cantidad, 0) : 0;

    if (!barra) return;
    barra.hidden = piezas === 0;
    if (barraTxt && piezas) {
      barraTxt.textContent = `${piezas} ${piezas === 1 ? "artículo" : "artículos"} · $${(
        total / 100
      ).toFixed(2)}`;
    }
  };

  mount.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-agregar]");
    if (!boton) return;

    agregar(negocio, {
      id: boton.dataset.id,
      nombre: boton.dataset.nombre,
      precio_centavos: Number(boton.dataset.precio) || 0,
    });

    // Confirmación inmediata: el botón parpadea a "Agregado".
    const texto = boton.textContent;
    boton.textContent = "Agregado";
    boton.disabled = true;
    setTimeout(() => {
      boton.textContent = texto;
      boton.disabled = false;
    }, 900);

    pintarBarra();
  });

  pintarBarra();
}
