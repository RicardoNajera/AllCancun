-- ═══════════════════════════════════════════════════════════════
-- All Cancún — Diagnóstico completo de public.perfiles
-- Pega TODO en el SQL Editor de Supabase y pulsa RUN.
-- SOLO LEE. No crea, no borra, no modifica nada.
-- No necesita ningún dato tuyo: descubre la estructura solo.
-- ═══════════════════════════════════════════════════════════════

-- 1) ESTRUCTURA COMPLETA: columnas, tipos, nulos, defaults -----
select
  ordinal_position                as pos,
  column_name                     as columna,
  data_type                       as tipo_sql,
  udt_name                        as tipo_real,
  is_nullable                     as permite_nulo,
  column_default                  as valor_default,
  character_maximum_length        as largo_max
from information_schema.columns
where table_schema = 'public' and table_name = 'perfiles'
order by ordinal_position;

-- 2) ENUMs: qué valores acepta rol (y cualquier otro) ----------
select
  t.typname                       as enum_nombre,
  e.enumlabel                     as valor_permitido
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;

-- 3) CONSTRAINTS: PK, FK, UNIQUE, CHECK ----------------------
select
  con.conname                     as nombre,
  case con.contype
    when 'p' then 'PK' when 'f' then 'FK'
    when 'u' then 'UNIQUE' when 'c' then 'CHECK'
    else con.contype::text
  end                             as tipo,
  pg_get_constraintdef(con.oid)   as definicion
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'perfiles'
order by con.contype;

-- 4) RLS ACTIVO? ----------------------------------------------
select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'perfiles';

-- 5) POLÍTICAS (¿falta INSERT? ¿falta UPDATE?) ----------------
select policyname as politica, cmd as comando, roles as roles,
       qual as using_expr, with_check as check_expr
from pg_policies
where schemaname = 'public' and tablename = 'perfiles'
order by cmd, policyname;

-- 6) PERMISOS DE TABLA  <=== AQUÍ SE VE EL ERROR 42501 =======
select grantee as rol_postgres, privilege_type as permiso
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'perfiles'
order by grantee, privilege_type;

-- 7) ¿La app (anon/authenticated) puede escribir el apodo? ----
select
  has_table_privilege('authenticated', 'public.perfiles', 'select') as auth_puede_leer,
  has_table_privilege('authenticated', 'public.perfiles', 'insert') as auth_puede_insertar,
  has_table_privilege('authenticated', 'public.perfiles', 'update') as auth_puede_actualizar,
  has_table_privilege('anon',          'public.perfiles', 'select') as anon_puede_leer;


-- 8) ÍNDICES (¿apodo es único?) ------------------------------
select indexname as indice, indexdef as definicion
from pg_indexes
where schemaname = 'public' and tablename = 'perfiles';

-- 9) TRIGGERS EN perfiles ------------------------------------
select t.tgname as trigger_nombre, pg_get_triggerdef(t.oid) as definicion
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'perfiles' and not t.tgisinternal;

-- 10) TRIGGER DE ALTA EN auth.users --------------------------
select t.tgname as trigger_alta, pg_get_triggerdef(t.oid) as definicion
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal;

-- 11) DATO REAL GUARDADO -------------------------------------
select id, rol, apodo, nombre_completo, foto_perfil_url, creado_en, actualizado_en
from public.perfiles
order by creado_en desc
limit 20;

-- 12) RESUMEN: cuántos perfiles, cuántos con apodo ------------
select
  count(*)                     as total_perfiles,
  count(apodo)                 as con_apodo,
  count(*) - count(apodo)      as sin_apodo,
  count(distinct lower(apodo)) as apodos_distintos
from public.perfiles;


-- 13) VEREDICTO AUTOMÁTICO -----------------------------------
--     Compara lo que HAY contra lo que la app NECESITA.
with cols as (
  select column_name, data_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'perfiles'
),
req as (
  select * from (values
    ('id','uuid'), ('rol','USER-DEFINED'), ('apodo','text'),
    ('nombre_completo','text'), ('foto_perfil_url','text'),
    ('creado_en','timestamp with time zone'),
    ('actualizado_en','timestamp with time zone')
  ) v(c, t)
)
select
  r.c                                        as campo,
  r.t                                        as espera_la_app,
  coalesce(cols.data_type, 'NO EXISTE')      as hay_en_la_base,
  case
    when cols.column_name is null then 'FALTA LA COLUMNA'
    when cols.data_type <> r.t then 'TIPO DISTINTO — revisar'
    else 'OK'
  end                                        as estado
from req r
left join cols on cols.column_name = r.c

union all
select
  'GRANT authenticated', 'select + insert + update',
  coalesce((select string_agg(privilege_type, ', ')
            from information_schema.role_table_grants
            where table_schema='public' and table_name='perfiles'
              and grantee='authenticated'), 'NINGUNO'),
  case when has_table_privilege('authenticated','public.perfiles','select')
        and has_table_privilege('authenticated','public.perfiles','update')
       then 'OK — el apodo se puede guardar'
       else 'BLOQUEADO — error 42501, falta GRANT' end

union all
select
  'POLÍTICA INSERT', 'crear la fila al entrar con Google',
  coalesce((select string_agg(policyname, ', ') from pg_policies
            where schemaname='public' and tablename='perfiles' and cmd='INSERT'), 'NINGUNA'),
  case when exists (select 1 from pg_policies
                    where schemaname='public' and tablename='perfiles' and cmd='INSERT')
       then 'OK' else 'FALTA — no se puede crear el perfil' end

union all
select
  'ÍNDICE ÚNICO apodo', 'que el apodo no se repita',
  coalesce((select string_agg(indexname, ', ') from pg_indexes
            where schemaname='public' and tablename='perfiles'
              and indexdef ilike '%apodo%'), 'NINGUNO'),
  case when exists (select 1 from pg_indexes
                    where schemaname='public' and tablename='perfiles'
                      and indexdef ilike '%unique%' and indexdef ilike '%apodo%')
       then 'OK' else 'FALTA — apodo repetible' end

union all
select
  'TRIGGER actualizado_en', 'mantener la fecha de edición',
  coalesce((select string_agg(t.tgname, ', ')
            from pg_trigger t
            join pg_class c on c.oid = t.tgrelid
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname='public' and c.relname='perfiles'
              and not t.tgisinternal), 'NINGUNO'),
  case when exists (select 1 from pg_trigger t
                    join pg_class c on c.oid = t.tgrelid
                    join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname='public' and c.relname='perfiles'
                      and not t.tgisinternal)
       then 'OK' else 'FALTA' end;
