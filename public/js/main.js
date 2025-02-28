// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    // We no longer need to check localStorage for the token
    // The authentication is handled by cookies

    // Initialize the dashboard if on dashboard page
    if (window.location.pathname === '/dashboard') {
        initDashboard();
    }

    // Initialize logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Initialize dashboard
function initDashboard() {
    // Load files on page load
    loadFiles();

    // Set up event listeners
    document.getElementById('uploadBtn')?.addEventListener('click', uploadFile);
    document.getElementById('searchBtn')?.addEventListener('click', () => {
        const keyword = document.getElementById('searchInput').value;
        if (keyword) {
            searchFiles(keyword);
        } else {
            loadFiles();
        }
    });

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const keyword = document.getElementById('searchInput').value;
            if (keyword) {
                searchFiles(keyword);
            } else {
                loadFiles();
            }
        }
    });

    document.getElementById('fileTypeFilter')?.addEventListener('change', () => {
        loadFiles();
    });

    document.getElementById('sortOrder')?.addEventListener('change', () => {
        loadFiles();
    });
}

// Load files from the server
async function loadFiles() {
    try {
        const fileTypeFilter = document.getElementById('fileTypeFilter').value;
        const sortOrderValue = document.getElementById('sortOrder').value;
        const [sortBy, order] = sortOrderValue.split('-');

        let url = `/api/files/list?sortBy=${sortBy}&order=${order}`;
        if (fileTypeFilter) {
            url += `&fileType=${fileTypeFilter}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            const files = await response.json();
            displayFiles(files);
        } else {
            showAlert('error', 'Failed to load files');
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showAlert('error', 'An error occurred while loading files');
    }
}

// Search files
async function searchFiles(keyword) {
    try {
        const response = await fetch(`/api/files/search?keyword=${encodeURIComponent(keyword)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            const data = await response.json();
            displayFiles(data.files);
            if (data.files.length === 0) {
                showAlert('info', `No files found for "${keyword}"`);
            } else {
                showAlert('success', `Found ${data.files.length} files matching "${keyword}"`);
            }
        } else {
            showAlert('danger', 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showAlert('danger', 'An error occurred during search');
    }
}


// Display files in the table
function displayFiles(files) {
    const filesList = document.getElementById('filesList');

    if (!filesList) return;

    if (files.length === 0) {
        filesList.innerHTML = '<tr><td colspan="5" class="text-center py-4">No files found</td></tr>';
        return;
    }

    let html = '';
    files.forEach(file => {
        html += `
            <tr>
                <td>${file.filename}</td>
                <td>${file.fileType}</td>
                <td>${formatSize(file.size)}</td>
                <td>${new Date(file.uploadedAt).toLocaleString()}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="previewFile('${file.fileId}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <a href="/api/files/download/${file.fileId}" class="btn btn-sm btn-outline-success">
                            <i class="bi bi-download"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteFile('${file.fileId}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    filesList.innerHTML = html;
}

// Upload file
async function uploadFile() {
    const fileInput = document.getElementById('fileUpload');
    const progressBar = document.getElementById('uploadProgress');
    const progressBarInner = progressBar.querySelector('.progress-bar');
    const uploadError = document.getElementById('uploadError');

    if (!fileInput.files || fileInput.files.length === 0) {
        uploadError.textContent = 'Please select a file to upload';
        uploadError.classList.remove('d-none');
        return;
    }

    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
        uploadError.textContent = 'File size exceeds 5MB limit';
        uploadError.classList.remove('d-none');
        return;
    }

    // Reset UI
    uploadError.classList.add('d-none');
    progressBar.classList.remove('d-none');
    progressBarInner.style.width = '0%';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload', true);
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                progressBarInner.style.width = percentComplete + '%';
                progressBarInner.textContent = percentComplete + '%';
            }
        });

        xhr.onload = function() {
            if (xhr.status === 200) {
                // Success
                const response = JSON.parse(xhr.responseText);

                // Reset the form
                document.getElementById('uploadForm').reset();
                progressBar.classList.add('d-none');

                // Close modal
                const uploadModal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
                uploadModal.hide();

                // Show success message and reload files
                showAlert('success', 'File uploaded successfully');
                loadFiles();
            } else if (xhr.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                window.location.href = '/';
            } else {
                // Error
                let errorMsg = 'Upload failed';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.error || errorMsg;
                } catch (e) {}

                uploadError.textContent = errorMsg;
                uploadError.classList.remove('d-none');
                progressBar.classList.add('d-none');
            }
        };

        xhr.onerror = function() {
            uploadError.textContent = 'Network error occurred during upload';
            uploadError.classList.remove('d-none');
            progressBar.classList.add('d-none');
        };

        xhr.send(formData);
    } catch (error) {
        console.error('Upload error:', error);
        uploadError.textContent = 'An error occurred during upload';
        uploadError.classList.remove('d-none');
        progressBar.classList.add('d-none');
    }
}

// Preview file
async function previewFile(fileId) {
    const previewContent = document.getElementById('previewContent');
    const previewTitle = document.getElementById('previewTitle');
    const downloadBtn = document.getElementById('downloadBtn');

    // Show modal with loading state
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    previewModal.show();

    // Reset the preview content
    previewContent.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;

    try {
        const response = await fetch(`/api/files/${fileId}/preview`, {
            method: 'GET',
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            const data = await response.json();
            previewTitle.textContent = data.filename;
            downloadBtn.onclick = () => downloadFile(fileId);

            if (data.fileType === 'image') {
                previewContent.innerHTML = `<img src="${data.previewUrl}" class="img-fluid" alt="${data.filename}">`;
            } else if (data.fileType === 'video') {
                previewContent.innerHTML = `
                    <video controls class="img-fluid">
                        <source src="${data.previewUrl}" type="${data.mimeType}">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else if (data.fileType === 'document' && data.mimeType === 'application/pdf') {
                previewContent.innerHTML = `<iframe src="${data.previewUrl}" width="100%" height="500px" frameborder="0"></iframe>`;
            } else {
                previewContent.innerHTML = `
                    <div class="p-5 text-center">
                        <div class="display-1">
                            <i class="bi bi-file-earmark"></i>
                        </div>
                        <h4 class="mt-3">${data.filename}</h4>
                        <p class="text-muted">${capitalizeFirstLetter(data.fileType)} file</p>
                        <p>Preview not available. Click the download button to view this file.</p>
                    </div>
                `;
            }
        } else {
            showAlert('error', 'Failed to load preview');
        }
    } catch (error) {
        console.error('Preview error:', error);
        showAlert('error', 'An error occurred while loading the preview');
    }
}

// Download file
async function downloadFile(fileId) {
    try {
        const response = await fetch(`/api/files/${fileId}/download`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.target = '_blank';
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            showAlert('error', 'Failed to download file');
        }
    } catch (error) {
        console.error('Download error:', error);
        showAlert('error', 'An error occurred during download');
    }
}

// Delete file
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showAlert('success', 'File deleted successfully');
            loadFiles();
        } else {
            showAlert('error', 'Failed to delete file');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('error', 'An error occurred during deletion');
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            window.location.href = '/';
        } else {
            showAlert('error', 'Failed to logout');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('error', 'An error occurred during logout');
    }
}


// Helper function to format file size
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to show alerts
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}