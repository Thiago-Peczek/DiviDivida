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
