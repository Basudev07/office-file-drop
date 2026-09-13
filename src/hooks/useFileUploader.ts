import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { uploadOfficeFile } from '../lib/supabase';
import { SelectedFileItem } from '../types';

export function useFileUploader() {
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('office_drop_sender_name') || '';
  });
  const [uploadMode, setUploadMode] = useState<'files' | 'text'>('files');
  const [rawText, setRawText] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Sync sender name to localStorage
  useEffect(() => {
    if (senderName.trim()) {
      localStorage.setItem('office_drop_sender_name', senderName.trim());
    }
  }, [senderName]);

  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setGlobalError(null);
    setUploadComplete(false);

    const newItems: SelectedFileItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      progress: 0,
      status: 'pending',
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const resetAll = useCallback(() => {
    setSelectedFiles([]);
    setRawText('');
    setTextTitle('');
    setUploadComplete(false);
    setGlobalError(null);
  }, []);

  const pasteClipboardText = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setRawText((prev) => (prev ? `${prev}\n${clip}` : clip));
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
    }
  }, []);

  // Upload raw text directly
  const uploadRawText = useCallback(async () => {
    if (!senderName.trim()) {
      setGlobalError('Please enter your name or department before dropping.');
      return;
    }
    if (!rawText.trim()) {
      setGlobalError('Please enter or paste text to drop.');
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    try {
      const cleanTitle =
        textTitle.trim() ||
        `Text_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/[:\s]/g, '-')}`;
      const fileName = cleanTitle.toLowerCase().endsWith('.txt') ? cleanTitle : `${cleanTitle}.txt`;
      const textBlob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
      const textFile = new File([textBlob], fileName, {
        type: 'text/plain;charset=utf-8',
        lastModified: Date.now(),
      });

      await uploadOfficeFile(textFile, senderName.trim());

      setUploadComplete(true);
      setRawText('');
      setTextTitle('');

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // fallback if canvas-confetti fails
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGlobalError(`Failed to drop text: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  }, [senderName, rawText, textTitle]);

  // Convert raw text into a file queued alongside regular files
  const addTextToQueue = useCallback(() => {
    if (!rawText.trim()) return;

    const cleanTitle =
      textTitle.trim() ||
      `Text_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/[:\s]/g, '-')}`;
    const fileName = cleanTitle.toLowerCase().endsWith('.txt') ? cleanTitle : `${cleanTitle}.txt`;
    const textBlob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const textFile = new File([textBlob], fileName, {
      type: 'text/plain;charset=utf-8',
      lastModified: Date.now(),
    });

    setSelectedFiles((prev) => [
      ...prev,
      {
        id: `${fileName}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file: textFile,
        progress: 0,
        status: 'pending',
      },
    ]);

    setRawText('');
    setTextTitle('');
    setUploadMode('files');
  }, [rawText, textTitle]);

  // Upload all queued files sequentially with real progress
  const uploadAllFiles = useCallback(async () => {
    if (!senderName.trim()) {
      setGlobalError('Please enter your name or department so the receiver knows who sent the files.');
      return;
    }
    if (selectedFiles.length === 0) {
      setGlobalError('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    let hasErrors = false;

    for (const item of selectedFiles) {
      if (item.status === 'completed') continue;

      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 15 } : f))
      );

      try {
        await uploadOfficeFile(item.file, senderName.trim(), (pct) => {
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: pct } : f))
          );
        });

        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'completed', progress: 100 } : f))
        );
      } catch (err: unknown) {
        hasErrors = true;
        const error = err as { message?: string };
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', errorMessage: error.message || 'Failed' } : f
          )
        );
      }
    }

    setIsUploading(false);

    if (!hasErrors) {
      setUploadComplete(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // fallback
      }
    } else {
      setGlobalError('Some files could not be uploaded. Please review the errors below.');
    }
  }, [senderName, selectedFiles]);

  return {
    senderName,
    setSenderName,
    uploadMode,
    setUploadMode,
    rawText,
    setRawText,
    textTitle,
    setTextTitle,
    selectedFiles,
    isUploading,
    uploadComplete,
    globalError,
    setGlobalError,
    addFiles,
    removeFile,
    clearQueue,
    resetAll,
    pasteClipboardText,
    uploadRawText,
    addTextToQueue,
    uploadAllFiles,
  };
}
