-- ════════════════════════════════════════════════════════════════════
--  ALL CANCÚN · Supabase · 3 de 3 · RESEÑAS
--  Pégalo COMPLETO en el SQL Editor y pulsa RUN.
--  Corre DESPUÉS de productos.sql.
--
--  Qué hace:
--    1. Borra lo anterior (se puede correr las veces que quieras)
--    2. Crea public.resenas — apunta al negocio Y a quien la escribió
--    3. Una reseña por persona por negocio (se edita, no se duplica)
--    4. Crea una vista con el promedio de estrellas ya calculado
--    5. Da permisos (GRANT)
--    6. Activa RLS: todos leen, cada quien escribe solo la suya
--    7. Mantiene actualizado_en solo
--
--  Caso real:
--    Juana tiene "Jugos Naturales Juana"
--    Pedro va, se toma un jugo verde y deja 5 estrellas:
--
--      resenas.negocio_id → negocios (Jugos Naturales Juana)
--      resenas.autor_id   → perfiles (Pedro)
--
--  El promedio NO se guarda en ninguna columna: se calcula en la
--  vista public.negocios_puntuacion. Guardarlo obligaría a
--  recalcularlo en cada reseña y un día se desincronizaría.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1) LIMPIEZA
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.resenas') is not null then
    drop trigger if exists al_actualizar_resena on public.resenas;
  end if;
end $$;

drop view  if exists public.negocios_puntuacion cascade;
drop function if exists public.actualizar_fecha_resena() cascade;
drop table if exists public.resenas cascade;


-- ─────────────────────────────────────────────────────────────────
-- 2) TABLA DE RESEÑAS
--    Dos llaves foráneas distintas y con propósitos distintos:
--      negocio_id → de quién se habla
--      autor_id   → quién habla
--    Confundirlas es el error clásico de este modelo.
-- ─────────────────────────────────────────────────────────────────
create table public.resenas (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  autor_id        uuid not null references public.perfiles(id) on delete cascade,

  estrellas       smallint not null,
  texto           text,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Una persona, una reseña por negocio.
  -- Si cambia de opinión, edita la misma fila.
  constraint una_resena_por_negocio unique (negocio_id, autor_id),

  -- 1 a 5 estrellas: la base rechaza 0 y 7
  constraint estrellas_rango check (estrellas between 1 and 5),
  constraint texto_largo     check (texto is null or char_length(texto) <= 1000)
);

create index resenas_negocio_idx on public.resenas (negocio_id);
create index resenas_autor_idx   on public.resenas (autor_id);

comment on table  public.resenas            is 'Reseña de un cliente sobre un negocio. Única por persona y negocio.';
comment on column public.resenas.negocio_id is 'De quién se habla. Ej: Jugos Naturales Juana.';
comment on column public.resenas.autor_id   is 'Quién habla. Ej: Pedro. Se borra en cascada con su cuenta.';
comment on column public.resenas.estrellas  is 'Puntuación de 1 a 5. La base no acepta valores fuera de rango.';


-- ─────────────────────────────────────────────────────────────────
-- 3) PERMISOS DE TABLA
-- ─────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.resenas to authenticated;
grant select on public.resenas to anon;


-- ─────────────────────────────────────────────────────────────────
-- 4) SEGURIDAD RLS
-- ─────────────────────────────────────────────────────────────────
alter table public.resenas enable row level security;

-- Ver: las reseñas de negocios activos, para todos
create policy "Ver resenas de negocios activos"
  on public.resenas for select
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = resenas.negocio_id
        and (n.estado = 'activo' or n.dueno_id = auth.uid())
    )
  );

create policy "Ver resenas sin sesion"
  on public.resenas for select
  to anon
  using (
    exists (
      select 1 from public.negocios n
      where n.id = resenas.negocio_id
        and n.estado = 'activo'
    )
  );

-- Escribir: solo a nombre propio, y nunca en un negocio que no existe
-- para el público (los borradores no se reseñan).
create policy "Escribir resenas propias"
  on public.resenas for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.negocios n
      where n.id = resenas.negocio_id
        and n.estado = 'activo'
    )
  );

-- Editar: solo la propia. El dueño del negocio NO puede editar
-- la reseña de un cliente: eso es lo que le da credibilidad.


-- ─────────────────────────────────────────────────────────────────
-- 5) FECHA DE EDICIÓN AUTOMÁTICA
-- ─────────────────────────────────────────────────────────────────
create or replace function public.actualizar_fecha_resena()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger al_actualizar_resena
  before update on public.resenas
  for each row execute function public.actualizar_fecha_resena();


-- ─────────────────────────────────────────────────────────────────
-- 6) PUNTUACIÓN CALCULADA
--    El "4.8 ⭐ (23)" que se muestra al cliente sale de aquí.
--    Nunca se guarda: se recalcula sola y siempre dice la verdad.
--    left join para que los negocios sin reseñas también aparezcan.
-- ─────────────────────────────────────────────────────────────────
create or replace view public.negocios_puntuacion
with (security_invoker = true) as
select
  n.id                                          as negocio_id,
  coalesce(round(avg(r.estrellas)::numeric, 1), 0)::numeric(2,1) as promedio,
  count(r.id)::int                              as total
from public.negocios n
left join public.resenas r on r.negocio_id = n.id
group by n.id;

comment on view public.negocios_puntuacion is
  'Promedio de estrellas y total de reseñas por negocio. Se calcula al vuelo, nunca se guarda.';

grant select on public.negocios_puntuacion to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 7) UTILIDAD · ¿ya comenté en este negocio?
--    Para no mostrar el formulario dos veces.
--    La PWA del cliente la llama antes de pintar el botón.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.ya_comente(p_negocio_id uuid)
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.resenas
    where negocio_id = p_negocio_id
      and autor_id = auth.uid()
  );
$$;

comment on function public.ya_comente(uuid) is
  'true si el usuario con sesión ya dejó reseña en ese negocio.';

grant execute on function public.ya_comente(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 8) VERIFICACIÓN — deben salir 6 filas, todas en OK
-- ─────────────────────────────────────────────────────────────────
select 'tabla resenas' as revision,
  case when to_regclass('public.resenas') is not null
       then 'OK' else 'FALTA' end as estado
union all
select 'vista de puntuacion',
  case when to_regclass('public.negocios_puntuacion') is not null
       then 'OK' else 'FALTA' end
union all
select 'RLS activo',
  case when (select relrowsecurity from pg_class
             where oid = 'public.resenas'::regclass)
       then 'OK' else 'INACTIVO' end
union all
select 'politicas',
  (select count(*)::text || ' creadas (deben ser 5)' from pg_policies
   where schemaname = 'public' and tablename = 'resenas')
union all
select 'trigger de fecha',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_actualizar_resena')
       then 'OK' else 'FALTA' end
union all
select 'funcion ya_comente',
  case when exists (select 1 from pg_proc
                    where proname = 'ya_comente')
       then 'OK' else 'FALTA' end;

create policy "Editar resenas propias"
  on public.resenas for update
  to authenticated
  using  (autor_id = auth.uid())
  with check (autor_id = auth.uid());

-- Borrar: solo la propia
create policy "Borrar resenas propias"
  on public.resenas for delete
  to authenticated
  using (autor_id = auth.uid());
