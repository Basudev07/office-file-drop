import { useState, useEffect, useCallback } from 'react';
import { supabase, fetchActiveFiles, deleteOfficeFile, deleteMultipleOfficeFiles, cleanupExpiredFiles, getFileUrl } from '../lib/supabase';
import { OfficeFile } from '../types';

export function useFiles(isAuthenticated: boolean, onNewFile?: (file: OfficeFile) => void) {
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Load files from Supabase (strictly guarded by authentication)
  const loadFiles = useCallback(async () => {
    if (!isAuthenticated) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchActiveFiles();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    } else {
      setFiles([]);
    }
  }, [loadFiles, isAuthenticated]);

  // Realtime subscription: Only listen if desk owner is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setRealtimeConnected(false);
      return;
    }

    const channel = supabase
      .channel('office-files-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'office_files',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as OfficeFile;
            const enrichedFile: OfficeFile = {
              ...newRecord,
              public_url: getFileUrl(newRecord.file_path),
            };

            setFiles((prev) => {
              if (prev.some((f) => f.id === enrichedFile.id)) return prev;
              return [enrichedFile, ...prev];
            });

            if (onNewFile) {
              onNewFile(enrichedFile);
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { id: string };
            setFiles((prev) => prev.filter((f) => f.id !== oldRecord.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, onNewFile]);

  // Delete single file
  const handleDeleteFile = useCallback(async (file: OfficeFile) => {
    await deleteOfficeFile(file.id, file.file_path);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }, []);

  // Delete multiple files
  const handleDeleteBatch = useCallback(async (batchFiles: OfficeFile[]) => {
    await deleteMultipleOfficeFiles(batchFiles);
    const deletedIds = new Set(batchFiles.map((f) => f.id));
    setFiles((prev) => prev.filter((f) => !deletedIds.has(f.id)));
  }, []);

  // Cleanup expired files (older than 24 hours)
  const handleCleanupExpired = useCallback(async () => {
    const cleaned = await cleanupExpiredFiles();
    await loadFiles();
    return cleaned;
  }, [loadFiles]);

  return {
    files,
    loading,
    realtimeConnected,
    loadFiles,
    deleteFile: handleDeleteFile,
    deleteBatch: handleDeleteBatch,
    cleanupExpired: handleCleanupExpired,
  };
}
