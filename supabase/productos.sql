-- ════════════════════════════════════════════════════════════════════
--  ALL CANCÚN · Supabase · 2 de 3 · PRODUCTOS
--  Pégalo COMPLETO en el SQL Editor y pulsa RUN.
--  Corre DESPUÉS de negocios.sql.
--
--  Qué hace:
--    1. Borra lo anterior (se puede correr las veces que quieras)
--    2. Crea public.productos — cada producto pertenece a UN negocio
--    3. Da permisos (GRANT)
--    4. Activa RLS: el dueño gestiona su menú, todos leen lo publicado
--    5. Mantiene actualizado_en solo
--
--  Caso real: "Jugos Naturales Juana" vende:
--    jugo verde $35 · licuado de plátano $45 · agua de horchata $25
--
--  El precio se guarda en CENTAVOS (entero), nunca en decimal.
--    35.00 pesos → 3500
--  Así se evitan los errores de redondeo de los flotantes.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1) LIMPIEZA
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.productos') is not null then
    drop trigger if exists al_actualizar_producto on public.productos;
  end if;
end $$;

drop function if exists public.actualizar_fecha_producto() cascade;
drop table if exists public.productos cascade;


-- ─────────────────────────────────────────────────────────────────
-- 2) TABLA DE PRODUCTOS
--    negocio_id → negocios(id). Si cierra el negocio, se va el menú.
--    disponible → el dueño lo apaga sin borrarlo (agotado hoy)
-- ─────────────────────────────────────────────────────────────────
create table public.productos (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  nombre          text not null,
  descripcion     text,

  precio_centavos integer not null,
  moneda          char(3) not null default 'MXN',

  foto_url        text,
  disponible      boolean not null default true,
  orden           smallint not null default 0,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Higiene de datos validada por la base
  constraint nombre_producto_largo check (char_length(trim(nombre)) between 2 and 80),
  constraint precio_positivo       check (precio_centavos >= 0),
  constraint precio_tope           check (precio_centavos <= 10000000),  -- $100,000
  constraint moneda_formato        check (moneda ~ '^[A-Z]{3}$')
);

create index productos_negocio_idx on public.productos (negocio_id);
create index productos_orden_idx   on public.productos (negocio_id, orden);

comment on table  public.productos                 is 'Producto o platillo de un negocio. Ej: jugo verde de Jugos Naturales Juana.';
comment on column public.productos.precio_centavos is 'Precio en centavos. $35.00 se guarda como 3500. Evita errores de redondeo.';
comment on column public.productos.disponible      is 'false = agotado hoy. Se oculta al cliente pero no se borra del menú.';
comment on column public.productos.orden           is 'Orden manual del menú. Menor número aparece primero.';


-- ─────────────────────────────────────────────────────────────────
-- 3) PERMISOS DE TABLA
-- ─────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.productos to authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 4) SEGURIDAD RLS
--    La regla clave: solo el dueño del negocio toca el menú.
--    Se comprueba con exists() contra negocios.dueno_id.
-- ─────────────────────────────────────────────────────────────────
alter table public.productos enable row level security;

-- Ver: si el negocio está activo, todos ven su menú completo.
--      El dueño ve siempre su menú (aunque esté en borrador).
create policy "Ver menu de negocios activos o propios"
  on public.productos for select
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and (n.estado = 'activo' or n.dueno_id = auth.uid())
    )
  );

-- Ver sin sesión: menú de negocios activos
create policy "Ver menu sin sesion"
  on public.productos for select
  to anon
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.estado = 'activo'
    )
  );

-- Crear: solo en un negocio propio
create policy "Crear productos en negocio propio"
  on public.productos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  );

-- Editar: solo productos de un negocio propio
create policy "Editar productos de negocio propio"
  on public.productos for update
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  );

-- Borrar: el dueño sí puede borrar un producto suyo
create policy "Borrar productos de negocio propio"
  on public.productos for delete
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────
-- 5) FECHA DE EDICIÓN AUTOMÁTICA
-- ─────────────────────────────────────────────────────────────────
create or replace function public.actualizar_fecha_producto()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger al_actualizar_producto
  before update on public.productos
  for each row execute function public.actualizar_fecha_producto();


-- ─────────────────────────────────────────────────────────────────
-- 6) VERIFICACIÓN — deben salir 5 filas, todas en OK
-- ─────────────────────────────────────────────────────────────────
select 'tabla productos' as revision,
  case when to_regclass('public.productos') is not null
       then 'OK' else 'FALTA' end as estado
union all
select 'permiso insert app',
  case when has_table_privilege('authenticated','public.productos','insert')
       then 'OK' else 'FALTA GRANT' end
union all
select 'RLS activo',
  case when (select relrowsecurity from pg_class
             where oid = 'public.productos'::regclass)
       then 'OK' else 'INACTIVO' end
union all
select 'politicas',
  (select count(*)::text || ' creadas (deben ser 5)' from pg_policies
   where schemaname = 'public' and tablename = 'productos')
union all
select 'trigger de fecha',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_actualizar_producto')
       then 'OK' else 'FALTA' end;

grant select on public.productos to anon;
