'use client';
import { createBrowserClient } from '@/lib/supabase/client';
import { safeFilePath, assertAllowedFile } from '@/lib/security';

export async function uploadToBucket(bucket: string, file: File, folder: string, types = ['image/'], maxMb = 10) {
  assertAllowedFile(file, types, maxMb);
  const supabase = createBrowserClient();
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${folder}/${crypto.randomUUID()}-${safeFilePath(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
