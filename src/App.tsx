import { useState, useEffect, useCallback } from 'react';
import { supabase, fetchActiveFiles, deleteOfficeFile, deleteMultipleOfficeFiles, cleanupExpiredFiles } from './lib/supabase';
import { OfficeFile, AppView } from './types';
import { Navbar } from './components/Navbar';
import { ReceiverDashboard } from './components/ReceiverDashboard';
import { SenderUpload } from './components/SenderUpload';
import { QRCodeModal } from './components/QRCodeModal';
import { AuthModal } from './components/AuthModal';
import { FilePreviewModal } from './components/FilePreviewModal';

export function App() {
  // Routing view state: Senders go directly to /upload without seeing receiver dashboard
  const [currentView, setCurrentView] = useState<AppView>('upload');

  // App data & auth state
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<OfficeFile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync route with URL hash changes & guard receiver route
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('receiver')) {
        if (isAuthenticated) {
          setCurrentView('receiver');
        } else {
          // Senders cannot access receiver station page! Keep on /upload and prompt desk login
          setCurrentView('upload');
          setIsAuthModalOpen(true);
        }
      } else {
        setCurrentView('upload');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  const handleNavigate = (view: AppView) => {
    if (view === 'receiver' && !isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
    window.location.hash = view === 'receiver' ? 'receiver' : 'upload';
  };

  // Check initial Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuth = !!session;
      setIsAuthenticated(isAuth);

      const hash = window.location.hash.toLowerCase();
      if (isAuth && hash.includes('receiver')) {
        setCurrentView('receiver');
      } else {
        // Senders strictly land on upload directly
        setCurrentView('upload');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuth = !!session;
      setIsAuthenticated(isAuth);
      if (!isAuth) {
        setCurrentView('upload');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load files from Supabase (Only for authenticated receiver)
  const loadFiles = useCallback(async () => {
    if (!isAuthenticated) return;
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

  // Initial fetch: Only fetch desk files if authenticated as desk receiver
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    } else {
      setFiles([]);
    }
  }, [loadFiles, isAuthenticated]);

  // Supabase Realtime Subscription
  useEffect(() => {
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
            // Get public URL for storage path
            const { data } = supabase.storage.from('office_files').getPublicUrl(newRecord.file_path);
            const enrichedFile: OfficeFile = {
              ...newRecord,
              public_url: data.publicUrl,
            };

            // Only store and notify if authenticated as receiver
            if (isAuthenticated) {
              setFiles((prev) => {
                if (prev.some((f) => f.id === enrichedFile.id)) return prev;
                return [enrichedFile, ...prev];
              });

              if (currentView === 'receiver') {
                showToast(`📥 New drop from ${enrichedFile.sender_name}: ${enrichedFile.file_name}`);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            if (isAuthenticated) {
              const oldRecord = payload.old as { id: string };
              setFiles((prev) => prev.filter((f) => f.id !== oldRecord.id));
            }
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
  }, [isAuthenticated, currentView]);

  // Delete single file
  const handleDeleteFile = async (file: OfficeFile) => {
    try {
      await deleteOfficeFile(file.id, file.file_path);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      showToast(`Deleted ${file.file_name}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(`Delete failed: ${error.message || 'Ensure you are signed in as receiver.'}`);
    }
  };

  // Delete batch of files
  const handleDeleteBatch = async (batchFiles: OfficeFile[]) => {
    try {
      await deleteMultipleOfficeFiles(batchFiles);
      const deletedIds = new Set(batchFiles.map((f) => f.id));
      setFiles((prev) => prev.filter((f) => !deletedIds.has(f.id)));
      showToast(`Deleted ${batchFiles.length} files`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(`Delete batch failed: ${error.message || 'Ensure you are signed in as receiver.'}`);
    }
  };

  // Cleanup expired files
  const handleCleanupExpired = async () => {
    try {
      const cleaned = await cleanupExpiredFiles();
      await loadFiles();
      showToast(cleaned > 0 ? `Cleaned up ${cleaned} expired files.` : 'No expired files found.');
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  // Sign out of receiver mode
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentView('upload');
    window.location.hash = 'upload';
    setFiles([]);
    showToast('Signed out of Receiver mode');
  };

  return (
    <div className="app-wrapper">
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenQR={() => setIsQRModalOpen(true)}
        isAuthenticated={isAuthenticated}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        realtimeConnected={realtimeConnected}
      />

      {/* Main View Area: Senders ONLY see SenderUpload directly */}
      <main className="main-content">
        {!isAuthenticated || currentView === 'upload' ? (
          <SenderUpload />
        ) : (
          <ReceiverDashboard
            files={files}
            loading={loading}
            onRefresh={loadFiles}
            onDeleteFile={handleDeleteFile}
            onDeleteBatch={handleDeleteBatch}
            onPreviewFile={(file) => setPreviewFile(file)}
            onOpenQR={() => setIsQRModalOpen(true)}
            onCleanupExpired={handleCleanupExpired}
            isAuthenticated={isAuthenticated}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Minimal Footer Attribution across all pages */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>Office File Drop</span>
          <span className="footer-dot">•</span>
          <span className="footer-author">© BASUDEV</span>
        </div>
      </footer>

      {/* Permanent QR Standee Modal */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          setCurrentView('receiver');
          window.location.hash = 'receiver';
          showToast('Receiver station unlocked');
          loadFiles();
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDelete={(file) => handleDeleteFile(file)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
