# Base de datos — All Cancún

## Orden de ejecución (IMPORTANTE)

En el **SQL Editor de Supabase**, uno por uno, en este orden exacto:

| # | Archivo | Qué crea |
|---|---------|----------|
| 1 | `perfiles.sql` | Tabla `perfiles`, enum `rol`, RLS. La base de todo. |
| 2 | `permisos.sql` | Tabla `permisos` (comprar / vender / conducir) y `tiene_permiso()`. |
| 3 | `negocios.sql` | Tabla `negocios`, categorías, estados, slug. |
| 4 | `productos.sql` | Tabla `productos` (el menú de cada negocio). |
| 5 | `resenas.sql` | Tabla `resenas`, vista `negocios_puntuacion`, RPC `ya_comente()`. |

> `permisos.sql` **debe** ir antes que `negocios.sql`: el trigger que
> publica un negocio inserta en `permisos`.
> Aun así, `negocios.sql` está blindado: si lo corres antes, no truena,
> solo se salta esa parte.

## Cómo saber que salió bien

Cada archivo termina con un bloque de **verificación** que imprime una
tabla. Debes ver todos los valores como `OK`. Si alguno dice `FALTA`,
el archivo anterior no se ejecutó.

## Qué significa cada tabla

```
perfiles    → quién eres (nombre, apodo, rol principal)
permisos    → qué puedes hacer (comprar, vender, conducir)
negocios    → tu tienda (una fila por negocio)
productos   → tu menú (muchas filas por negocio)
resenas     → lo que opinan tus clientes
```

## Por qué `permisos` y no solo `rol`

`perfiles.rol` guarda **un** valor. Una persona no puede ser `cliente` y
`comercio` a la vez. Pero Juana quiere comprar con la misma cuenta con la
que vende, y un mototaxista quiere conducir sin dejar de comprar.

`permisos` se **acumula**:

```
Juana        → rol: comercio   permisos: {comprar, vender}
Mototaxista  → rol: operador   permisos: {comprar, conducir}
Cliente      → rol: cliente    permisos: {comprar}
```

Todos pueden comprar. Cada uno suma lo suyo.

## Seguridad

Toda tabla tiene **RLS encendido**. Nadie puede ver ni tocar filas de otro:

- `negocios` → solo lo ve su dueño; los `activo` los ve todo el mundo.
- `productos` → mismo criterio, heredado del negocio.
- `resenas` → cada quien escribe la suya, una por negocio.
- `permisos` → solo lectura propia. **Nadie puede darse permiso a sí mismo.**

## Después de correr los SQL

Copia la salida de las 5 verificaciones y pásala. Si todo dice `OK`,
seguimos con la PWA de Comercios (ya está escrita, falta conectarla).
