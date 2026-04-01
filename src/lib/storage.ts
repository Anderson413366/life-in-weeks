import { supabase } from "./supabase";

const BUCKET = "liw-photos";

export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  // Overwrite existing avatar
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Add cache-buster
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deletePhoto(url: string, userId: string): Promise<void> {
  // Extract path from URL: https://xxx.supabase.co/storage/v1/object/public/liw-photos/USER/FILE
  const match = url.match(/liw-photos\/(.+?)(\?|$)/);
  if (!match) return;
  const path = match[1];
  // Verify the path belongs to the authenticated user
  if (!path.startsWith(userId + "/")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
