-- ════════════════════════════════════════════════════════════════════
--  ALL CANCÚN · Supabase · Script único y definitivo
--  Pégalo COMPLETO en el SQL Editor y pulsa RUN.
--
--  Qué hace:
--    1. Borra lo anterior (tabla, triggers, funciones, tipo)
--    2. Crea el enum de roles y la tabla public.perfiles
--    3. Crea el perfil automáticamente al entrar con Google/Apple/Facebook
--    4. Da permisos (GRANT) — sin esto la API responde 401 / 42501
--    5. Activa RLS con políticas de ver / crear / editar lo propio
--    6. Mantiene actualizado_en solo
--
--  El apodo se rellena solo desde la cuenta (Google/Apple/Facebook).
--  Si no se puede, queda vacío y la app se lo pide al usuario.
--  El usuario puede editar apodo, nombre y foto. NUNCA el rol.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1) LIMPIEZA — se puede correr las veces que quieras,
--    incluso si la tabla ya no existe.
-- ─────────────────────────────────────────────────────────────────
drop trigger if exists al_crear_usuario_en_auth on auth.users;
drop trigger if exists al_crear_perfil on auth.users;
drop trigger if exists al_actualizar_cuenta on auth.users;

-- El trigger de la tabla solo se puede borrar si la tabla existe:
-- un drop trigger ... on public.perfiles falla si falta la tabla.
do $$
begin
  if to_regclass('public.perfiles') is not null then
    drop trigger if exists al_actualizar_perfil on public.perfiles;
  end if;
end $$;

drop function if exists public.crear_perfil_nuevo_usuario() cascade;
drop function if exists public.completar_perfil_desde_cuenta() cascade;
drop function if exists public.actualizar_fecha_perfil() cascade;
drop function if exists public.normalizar_apodo(text) cascade;

drop table if exists public.perfiles cascade;

drop type if exists public.rol_usuario cascade;


-- ─────────────────────────────────────────────────────────────────
-- 2) ROLES — los tres tipos de usuario de All Cancún
-- ─────────────────────────────────────────────────────────────────
create type public.rol_usuario as enum ('cliente', 'comercio', 'operador');

-- ─────────────────────────────────────────────────────────────────
-- 3) TABLA DE PERFILES
--    id  → la misma llave de auth.users (1 usuario = 1 perfil)
--    rol → enum, por defecto 'cliente'. La app NO puede cambiarlo.
-- ─────────────────────────────────────────────────────────────────
create table public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  rol             public.rol_usuario not null default 'cliente',
  apodo           text,
  nombre_completo text,
  foto_perfil_url text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Higiene de datos validada por la base
  constraint apodo_formato    check (apodo is null or apodo ~ '^[a-z0-9._-]{3,32}$')
);

comment on table  public.perfiles       is 'Perfil público de cada usuario. 1 fila por cuenta de auth.users.';
comment on column public.perfiles.apodo is 'Identidad pública única, minúsculas, 3-32 caracteres. Viene de la cuenta o la elige el usuario.';
comment on column public.perfiles.rol   is 'Tipo de usuario. Solo lo asigna el sistema, nunca la app.';

-- ─────────────────────────────────────────────────────────────────
-- 4) APODO AUTOMÁTICO
--    Saca el mejor candidato del perfil de Google/Apple/Facebook:
--      1. preferred_username → apple y google a veces lo traen
--      2. given_name         → "Ana" (Google)
--      3. name               → "Ana Pérez"
--      4. parte antes del @ del correo
--    Lo limpia: minúsculas, sin acentos, sin espacios, máx 32.
--    Si el resultado no sirve (muy corto o repetido) devuelve NULL
--    y la app se lo pide al usuario.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.normalizar_apodo(p_texto text)
returns text
language sql
immutable
as $$
  select nullif(
    left(
      regexp_replace(
        translate(lower(trim(p_texto)),
          'áàäâãéèëêíìïîóòöôõúùüûñç',
          'aaaaaeeeeiiiiooooouuuunc'),
        '[^a-z0-9._-]', '', 'g'
      ),
      32
    ),
    ''
  );
$$;

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  candidato text;
  elegido   text;
  nombre    text;
  foto      text;
  n         int := 0;
