-- All Cancún — Supabase: ajustes para public.perfiles
-- El esquema YA existe (verificado). Este script solo añade lo que falta.
-- Ejecutar en el SQL Editor del proyecto djyrqcjvcibnhvwwarlq.
--
-- Esquema real detectado:
--   id uuid PK, rol rol_usuario NOT NULL DEFAULT 'cliente', apodo text,
--   nombre_completo text, foto_perfil_url text,
--   creado_en timestamptz, actualizado_en timestamptz
-- RLS ya tiene SELECT y UPDATE propios. Falta INSERT y los GRANT.

-- 1) GRANT: sin esto la API responde 42501 "permission denied" --------------
grant select, insert, update on public.perfiles to anon, authenticated;

-- 2) INSERT propio: sin esta política la app no puede crear la fila inicial --
drop policy if exists "Crear solo su propio perfil" on public.perfiles;
create policy "Crear solo su propio perfil" on public.perfiles
  for insert to public
  with check (auth.uid() = id);

-- 3) Apodo único: es la identidad pública que relaciona al resto de tablas ---
create unique index if not exists perfiles_apodo_key
  on public.perfiles (lower(apodo))
  where apodo is not null;

-- 4) Alta automática del perfil al registrarse -------------------------------
--    Importante: NO se envía "rol" porque es rol_usuario NOT NULL con default
--    'cliente'. Enviarlo como texto fallaría por el tipo.
create or replace function public.crear_perfil_nuevo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, apodo, nombre_completo, foto_perfil_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'preferred_username',
             new.raw_user_meta_data ->> 'name',
             split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url',
             new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_perfiles_on_signup on auth.users;
create trigger trg_perfiles_on_signup
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo();

-- 5) El trigger al_actualizar_perfil ya existe y mantiene actualizado_en.

-- 5) Alta automática del perfil al registrarse -------------------------------
create or replace function public.crear_perfil_nuevo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, apodo, nombre_completo, foto_perfil_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'preferred_username',
             new.raw_user_meta_data ->> 'name',
             split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url',
             new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_perfiles_on_signup on auth.users;
create trigger trg_perfiles_on_signup
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo();
