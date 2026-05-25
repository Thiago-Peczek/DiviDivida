create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  imagem_url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  criado_por_usuario_id uuid not null references public.usuarios(id) on delete restrict,
  nome text not null,
  encontro_latitude double precision,
  encontro_longitude double precision,
  encontro_nome text,
  imagem_grupo_url text,
  criado_em timestamptz not null default now()
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
  valor_total numeric(12, 2) not null,
  descricao text not null,
  recibo_url text,
  criado_em timestamptz not null default now(),
  constraint despesas_pago_por_membro_grupo_fk foreign key (grupo_id, pago_por_usuario_id)
    references public.membros_grupo(grupo_id, usuario_id)
    on delete restrict
);