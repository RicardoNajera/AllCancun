/**
 * All Cancún — Carrito · Vista
 *
 * Muestra lo que el visitante apartó en los comercios y le permite
 * mandar el pedido por WhatsApp al negocio. Todo vive en el teléfono
 * del cliente (localStorage); no hay cuentas ni pagos dentro de la app.
 */

import { hero, sectionTitle, escape } from "../../shared/ui.js";
import { content } from "./content.js";
import {
  leer,
  quitar,
  vaciarNegocio,
  totalPiezas,
  totalCentavos,
  mensajePedido,
} from "../../carrito/datos.js";
import { enlaceWhatsApp } from "../../comercios/datos.js";

const pesos = (centavos) => `$${(Number(centavos || 0) / 100).toFixed(2)}`;

/** Un negocio con sus productos y el botón de mandar el pedido. */
function grupoHTML(grupo) {
  const total = grupo.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const puedePedir = String(grupo.whatsapp || "").replace(/\D/g, "").length >= 10;

  const filas = grupo.items
    .map(
      (i) => `
        <li class="ca-item">
          <div class="ca-item__body">
            <p class="ca-item__name">${escape(i.nombre)}</p>
            <p class="ca-item__price">${pesos(i.precio)} c/u</p>
          </div>
          <div class="ca-stepper">
            <button type="button" class="ca-step" data-quitar="${escape(i.id)}"
              aria-label="Quitar uno">−</button>
            <span class="ca-qty">${i.cantidad}</span>
            <span class="ca-qty-txt">${pesos(i.precio * i.cantidad)}</span>
          </div>
        </li>
      `
    )
    .join("");

  return `
    <section class="ca-grupo" data-negocio="${escape(grupo.id)}">
      <header class="ca-grupo__cab">
        <a class="ca-grupo__name" href="#comercios/${escape(grupo.slug)}">${escape(grupo.nombre)}</a>
        <span class="ca-grupo__total">${pesos(total)}</span>
      </header>
      <ul class="ca-items">${filas}</ul>
      ${
        puedePedir
          ? `<a class="ca-btn ca-btn--wa" data-pedir="${escape(grupo.id)}"
               href="${escape(enlaceWhatsApp(grupo.whatsapp, mensajePedido(grupo)))}"
               target="_blank" rel="noopener noreferrer">Mandar pedido por WhatsApp</a>`
          : `<p class="ca-sinwa">Este negocio no tiene WhatsApp registrado.</p>`
      }
    </section>
  `;
}

export default {
  id: "carrito",
  accent: "comercios",
  styleBase: "features/shared/feature-view.css",
  styles: "features/tabs/shared/tab-view.css",
  content,

  render({ navigate } = {}) {
    const carrito = leer();
    const grupos = Object.values(carrito);
    const piezas = totalPiezas(carrito);

    const cuerpo = grupos.length
      ? `<div class="ca-lista">${grupos.map(grupoHTML).join("")}</div>
         <p class="ca-nota">Los pagos se hacen directo con el negocio. All Cancún no cobra comisión.</p>`
      : `<div class="ca-vacio">
           <p class="ca-vacio__title">${content.emptyTitle}</p>
           <p class="ca-vacio__txt">${content.emptyText}</p>
           <a class="ca-btn" href="#comercios">Ver comercios</a>
         </div>`;

    return {
      html: `
        ${hero({
          eyebrow: content.eyebrow,
          title: content.title,
          lead: grupos.length
            ? `${piezas} ${piezas === 1 ? "artículo" : "artículos"} · ${pesos(totalCentavos(carrito))}`
            : content.lead,
          status: grupos.length ? "Pedido listo" : "Sin artículos",
        })}
        <div class="tv-body">
          ${grupos.length ? sectionTitle("Tu pedido") : ""}
          ${cuerpo}
        </div>
      `,
      onMount(root) {
        root.addEventListener("click", (ev) => {
          /* Quitar una pieza: se repinta la vista en el mismo lugar para que
             el cliente vea bajar el total al instante. */
          const menos = ev.target.closest("[data-quitar]");
          if (menos) {
            const seccion = menos.closest("[data-negocio]");
            quitar(seccion.dataset.negocio, menos.dataset.quitar);
            navigate?.("carrito");
            return;
          }

          /* Al mandar el pedido el carrito de ese negocio se vacía: ya viajó
             por WhatsApp y no debe quedarse como pendiente. */
          const pedir = ev.target.closest("[data-pedir]");
          if (pedir) vaciarNegocio(pedir.dataset.pedir);
        });
      },
    };
  },
};
