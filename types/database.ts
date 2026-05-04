export type Usuario = {
  id: string;
  nome: string;
  email: string;
  imagem_url: string | null;
  criado_em: string;
};

export type Grupo = {
  id: string;
  criado_por_usuario_id: string;
  nome: string;
  encontro_latitude: number | null;
  encontro_longitude: number | null;
  imagem_grupo_url: string | null;
  criado_em: string;
};

export type MembroGrupo = {
  grupo_id: string;
  usuario_id: string;
  criado_em: string;
};

export type Despesa = {
  id: string;
  grupo_id: string;
  pago_por_usuario_id: string;
  valor_total: number;
  descricao: string;
  recibo_url: string | null;
  criado_em: string;
};
