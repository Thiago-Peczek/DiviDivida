# Guia do banco Supabase - DiviDivida

## 1. Rodar o schema

1. Abra o projeto no Supabase.
2. Entre em SQL Editor.
3. Cole e execute o conteudo de `supabase/schema.sql`.

No ambiente local, o Supabase CLI usa a migration em `supabase/migrations/20260429163000_criar_schema_dividivida.sql`.

## 2. Como as tabelas ficaram

- `auth.users`: tabela interna do Supabase Auth. Guarda email e senha com seguranca.
- `public.usuarios`: perfil do usuario no app, com `nome`, `email` e `imagem_url`.
- `public.grupos`: grupos como Churrasco ou Republica, com nome, criador, data, latitude, longitude e imagem.
- `public.membros_grupo`: tabela associativa que liga usuarios aos grupos.
- `public.despesas`: despesas do grupo, com usuario pagador, valor, descricao e URL do recibo.

## 3. Campos principais

`public.usuarios`:

- `id`: mesmo id de `auth.users.id`.
- `nome`: nome do usuario no app.
- `email`: email do usuario.
- `imagem_url`: foto/avatar do usuario.
- `criado_em`: data de criacao do registro.

`public.grupos`:

- `id`: identificador do grupo.
- `criado_por_usuario_id`: usuario que criou o grupo.
- `nome`: nome do grupo.
- `encontro_latitude`: latitude do local do encontro.
- `encontro_longitude`: longitude do local do encontro.
- `imagem_grupo_url`: imagem do grupo.
- `criado_em`: data de criacao do grupo.

`public.membros_grupo`:

- `grupo_id`: grupo vinculado.
- `usuario_id`: usuario vinculado.
- `criado_em`: data em que o usuario entrou no grupo.

`public.despesas`:

- `id`: identificador da despesa.
- `grupo_id`: grupo ao qual a despesa pertence.
- `pago_por_usuario_id`: usuario que pagou.
- `valor_total`: valor total da despesa.
- `descricao`: descricao da despesa.
- `recibo_url`: foto/URL do recibo.
- `criado_em`: data de criacao da despesa.

## 4. Fluxo recomendado no app

Cadastro:

1. Criar usuario com `supabase.auth.signUp({ email, password })`.
2. Com o `user.id` retornado, inserir em `public.usuarios`:
   - `id`: mesmo id do Auth
   - `nome`: nome informado
   - `email`: email informado
   - `imagem_url`: URL da imagem, se houver

Criacao de grupo:

1. Inserir em `public.grupos` com `criado_por_usuario_id` igual ao usuario logado.
2. Inserir em `public.membros_grupo` uma linha com o `grupo_id` novo e o `usuario_id` do criador.

Despesa:

1. O usuario pagador precisa ser membro do grupo.
2. Inserir em `public.despesas`:
   - `grupo_id`
   - `pago_por_usuario_id`
   - `valor_total`
   - `descricao`
   - `recibo_url`, se houver

## 5. Observacao importante

Nao salve senha em `public.usuarios`. A senha fica somente no Supabase Auth. A coluna `email` em `public.usuarios` existe para facilitar exibicao e buscas no app, mas a autenticacao real continua sendo feita pelo Auth.
