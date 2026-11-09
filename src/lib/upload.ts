import { supabase } from "./supabase";

export async function uploadFile(
  file: File,
  folder: string
) {
  const fileName = `${Date.now()}-${file.name}`;

  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from("teacher-documents")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("teacher-documents")
    .getPublicUrl(filePath);

  return data.publicUrl;
}