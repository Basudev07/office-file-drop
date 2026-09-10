import { createClient } from '@supabase/supabase-js';
import { OfficeFile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key missing in environment variables (.env).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const STORAGE_BUCKET = 'office_files';

/**
 * Get public URL for a file in Supabase Storage
 */
export const getFileUrl = (filePath: string): string => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || '';
};

/**
 * Upload single file and save metadata to database
 */
export const uploadOfficeFile = async (
  file: File,
  senderName: string,
  onProgress?: (percent: number) => void
): Promise<OfficeFile> => {
  // Sanitize sender name and file name for storage path
  const sanitizedSender = senderName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'anonymous';
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${sanitizedSender}/${timestamp}_${safeFileName}`;

  if (onProgress) onProgress(10);

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload failed:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  if (onProgress) onProgress(75);

  // 2. Insert metadata record into table with client-generated UUID
  // Note: We avoid chaining .select() here because in PostgreSQL under RLS,
  // .select() appends RETURNING * which forces Postgres to check the SELECT policy
  // against anonymous senders, triggering "new row violates row-level security policy".
  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const fileId = generateUUID();
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const newRecord = {
    id: fileId,
    sender_name: senderName.trim(),
    file_name: file.name,
    file_path: storagePath,
    file_size: file.size,
    mime_type: file.type || 'application/octet-stream',
    created_at: nowIso,
    expires_at: expiresIso,
  };

  const { error: dbError } = await supabase
    .from('office_files')
    .insert([newRecord]);

  if (dbError) {
    console.error('Database insert failed:', dbError);
    // Cleanup orphaned storage file if DB insert fails
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    if (dbError.message?.includes('row-level security') || dbError.code === '42501') {
      throw new Error(
        `Saving file record failed: ${dbError.message}. Please run the updated SQL schema in your Supabase SQL Editor.`
      );
    }
    throw new Error(`Saving file record failed: ${dbError.message}`);
  }

  if (onProgress) onProgress(100);

  return {
    ...newRecord,
    public_url: getFileUrl(storagePath),
  };
};

/**
 * Fetch all active files
 */
export const fetchActiveFiles = async (): Promise<OfficeFile[]> => {
  const { data, error } = await supabase
    .from('office_files')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching office files:', error);
    throw error;
  }

  return (data || []).map((file) => ({
    ...file,
    public_url: getFileUrl(file.file_path),
  }));
};

/**
 * Delete a file from both Database and Storage
 */
export const deleteOfficeFile = async (id: string, filePath: string): Promise<void> => {
  // 1. Delete from database
  const { error: dbError } = await supabase
    .from('office_files')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Failed to delete file from DB:', dbError);
    throw dbError;
  }

  // 2. Delete from storage bucket
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (storageError) {
    console.warn('Could not remove file from storage (may already be gone):', storageError);
  }
};

/**
 * Delete multiple files (e.g. batch or clear all)
 */
export const deleteMultipleOfficeFiles = async (files: OfficeFile[]): Promise<void> => {
  if (!files.length) return;
  const ids = files.map((f) => f.id);
  const paths = files.map((f) => f.file_path);

  // 1. Delete DB rows
  const { error: dbError } = await supabase
    .from('office_files')
    .delete()
    .in('id', ids);

  if (dbError) {
    throw dbError;
  }

  // 2. Delete storage files
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
};

/**
 * Trigger cleanup of expired files
 */
export const cleanupExpiredFiles = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_files');
    if (!error && typeof data === 'number') {
      return data;
    }
  } catch (err) {
    console.warn('RPC cleanup_expired_files not found, falling back to manual client delete:', err);
  }

  // Fallback: Delete expired directly if user is authenticated
  const now = new Date().toISOString();
  const { data: expired } = await supabase
    .from('office_files')
    .select('id, file_path')
    .lt('expires_at', now);

  if (expired && expired.length > 0) {
    const ids = expired.map((f) => f.id);
    const paths = expired.map((f) => f.file_path);
    await supabase.from('office_files').delete().in('id', ids);
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    return expired.length;
  }

  return 0;
};
