import { supabase, isSupabaseConfigured } from "./supabase";

export async function uploadFile(
  file: File,
  folder: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase Storage is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable document uploads."
    );
  }

  const bucketName = folder.includes("profile") ? "profile-images" : "teacher-documents";
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Failed to upload file to ${bucketName}: ${error.message}`
    );
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}