begin
  -- Nombre visible: full_name (Google/Facebook) o name (Apple)
  nombre := coalesce(
              nullif(trim(meta ->> 'full_name'), ''),
              nullif(trim(meta ->> 'name'), ''),
              nullif(trim(concat_ws(' ',
                nullif(trim(meta ->> 'given_name'), ''),
                nullif(trim(meta ->> 'family_name'), '')
              )), '')
            );

  -- Foto: avatar_url (Google/Facebook) o picture
  foto := coalesce(
            nullif(trim(meta ->> 'avatar_url'), ''),
            nullif(trim(meta ->> 'picture'), '')
          );

  -- Apodo candidato, en orden de preferencia
  candidato := public.normalizar_apodo(
    coalesce(
      nullif(meta ->> 'preferred_username', ''),
      nullif(meta ->> 'user_name', ''),
      nullif(meta ->> 'given_name', ''),
      nullif(meta ->> 'name', ''),
      nullif(meta ->> 'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );

  -- El apodo debe tener entre 3 y 32 caracteres
  if candidato is not null and length(candidato) >= 3 then
    elegido := candidato;
  end if;

  -- Si ya existe, se prueba con sufijo: ana, ana2, ana3 …
  if elegido is not null then
    while exists (select 1 from public.perfiles p where p.apodo = elegido) loop
      n := n + 1;
      elegido := left(candidato, 32 - length(n::text)) || n::text;
      if n > 50 then
        elegido := null;   -- demasiados choques: que lo elija el usuario
        exit;
      end if;
    end loop;
  end if;

  insert into public.perfiles (id, apodo, nombre_completo, foto_perfil_url)
  values (new.id, elegido, nullif(nombre, ''), nullif(foto, ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger al_crear_usuario_en_auth
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

comment on function public.crear_perfil_nuevo_usuario() is
  'Crea el perfil al registrarse con Google/Apple/Facebook. Rellena apodo, nombre y foto desde la cuenta.';


-- ─────────────────────────────────────────────────────────────────
-- 5) PERMISOS DE TABLA  ⚠️ ESTO ES LO QUE FALTABA (error 401/42501)
--    RLS filtra FILAS. GRANT da el permiso de TABLA.
--    Sin GRANT la API ni siquiera llega a evaluar las políticas.
-- ─────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select, insert, update on public.perfiles to authenticated;
grant select on public.perfiles to anon;   -- leer perfiles públicos

-- Nadie borra perfiles desde la API. El borrado va en cascada
-- cuando se elimina la cuenta en auth.users.
revoke delete on public.perfiles from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 6) SEGURIDAD RLS — cada quien solo lo suyo
-- ─────────────────────────────────────────────────────────────────
alter table public.perfiles enable row level security;

-- Ver: el dueño ve su perfil completo
create policy "Ver solo su propio perfil"
  on public.perfiles for select
  to authenticated
  using (auth.uid() = id);

-- Crear: si el trigger no alcanzó, la app crea la fila (ensureProfile).
create policy "Crear solo su propio perfil"
  on public.perfiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Editar: solo su fila. El rol no se puede cambiar: se compara
-- contra el valor que ya tiene la fila.
create policy "Editar solo su propio perfil"
  on public.perfiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and rol = (select p.rol from public.perfiles p where p.id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- 7) FECHA DE EDICIÓN AUTOMÁTICA
-- ─────────────────────────────────────────────────────────────────
create or replace function public.actualizar_fecha_perfil()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger al_actualizar_perfil
  before update on public.perfiles
  for each row execute function public.actualizar_fecha_perfil();


-- ─────────────────────────────────────────────────────────────────
-- 8) COMPLETAR LO QUE FALTÓ
--    Si el usuario entró antes de tener nombre/foto en la cuenta,
--    al volver a entrar se rellenan solos (sin pisar lo que él escribió).
-- ─────────────────────────────────────────────────────────────────
create or replace function public.completar_perfil_desde_cuenta()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  viejo jsonb := coalesce(old.raw_user_meta_data, '{}'::jsonb);
  candidato text;
  n int := 0;
begin
  -- Solo actúa si cambió algo en el perfil de la cuenta
  if meta is distinct from viejo then
    update public.perfiles p set
      nombre_completo = coalesce(
        nullif(trim(p.nombre_completo), ''),
        nullif(trim(meta ->> 'full_name'), ''),
        nullif(trim(meta ->> 'name'), '')
      ),
      foto_perfil_url = coalesce(
        nullif(trim(p.foto_perfil_url), ''),
        nullif(trim(meta ->> 'avatar_url'), ''),
        nullif(trim(meta ->> 'picture'), '')
      )
    where p.id = new.id;
  end if;

  -- Si el perfil se quedó sin apodo, intentar ponerlo ahora
  if exists (select 1 from public.perfiles p where p.id = new.id and p.apodo is null) then
    candidato := public.normalizar_apodo(
      coalesce(
        nullif(meta ->> 'preferred_username', ''),
        nullif(meta ->> 'given_name', ''),
        nullif(meta ->> 'name', ''),
        split_part(coalesce(new.email, ''), '@', 1)
      )
    );

    if candidato is not null and length(candidato) >= 3 then
      while exists (select 1 from public.perfiles p where p.apodo = candidato) loop
        n := n + 1;
        candidato := left(candidato, 32 - length(n::text)) || n::text;
        if n > 50 then candidato := null; exit; end if;
      end loop;

      if candidato is not null then
        update public.perfiles set apodo = candidato
        where id = new.id and apodo is null;
      end if;
    end if;
  end if;

  return new;
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 9) VERIFICACIÓN — deben salir 7 filas, todas en OK
-- ─────────────────────────────────────────────────────────────────
select
  'tabla perfiles' as revision,
  case when to_regclass('public.perfiles') is not null
       then 'OK' else 'FALTA' end as estado
union all
select 'permiso insert app',
  case when has_table_privilege('authenticated','public.perfiles','insert')
       then 'OK' else 'FALTA GRANT' end
union all
select 'permiso update app',
  case when has_table_privilege('authenticated','public.perfiles','update')
       then 'OK' else 'FALTA GRANT' end
union all
select 'RLS activo',
  case when (select relrowsecurity from pg_class
             where oid = 'public.perfiles'::regclass)
       then 'OK' else 'INACTIVO' end
union all
select 'politicas',
  (select count(*)::text || ' creadas (deben ser 3)' from pg_policies
   where schemaname = 'public' and tablename = 'perfiles')
union all
select 'trigger de alta',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_crear_usuario_en_auth')
       then 'OK' else 'FALTA' end
union all
select 'trigger de fecha',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_actualizar_perfil')
       then 'OK' else 'FALTA' end;

drop trigger if exists al_actualizar_cuenta on auth.users;
create trigger al_actualizar_cuenta
  after update on auth.users
  for each row execute function public.completar_perfil_desde_cuenta();
