-- Supabase schema for DiviDivida
-- Run this file in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  imagem_url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  criado_por_usuario_id uuid not null references public.usuarios(id) on delete restrict,
  nome text not null,
  encontro_latitude double precision,
  encontro_longitude double precision,
  imagem_grupo_url text,
  criado_em timestamptz not null default now(),
  constraint grupos_encontro_latitude_check check (
    encontro_latitude is null or encontro_latitude between -90 and 90
  ),
  constraint grupos_encontro_longitude_check check (
    encontro_longitude is null or encontro_longitude between -180 and 180
  )
);

create table if not exists public.membros_grupo (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (grupo_id, usuario_id)
);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  pago_por_usuario_id uuid not null references public.usuarios(id) on delete restrict,
  valor_total numeric(12, 2) not null check (valor_total > 0),
  descricao text not null,
  recibo_url text,
  criado_em timestamptz not null default now(),
  constraint despesas_pago_por_membro_grupo_fk foreign key (grupo_id, pago_por_usuario_id)
    references public.membros_grupo(grupo_id, usuario_id)
    on delete restrict
);

create index if not exists usuarios_email_idx on public.usuarios(email);
create index if not exists grupos_criado_por_usuario_id_idx on public.grupos(criado_por_usuario_id);
create index if not exists membros_grupo_usuario_id_idx on public.membros_grupo(usuario_id);
create index if not exists despesas_grupo_id_idx on public.despesas(grupo_id);
create index if not exists despesas_pago_por_usuario_id_idx on public.despesas(pago_por_usuario_id);

alter table public.usuarios enable row level security;
alter table public.grupos enable row level security;
alter table public.membros_grupo enable row level security;
alter table public.despesas enable row level security;

create or replace function public.usuario_e_membro_grupo(alvo_grupo_id uuid, alvo_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.membros_grupo mg
    where mg.grupo_id = alvo_grupo_id
      and mg.usuario_id = alvo_usuario_id
  );
$$;

create or replace function public.usuario_criou_grupo(alvo_grupo_id uuid, alvo_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.grupos g
    where g.id = alvo_grupo_id
      and g.criado_por_usuario_id = alvo_usuario_id
  );
$$;

drop policy if exists "Usuarios podem ler o proprio cadastro" on public.usuarios;
drop policy if exists "Usuarios podem inserir o proprio cadastro" on public.usuarios;
drop policy if exists "Usuarios podem atualizar o proprio cadastro" on public.usuarios;
drop policy if exists "Membros podem ler seus grupos" on public.grupos;
drop policy if exists "Usuarios podem criar seus grupos" on public.grupos;
drop policy if exists "Membros podem atualizar seus grupos" on public.grupos;
drop policy if exists "Membros podem ler participantes do grupo" on public.membros_grupo;
drop policy if exists "Criadores e membros podem adicionar participantes" on public.membros_grupo;
drop policy if exists "Usuarios podem sair de grupos" on public.membros_grupo;
drop policy if exists "Membros podem ler despesas do grupo" on public.despesas;
drop policy if exists "Membros podem criar despesas do grupo" on public.despesas;
drop policy if exists "Pagadores podem atualizar suas despesas" on public.despesas;

create policy "Usuarios podem ler o proprio cadastro"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

create policy "Usuarios podem inserir o proprio cadastro"
on public.usuarios
for insert
to authenticated
with check (auth.uid() = id);

create policy "Usuarios podem atualizar o proprio cadastro"
on public.usuarios
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Membros podem ler seus grupos"
on public.grupos
for select
to authenticated
using (
  criado_por_usuario_id = auth.uid()
  or public.usuario_e_membro_grupo(id, auth.uid())
);

create policy "Usuarios podem criar seus grupos"
on public.grupos
for insert
to authenticated
with check (criado_por_usuario_id = auth.uid());

create policy "Membros podem atualizar seus grupos"
on public.grupos
for update
to authenticated
using (
  criado_por_usuario_id = auth.uid()
  or public.usuario_e_membro_grupo(id, auth.uid())
)
with check (
  criado_por_usuario_id = auth.uid()
  or public.usuario_e_membro_grupo(id, auth.uid())
);

create policy "Membros podem ler participantes do grupo"
on public.membros_grupo
for select
to authenticated
using (
  usuario_id = auth.uid()
  or public.usuario_criou_grupo(grupo_id, auth.uid())
  or public.usuario_e_membro_grupo(grupo_id, auth.uid())
);

create policy "Criadores e membros podem adicionar participantes"
on public.membros_grupo
for insert
to authenticated
with check (
  public.usuario_criou_grupo(grupo_id, auth.uid())
  or public.usuario_e_membro_grupo(grupo_id, auth.uid())
);

create policy "Usuarios podem sair de grupos"
on public.membros_grupo
for delete
to authenticated
using (usuario_id = auth.uid());

create policy "Membros podem ler despesas do grupo"
on public.despesas
for select
to authenticated
using (public.usuario_e_membro_grupo(grupo_id, auth.uid()));

create policy "Membros podem criar despesas do grupo"
on public.despesas
for insert
to authenticated
with check (
  pago_por_usuario_id = auth.uid()
  and public.usuario_e_membro_grupo(grupo_id, auth.uid())
);

create policy "Pagadores podem atualizar suas despesas"
on public.despesas
for update
to authenticated
using (pago_por_usuario_id = auth.uid())
with check (
  pago_por_usuario_id = auth.uid()
  and public.usuario_e_membro_grupo(grupo_id, auth.uid())
);
