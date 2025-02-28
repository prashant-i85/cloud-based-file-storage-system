        <!-- views/fileView.ejs -->
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Preview - <%= fileName %></title>
          <link rel="stylesheet" href="/css/style.css">
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              height: 100vh;
            }

            .file-viewer-header {
              background-color: #2c3e50;
              color: white;
              padding: 1rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .file-viewer-header h1 {
              margin: 0;
              font-size: 1.2rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 60%;
            }

            .viewer-actions {
              display: flex;
              gap: 1rem;
            }

            .viewer-btn {
              background-color: transparent;
              border: 1px solid white;
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              text-decoration: none;
              cursor: pointer;
              transition: all 0.3s;
              font-size: 14px;
            }

            .viewer-btn:hover {
              background-color: rgba(255, 255, 255, 0.1);
            }

            .file-content {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
              overflow: auto;
            }

            .image-preview {
              max-width: 100%;
              max-height: 90vh;
              object-fit: contain;
            }

            .video-preview {
              max-width: 100%;
              max-height: 80vh;
            }

            .pdf-preview {
              width: 100%;
              height: 100%;
              border: none;
            }

            .text-preview {
              width: 100%;
              height: 100%;
              padding: 1rem;
              white-space: pre-wrap;
              font-family: monospace;
              overflow: auto;
              background-color: #f5f5f5;
              border-radius: 4px;
            }

            .no-preview {
              padding: 3rem;
              text-align: center;
              background-color: #f9f9f9;
              border-radius: 8px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="file-viewer-header">
            <h1><%= fileName %></h1>
            <div class="viewer-actions">
              <a href="/files/download/<%= encodeURIComponent(fileKey) %>" class="viewer-btn">Download</a>
              <a href="/dashboard" class="viewer-btn">Back to Dashboard</a>
            </div>
          </div>

          <div class="file-content">
            <% if (fileType === 'image') { %>
              <img src="/files/view/<%= encodeURIComponent(fileKey) %>" alt="<%= fileName %>" class="image-preview">
            <% } else if (fileType === 'video') { %>
              <video src="/files/view/<%= encodeURIComponent(fileKey) %>" controls class="video-preview"></video>
            <% } else if (fileExtension === 'pdf') { %>
              <iframe src="/files/view/<%= encodeURIComponent(fileKey) %>" class="pdf-preview"></iframe>
            <% } else if (fileExtension === 'txt') { %>
              <div class="text-preview"><%= fileContent %></div>
            <% } else { %>
              <div class="no-preview">
                <h2>Preview not available for this file type</h2>
                <p>Click the Download button to view this file.</p>
              </div>
            <% } %>
          </div>

          <script>
            document.addEventListener('DOMContentLoaded', function() {
              // Adjust iframe height for PDF files
              const pdfFrame = document.querySelector('.pdf-preview');
              if (pdfFrame) {
                const headerHeight = document.querySelector('.file-viewer-header').offsetHeight;
                pdfFrame.style.height = `calc(100vh - ${headerHeight}px - 2rem)`;
              }
            });
          </script>
        </body>
        </html>