import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

const BUCKET_AVATARES = "Avatares";

export async function enviarAvatar(
  usuarioId: string,
  uriArquivo: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uriArquivo, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const caminhoArquivo = `${usuarioId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_AVATARES)
    .upload(caminhoArquivo, arrayBuffer, {
      contentType: "image/jpeg",
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

const BUCKET_GRUPOS = "ImagensGrupos";

export async function enviarImagemGrupo(
  grupoId: string,
  uriArquivo: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uriArquivo, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const nomeArquivo = `${grupoId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_GRUPOS)
    .upload(nomeArquivo, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  return obterUrlImagemGrupo(grupoId);
}

export function obterUrlImagemGrupo(grupoId: string): string {
  const { data } = supabase.storage
    .from(BUCKET_GRUPOS)
    .getPublicUrl(`${grupoId}.jpg`);
  return data.publicUrl;
}

const BUCKET_RECIBOS = "Recibos";

export async function enviarRecibo(
  grupoId: string,
  usuarioId: string,
  uriArquivo: string,
): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uriArquivo, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    const nomeArquivo = `${grupoId}/${usuarioId}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from(BUCKET_RECIBOS)
      .upload(nomeArquivo, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.log("UPLOAD ERROR:", error);
      throw error;
    }

    const { data: publicUrl } = supabase.storage
      .from(BUCKET_RECIBOS)
      .getPublicUrl(nomeArquivo);

    return publicUrl.publicUrl;
  } catch (err) {
    console.log("ERRO STORAGE:", err);
    throw err;
  }
}
