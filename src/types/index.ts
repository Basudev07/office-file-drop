export interface OfficeFile {
  id: string;
  sender_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
  expires_at: string;
  public_url?: string;
}

export interface SenderBatch {
  sender_name: string;
  timestamp: string; // ISO string of latest file in batch
  files: OfficeFile[];
  totalSize: number;
}

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export type AppView = 'receiver' | 'upload';
