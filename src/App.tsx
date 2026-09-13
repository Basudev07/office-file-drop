import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useFiles } from './hooks/useFiles';
import { OfficeFile, AppView } from './types';
import { Navbar } from './components/Navbar';
import { SenderUpload } from './components/SenderUpload';

// Lazy-loaded components for optimal initial bundle & performance
const ReceiverDashboard = lazy(() => import('./components/ReceiverDashboard'));
const QRCodeModal = lazy(() => import('./components/QRCodeModal').then(m => ({ default: m.QRCodeModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const FilePreviewModal = lazy(() => import('./components/FilePreviewModal').then(m => ({ default: m.FilePreviewModal })));

export function App() {
  // Routing view state: 'drop' (senders) vs 'station' (desk receiver)
  const [currentView, setCurrentView] = useState<AppView>('drop');

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<OfficeFile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Auth Hook
  const { isAuthenticated, loadingAuth, signOut } = useAuth();

  // Handle incoming drops toast notification
  const handleNewFile = useCallback((newFile: OfficeFile) => {
    if (isAuthenticated && currentView === 'station') {
      showToast(`📥 New drop from ${newFile.sender_name}: ${newFile.file_name}`);
    }
  }, [isAuthenticated, currentView, showToast]);

  // Files Hook (Only queries database when authenticated)
  const {
    files,
    loading: filesLoading,
    realtimeConnected,
    loadFiles,
    deleteFile,
    deleteBatch,
    cleanupExpired,
  } = useFiles(isAuthenticated, handleNewFile);

  // Sync route with URL hash changes & strictly guard station route
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('station') || hash.includes('receiver')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentView('station');
          setIsAuthModalOpen(false);
        } else {
          // Senders cannot access receiver station! Keep on /drop and show auth dialog
          setCurrentView('drop');
          setIsAuthModalOpen(true);
        }
      } else {
        setCurrentView('drop');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initial route setup once auth check finishes
  useEffect(() => {
    if (loadingAuth) return;

    const hash = window.location.hash.toLowerCase();
    if (isAuthenticated && (hash.includes('station') || hash.includes('receiver'))) {
      setCurrentView('station');
    } else {
      // Default to isolated drop mode
      setCurrentView('drop');
    }
  }, [loadingAuth, isAuthenticated]);

  const handleNavigate = (view: AppView) => {
    if (view === 'station' && !isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
    window.location.hash = view === 'station' ? 'station' : 'drop';
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('drop');
    window.location.hash = 'drop';
    showToast('Signed out of Receiver Station');
  };

  const handleDeleteFile = async (file: OfficeFile) => {
    try {
      await deleteFile(file);
      showToast(`Deleted ${file.file_name}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(`Delete failed: ${error.message || 'Ensure you are signed in as receiver.'}`);
    }
  };

  const handleDeleteBatch = async (batchFiles: OfficeFile[]) => {
    try {
      await deleteBatch(batchFiles);
      showToast(`Deleted ${batchFiles.length} files`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(`Delete batch failed: ${error.message || 'Ensure you are signed in as receiver.'}`);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      const cleaned = await cleanupExpired();
      showToast(cleaned > 0 ? `Cleaned up ${cleaned} expired files.` : 'No expired files found.');
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Navigation Bar */}
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
        {!isAuthenticated || currentView === 'drop' ? (
          <SenderUpload />
        ) : (
          <Suspense fallback={<div className="loading-fallback">Loading Receiver Station...</div>}>
            <ReceiverDashboard
              files={files}
              loading={filesLoading}
              onRefresh={loadFiles}
              onDeleteFile={handleDeleteFile}
              onDeleteBatch={handleDeleteBatch}
              onPreviewFile={(file) => setPreviewFile(file)}
              onOpenQR={() => setIsQRModalOpen(true)}
              onCleanupExpired={handleCleanupExpired}
              isAuthenticated={isAuthenticated}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </Suspense>
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

      {/* Lazy Modals */}
      <Suspense fallback={null}>
        {isQRModalOpen && (
          <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
        )}

        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={() => {
              setIsAuthModalOpen(false);
              setCurrentView('station');
              window.location.hash = 'station';
              showToast('Receiver Station unlocked');
            }}
          />
        )}

        {previewFile && (
          <FilePreviewModal
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            onDelete={(file) => handleDeleteFile(file)}
          />
        )}
      </Suspense>

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
