import { supabase } from '@/lib/supabase';

const BUCKET_AVATARES = 'avatars';

export async function enviarAvatar(
  usuarioId: string,
  uriArquivo: string,
): Promise<string> {
  const resposta = await fetch(uriArquivo);
  const blob = await resposta.blob();

  const caminhoArquivo = `${usuarioId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_AVATARES)
    .upload(caminhoArquivo, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  return obterUrlAvatar(usuarioId);
}

export function obterUrlAvatar(usuarioId: string): string {
  const { data } = supabase.storage
    .from(BUCKET_AVATARES)
    .getPublicUrl(`${usuarioId}.jpg`);

  return data.publicUrl;
}

const BUCKET_RECIBOS = 'recibos';

export async function enviarRecibo(
  grupoId: string,
  usuarioId: string,
  uriArquivo: string,
): Promise<string> {
  const resposta = await fetch(uriArquivo);
  const blob = await resposta.blob();

  const nomeArquivo = `${grupoId}/${usuarioId}_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_RECIBOS)
    .upload(nomeArquivo, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET_RECIBOS)
    .getPublicUrl(nomeArquivo);

  return data.publicUrl;
}

