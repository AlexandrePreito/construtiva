-- Schema proposto para o Supabase (PostgreSQL)
-- Observação: Execute após validar as telas e configurar o projeto no Supabase.

create table public.obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null,
  estado char(2) not null,
  endereco text not null,
  criado_em timestamptz default timezone('utc'::text, now()),
  atualizado_em timestamptz default timezone('utc'::text, now())
);

create table public.service_groups (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,
  cor_hex char(7),
  criado_em timestamptz default timezone('utc'::text, now()),
  atualizado_em timestamptz default timezone('utc'::text, now())
);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  grupo_id uuid references public.service_groups(id) on delete set null,
  nome text not null,
  cor_hex char(7) not null,
  ordem int default 0,
  criado_em timestamptz default timezone('utc'::text, now()),
  atualizado_em timestamptz default timezone('utc'::text, now())
);

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  titulo text not null,
  descricao text,
  ordem int default 0,
  criado_em timestamptz default timezone('utc'::text, now()),
  atualizado_em timestamptz default timezone('utc'::text, now())
);

create table public.cronograma_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  servico_id uuid not null references public.servicos(id) on delete cascade,
  etapa_id uuid not null references public.etapas(id) on delete cascade,
  item text,
  data_inicio date not null,
  data_fim date not null,
  origem_importacao text not null check (origem_importacao in ('xlsx', 'csv', 'manual')),
  criado_por uuid not null,
  criado_em timestamptz default timezone('utc'::text, now()),
  atualizado_em timestamptz default timezone('utc'::text, now())
);

create type public.stage_status as enum ('pendente', 'concluido', 'bloqueado');

create table public.stage_validations (
  id uuid primary key default gen_random_uuid(),
  cronograma_item_id uuid not null references public.cronograma_itens(id) on delete cascade,
  validado_por uuid not null,
  status public.stage_status not null default 'pendente',
  data_validacao timestamptz,
  observacoes text,
  fotos text[] default '{}',
  origem text not null default 'mobile' check (origem in ('mobile', 'web')),
  criado_em timestamptz default timezone('utc'::text, now())
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  permissoes text[] default '{}',
  padrao boolean default false
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.user_roles(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete cascade,
  criado_em timestamptz default timezone('utc'::text, now())
);

create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete cascade,
  acao text not null,
  detalhes jsonb,
  criado_em timestamptz default timezone('utc'::text, now())
);

comment on table public.obras is 'Cadastro básico das obras monitoradas.';
comment on table public.servicos is 'Serviços vinculados a cada obra e usados no cronograma.';
comment on table public.cronograma_itens is 'Itens do cronograma com datas de início/fim.';
comment on table public.stage_validations is 'Validações feitas no campo (mobile/web) para cada etapa.';
comment on table public.user_roles is 'Perfis de acesso com permissões granulares.';
comment on table public.access_logs is 'Logs de auditoria de ações críticas.';

