// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        // Redirect to login if not logged in
        window.location.href = '/';
    }

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
    document.getElementById('uploadBtn').addEventListener('click', uploadFile);
    document.getElementById('searchBtn').addEventListener('click', () => {
        const keyword = document.getElementById('searchInput').value;
        if (keyword) {
            searchFiles(keyword);
        } else {
            loadFiles();
        }
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const keyword = document.getElementById('searchInput').value;
            if (keyword) {
                searchFiles(keyword);
            } else {
                loadFiles();
            }
        }
    });

    document.getElementById('fileTypeFilter').addEventListener('change', () => {
        loadFiles();
    });

    document.getElementById('sortOrder').addEventListener('change', () => {
        loadFiles();
    });
}

// Load files from the server
async function loadFiles() {
    try {
        const fileTypeFilter = document.getElementById('fileTypeFilter').value;
        const sortOrderValue = document.getElementById('sortOrder').value;
        const [sortBy, order] = sortOrderValue.split('-');

        const token = localStorage.getItem('token');

        let url = `/api/files/list?sortBy=${sortBy}&order=${order}`;
        if (fileTypeFilter) {
            url += `&fileType=${fileTypeFilter}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            displayFiles(data.files);
        } else {
            showAlert('danger', data.error || 'Failed to load files');
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showAlert('danger', 'An error occurred while loading files');
    }
}

// Search files
async function searchFiles(keyword) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/files/search?keyword=${encodeURIComponent(keyword)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            displayFiles(data.files);
            if (data.files.length === 0) {
                showAlert('info', `No files found for "${keyword}"`);
            } else {
                showAlert('success', `Found ${data.files.length} files matching "${keyword}"`);
            }
        } else {
            showAlert('danger', data.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showAlert('danger', 'An error occurred during search');
    }
}

// Display files in the table
function displayFiles(files) {
    const filesList = document.getElementById('filesList');

    if (files.length === 0) {
        filesList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="mb-3">
                        <i class="bi bi-folder2-open display-4"></i>
                    </div>
                    <p class="mb-0">No files found</p>
                </td>
            </tr>
        `;
        return;
    }

    filesList.innerHTML = files.map(file => {
        // Format file size
        const fileSize = formatFileSize(file.size);

        // Format date
        const uploadDate = new Date(file.uploadedAt).toLocaleDateString();

        // Get icon based on file type
        const icon = getFileIcon(file.fileType);

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-2">${icon}</div>
                        <div>${file.filename}</div>
                    </div>
                </td>
                <td>${capitalizeFirstLetter(file.fileType)}</td>
                <td>${fileSize}</td>
                <td>${uploadDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="previewFile('${file.fileId}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="downloadFile('${file.fileId}')">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFile('${file.fileId}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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
        const token = localStorage.getItem('token');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload', true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

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
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/files/${fileId}/preview`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            // Update preview title
            previewTitle.textContent = data.filename;

            // Set download button
            downloadBtn.onclick = () => downloadFile(fileId);

            // Display preview based on file type
            if (data.fileType === 'image') {
                previewContent.innerHTML = `
                    <img src="${data.previewUrl}" class="img-fluid" alt="${data.filename}">
                `;
            } else if (data.fileType === 'video') {
                previewContent.innerHTML = `
                    <video controls class="img-fluid">
                        <source src="${data.previewUrl}" type="${data.mimeType}">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else if (data.fileType === 'document' && data.mimeType === 'application/pdf') {
                previewContent.innerHTML = `
                    <iframe src="${data.previewUrl}" width="100%" height="500px" frameborder="0"></iframe>
                `;
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
            previewContent.innerHTML = `
                <div class="alert alert-danger">
                    ${data.error || 'Failed to load preview'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Preview error:', error);
        previewContent.innerHTML = `
            <div class="alert alert-danger">
                An error occurred while loading the preview
            </div>
        `;
    }
}

// Download file
async function downloadFile(fileId) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/files/${fileId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            // Create a temporary link and click it to start download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.target = '_blank';
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            showAlert('danger', data.error || 'Failed to download file');
        }
    } catch (error) {
        console.error('Download error:', error);
        showAlert('danger', 'An error occurred during download');
    }
}

// Delete file
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            showAlert('success', 'File deleted successfully');
            loadFiles();
        } else {
            showAlert('danger', data.error || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('danger', 'An error occurred during deletion');
    }
}

// Logout
async function logout() {
    try {
        const token = localStorage.getItem('token');

        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Utility functions
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();

    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    alertContainer.innerHTML += alertHtml;

    // Auto-close after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    switch (fileType) {
        case 'image':
            return '<i class="bi bi-file-image text-primary"></i>';
        case 'video':
            return '<i class="bi bi-file-play text-danger"></i>';
        case 'document':
            return '<i class="bi bi-file-text text-info"></i>';
        default:
            return '<i class="bi bi-file-earmark text-secondary"></i>';
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}