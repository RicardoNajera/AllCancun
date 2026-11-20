-- ════════════════════════════════════════════════════════════════════
--  ALL CANCÚN · Supabase · 1 de 3 · NEGOCIOS
--  Pégalo COMPLETO en el SQL Editor y pulsa RUN.
--  Corre DESPUÉS de perfiles.sql.
--
--  Qué hace:
--    1. Borra lo anterior (se puede correr las veces que quieras)
--    2. Crea los enums de categoría y estado
--    3. Crea public.negocios — un negocio pertenece a UN perfil
--    4. Eleva el rol del dueño a 'comercio' cuando el negocio se activa
--    5. Da permisos (GRANT) — sin esto la API responde 401 / 42501
--    6. Activa RLS: el dueño ve y edita lo suyo, todos ven los activos
--    7. Mantiene actualizado_en solo
--
--  Caso real: la señora Juana abre "Jugos Naturales Juana".
--    perfiles (Juana) ── dueno_id ──> negocios (Jugos Naturales Juana)
--
--  El rol NO se puede escribir desde la app: lo eleva un trigger
--  security definer cuando el negocio pasa a 'activo'.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1) LIMPIEZA
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.negocios') is not null then
    drop trigger if exists al_actualizar_negocio on public.negocios;
    drop trigger if exists al_elevar_rol_dueno  on public.negocios;
  end if;
end $$;

drop function if exists public.actualizar_fecha_negocio() cascade;
drop function if exists public.elevar_rol_dueno_negocio() cascade;
drop function if exists public.generar_slug(text) cascade;

drop table if exists public.negocios cascade;

drop type if exists public.categoria_negocio cascade;
drop type if exists public.estado_negocio cascade;


-- ─────────────────────────────────────────────────────────────────
-- 2) CATEGORÍAS
--    Espeja las categorías de la PWA del cliente (data/categories.js).
--    Si agregas una categoría allá, agrégala aquí también.
-- ─────────────────────────────────────────────────────────────────
create type public.categoria_negocio as enum (
  'comida',          -- puestos, cocinas, jugos, antojitos
  'comercios',       -- tiendas, abarrotes, papelerías
  'salud',           -- consultorios, farmacias, terapias
  'mantenimiento',   -- plomería, electricidad, limpieza
  'tianguis',        -- mercado y puestos ambulantes
  'mujeres',         -- belleza, estética, moda
  'hombres',         -- barbería, moda masculina
  'estudiantes',     -- clases, asesorías, útiles
  'otro'
);

-- borrador   → lo creó su dueño, aún no es público
-- activo     → visible en la PWA del cliente
-- suspendido → lo bajó un moderador
create type public.estado_negocio as enum ('borrador', 'activo', 'suspendido');


-- ─────────────────────────────────────────────────────────────────
-- 3) TABLA DE NEGOCIOS
--    dueno_id → perfiles(id). Si se borra la cuenta, se va el negocio.
--    El slug es la URL bonita: jugos-naturales-juana
-- ─────────────────────────────────────────────────────────────────
create table public.negocios (
  id              uuid primary key default gen_random_uuid(),
  dueno_id        uuid not null references public.perfiles(id) on delete cascade,
  nombre          text not null,
  slug            text not null,
  categoria       public.categoria_negocio not null,
  estado          public.estado_negocio not null default 'borrador',

  descripcion     text,
  telefono        text,
  whatsapp        text,
  colonia         text,
  direccion       text,
  latitude        double precision,
  longitude       double precision,
  foto_url        text,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Higiene de datos validada por la base
  constraint nombre_largo     check (char_length(trim(nombre)) between 2 and 80),
  constraint slug_formato     check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint whatsapp_formato check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  constraint lat_rango        check (latitude  is null or latitude  between -90  and 90),
  constraint lng_rango        check (longitude is null or longitude between -180 and 180)
);

create unique index negocios_slug_unico on public.negocios (slug);
create index negocios_dueno_idx  on public.negocios (dueno_id);
create index negocios_estado_idx on public.negocios (estado);
create index negocios_cat_idx    on public.negocios (categoria);


-- ─────────────────────────────────────────────────────────────────
-- 4) PERMISOS DE TABLA
--    RLS filtra FILAS. GRANT da el permiso de TABLA.
-- ─────────────────────────────────────────────────────────────────
grant select, insert, update on public.negocios to authenticated;
grant select on public.negocios to anon;   -- la PWA del cliente lee sin sesión

