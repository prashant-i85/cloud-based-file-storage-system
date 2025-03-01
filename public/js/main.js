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

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Helper functions to format file size and get file icon
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
}

function getFileIcon(fileType) {
    switch (fileType) {
        case 'image':
            return '<i class="bi bi-file-earmark-image"></i>';
        case 'video':
            return '<i class="bi bi-file-earmark-play"></i>';
        case 'document':
            return '<i class="bi bi-file-earmark-text"></i>';
        default:
            return '<i class="bi bi-file-earmark"></i>';
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Show alert messages
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => {
        alert.classList.remove('show');
        alert.addEventListener('transitionend', () => alert.remove());
    }, 5000);
}
