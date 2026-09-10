/**
 * Helper to trigger browser print dialog directly for images and PDFs
 */
export async function printRemoteFile(url: string, fileName: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    };

    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName) || url.includes('image');
    const isText = /\.(txt|md|log|json|csv|py|js|ts|html|css|sql|sh)$/i.test(fileName);

    if (isImage) {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.open(url, '_blank');
        cleanup();
        resolve(true);
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print: ${fileName}</title>
            <style>
              @page { margin: 1cm; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${url}" id="target-img" alt="${fileName}" />
            <script>
              const img = document.getElementById('target-img');
              img.onload = () => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 250);
              };
              img.onerror = () => {
                alert('Could not load image for printing');
              };
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        cleanup();
        resolve(true);
      }, 1000);
    } else if (isText) {
      fetch(url)
        .then((res) => res.text())
        .then((rawContent) => {
          const doc = iframe.contentWindow?.document;
          if (!doc) {
            window.open(url, '_blank');
            cleanup();
            resolve(true);
            return;
          }
          const safeText = rawContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Print: ${fileName}</title>
                <style>
                  @page { margin: 1.5cm; }
                  body { font-family: monospace; font-size: 11px; line-height: 1.5; color: #111; margin: 0; }
                  .header { border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 14px; font-weight: bold; font-size: 14px; }
                  pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
                </style>
              </head>
              <body>
                <div class="header">Office File Drop • ${fileName}</div>
                <pre>${safeText}</pre>
                <script>
                  setTimeout(() => {
                    window.focus();
                    window.print();
                  }, 250);
                </script>
              </body>
            </html>
          `);
          doc.close();
          setTimeout(() => {
            cleanup();
            resolve(true);
          }, 1200);
        })
        .catch((err) => {
          console.error('Error fetching text for print:', err);
          window.open(url, '_blank');
          cleanup();
          resolve(false);
        });
    } else {
      // PDF or other documents
      iframe.src = url;
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanup();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print blocked, opening new window:', err);
          // Fallback popup
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            printWindow.onload = () => printWindow.print();
          }
          cleanup();
          resolve(true);
        }
      };

      iframe.onerror = () => {
        window.open(url, '_blank');
        cleanup();
        resolve(false);
      };
    }
  });
}
