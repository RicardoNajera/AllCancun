-- All Cancún — Supabase: perfiles + RLS
-- Ejecutar en el SQL Editor del proyecto djyrqcjvcibnhvwwarlq.
-- La app usa SOLO la anon key, así que la seguridad depende de RLS.

-- 1) Tabla ------------------------------------------------------------------
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol text not null default 'usuario',
  apodo text,
  nombre_completo text,
  foto_perfil_url text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- 2) Permisos de tabla (lo que faltaba: error 42501) -------------------------
grant select, insert, update on public.perfiles to anon, authenticated;

-- El apodo es la identidad pública y única: relaciona al usuario con el resto
create unique index if not exists perfiles_apodo_key
  on public.perfiles (lower(apodo))
  where apodo is not null;

-- 3) RLS --------------------------------------------------------------------
alter table public.perfiles enable row level security;

-- Cada usuario ve la suya; las filas son públicas solo por apodo si quieres.
drop policy if exists "perfiles_select_propio" on public.perfiles;
create policy "perfiles_select_propio" on public.perfiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "perfiles_insert_propio" on public.perfiles;
create policy "perfiles_insert_propio" on public.perfiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Solo puede editar su fila y nunca cambiar su rol.
drop policy if exists "perfiles_update_propio" on public.perfiles;
create policy "perfiles_update_propio" on public.perfiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and rol = (select p.rol from public.perfiles p where p.id = auth.uid()));

-- 4) actualizado_en automático ----------------------------------------------
create or replace function public.touch_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_perfiles_touch on public.perfiles;
create trigger trg_perfiles_touch
  before update on public.perfiles
  for each row execute function public.touch_actualizado_en();

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