-- Nadie borra negocios desde la API: se cierra el negocio, no se borra
revoke delete on public.negocios from anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 5) SEGURIDAD RLS
-- ─────────────────────────────────────────────────────────────────
alter table public.negocios enable row level security;

-- Ver: todos ven los activos; el dueño ve además sus borradores
create policy "Ver negocios publicados o propios"
  on public.negocios for select
  to authenticated
  using (estado = 'activo' or dueno_id = auth.uid());

-- Ver sin sesión: solo los activos
create policy "Ver negocios activos sin sesión"
  on public.negocios for select
  to anon
  using (estado = 'activo');

-- Crear: solo a nombre propio
create policy "Crear negocios propios"
  on public.negocios for insert
  to authenticated
  with check (dueno_id = auth.uid());

-- Editar: solo los propios
create policy "Editar negocios propios"
  on public.negocios for update
  to authenticated
  using (dueno_id = auth.uid())
  with check (dueno_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────
-- 6) FECHA DE EDICIÓN AUTOMÁTICA
-- ─────────────────────────────────────────────────────────────────
create or replace function public.actualizar_fecha_negocio()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger al_actualizar_negocio
  before update on public.negocios
  for each row execute function public.actualizar_fecha_negocio();


-- ─────────────────────────────────────────────────────────────────
-- 7) ROL DEL DUEÑO
--    La app NO puede escribir `rol` (la política de perfiles lo impide).
--    Este trigger corre como security definer: cuando el negocio pasa
--    a 'activo', eleva el rol del dueño a 'comercio'.
--    Nunca lo baja: si cierra el negocio sigue siendo comerciante.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.elevar_rol_dueno_negocio()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.estado = 'activo' then
    update public.perfiles
       set rol = 'comercio'
     where id = new.dueno_id
       and rol = 'cliente';   -- solo sube, nunca degrada
  end if;
  return new;
end;
$$;

comment on function public.elevar_rol_dueno_negocio() is
  'Cuando un negocio se activa, el dueño pasa de cliente a comercio. Solo eleva el rol, nunca lo baja.';

create trigger al_elevar_rol_dueno
  after insert or update of estado on public.negocios
  for each row execute function public.elevar_rol_dueno_negocio();


-- ─────────────────────────────────────────────────────────────────
-- 8) UTILIDAD · slug a partir de un nombre
--    "Jugos Naturales Juana" → jugos-naturales-juana
-- ─────────────────────────────────────────────────────────────────
create or replace function public.generar_slug(p_texto text)
returns text
language sql
immutable
as $$
  select nullif(
    left(
      trim(both '-' from
        regexp_replace(
          translate(lower(trim(p_texto)),
            'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
          '[^a-z0-9]+', '-', 'g'
        )
      ),
      80
    ),
    ''
  );
$$;

comment on function public.generar_slug(text) is
  'Convierte un nombre en slug. generar_slug(''Jugos Naturales Juana'') = jugos-naturales-juana';


-- ─────────────────────────────────────────────────────────────────
-- 9) VERIFICACIÓN — deben salir 6 filas, todas en OK
-- ─────────────────────────────────────────────────────────────────
select 'tabla negocios' as revision,
  case when to_regclass('public.negocios') is not null
       then 'OK' else 'FALTA' end as estado
union all
select 'permiso insert app',
  case when has_table_privilege('authenticated','public.negocios','insert')
       then 'OK' else 'FALTA GRANT' end
union all
select 'RLS activo',
  case when (select relrowsecurity from pg_class
             where oid = 'public.negocios'::regclass)
       then 'OK' else 'INACTIVO' end
union all
select 'politicas',
  (select count(*)::text || ' creadas (deben ser 4)' from pg_policies
   where schemaname = 'public' and tablename = 'negocios')
union all
select 'trigger de fecha',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_actualizar_negocio')
       then 'OK' else 'FALTA' end
union all
select 'trigger de rol',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_elevar_rol_dueno')
       then 'OK' else 'FALTA' end;


comment on table  public.negocios          is 'Negocio local. Pertenece a un perfil (dueno_id) y puede tener productos y reseñas.';
comment on column public.negocios.dueno_id is 'Perfil de quien manda. Al ser dueño, su rol sube a comercio.';
comment on column public.negocios.slug     is 'URL bonita del negocio, única. Ej: jugos-naturales-juana';
comment on column public.negocios.estado   is 'borrador: no visible. activo: visible en la PWA del cliente. suspendido: lo bajó moderación.';
