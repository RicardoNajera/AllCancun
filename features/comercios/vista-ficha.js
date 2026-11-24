/**
 * All Cancún — Comercios · Ficha de un negocio
 */

import { escape } from "../shared/ui.js";
import {
  nombreCategoria,
  precioTexto,
  img,
  iniciales,
  tieneWhatsApp,
} from "./bits.js";
import { enlaceWhatsApp } from "./datos.js";

/** Una fila del menú. Si está agotado se marca, pero no se esconde. */
export function producto(negocio, p) {
  const precio = precioTexto(p.precio_centavos);
  const agotado = p.disponible === false;

  const media = p.foto_url
    ? img(p.foto_url, { clase: "co-prod__img", alt: p.nombre })
    : "";

  /* El botón lleva los datos en atributos: al hacer click la vista arma el
     carrito con ellos. Así no hay que volver a consultar la base. */
  const boton = agotado
    ? `<span class="co-btn co-btn--off">Agotado</span>`
    : `<button class="co-btn co-btn--add" type="button"
         data-agregar
         data-id="${escape(p.id)}"
         data-nombre="${escape(p.nombre)}"
         data-precio="${Number(p.precio_centavos) || 0}">Agregar</button>`;

  return `
    <li class="co-prod${agotado ? " is-off" : ""}">
      ${media ? `<span class="co-prod__media">${media}</span>` : ""}
      <div class="co-prod__body">
        <p class="co-prod__name">${escape(p.nombre)}</p>
        ${p.descripcion ? `<p class="co-prod__desc">${escape(p.descripcion)}</p>` : ""}
        ${precio ? `<p class="co-prod__pie"><span class="co-prod__precio">${escape(precio)}</span></p>` : ""}
      </div>
      ${boton}
    </li>
  `;
}

/** La ficha completa: portada, datos del negocio y su menú. */
export function ficha(negocio, productos = []) {
  const portada = negocio.foto_url
    ? img(negocio.foto_url, { clase: "co-hero__img", alt: "", lazy: false })
    : `<span class="co-hero__vacio"></span>`;

  const sinWa = !tieneWhatsApp(negocio);

  /* Sin tabla de logos todavía: la inicial grande hace de identidad
     y la portada hace de foto. Cuando exista `logo_url` se cambia aquí. */
  const logo = `<span class="co-ficha__logo co-ficha__logo--ini">${escape(
    iniciales(negocio.nombre)
  )}</span>`;

  const menu = productos.length
    ? `<ul class="co-prods">${productos.map((p) => producto(negocio, p)).join("")}</ul>`
    : `<p class="co-ficha__vacio">Este negocio todavía no publicó su menú.</p>`;

  return `
    <article class="co-ficha">
      <div class="co-hero">
        ${portada}
      </div>

      <header class="co-ficha__cab">
        ${logo}
        <h2 class="co-ficha__name">${escape(negocio.nombre)}</h2>
        <p class="co-ficha__meta">${escape(nombreCategoria(negocio.categoria))}${
          negocio.colonia ? ` · ${escape(negocio.colonia)}` : ""
        }</p>
        ${
          negocio.descripcion
            ? `<p class="co-ficha__desc">${escape(negocio.descripcion)}</p>`
            : ""
        }
        ${
          sinWa
            ? `<p class="co-ficha__sinwa">Este negocio aún no tiene WhatsApp de contacto.</p>`
            : `<a class="co-btn co-btn--wa co-btn--bloque" href="${escape(
                enlaceWhatsApp(negocio.whatsapp, `Hola ${negocio.nombre}, los contacto desde All Cancún.`)
              )}" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>`
        }
      </header>

      <section class="co-menu">
        <h3 class="co-seccion">Menú</h3>
        ${menu}
        <div class="co-barra" data-barra-carrito hidden>
          <span class="co-barra__txt" data-barra-txt></span>
          <a class="co-btn co-btn--wa" href="#carrito">Ver carrito</a>
        </div>
      </section>
    </article>
  `;
}
