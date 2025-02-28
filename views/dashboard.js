<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloud Storage App - Dashboard</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="/dashboard">Cloud Storage App</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="/dashboard">Files</a>
                    </li>
                </ul>
                <div class="d-flex">
                    <button id="logoutBtn" class="btn btn-outline-light">Logout</button>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row mb-4">
            <div class="col-md-6">
                <h2>My Files</h2>
            </div>
            <div class="col-md-6 text-end">
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal">
                    <i class="bi bi-cloud-upload"></i> Upload File
                </button>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <div class="input-group">
                    <input type="text" id="searchInput" class="form-control" placeholder="Search files...">
                    <button id="searchBtn" class="btn btn-outline-secondary">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-6">
                <div class="d-flex justify-content-end">
                    <div class="me-2">
                        <select id="fileTypeFilter" class="form-select">
                            <option value="">All Files</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                            <option value="document">Documents</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <select id="sortOrder" class="form-select">
                            <option value="uploadedAt-desc">Newest First</option>
                            <option value="uploadedAt-asc">Oldest First</option>
                            <option value="filename-asc">Name (A-Z)</option>
                            <option value="filename-desc">Name (Z-A)</option>
                            <option value="size-desc">Size (Largest)</option>
                            <option value="size-asc">Size (Smallest)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div id="alertContainer"></div>

        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Size</th>
                                        <th>Uploaded</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="filesList">
                                    <tr>
                                        <td colspan="5" class="text-center py-4">Loading files...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Upload Modal -->
    <div class="modal fade" id="uploadModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Upload File</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="uploadForm">
                        <div class="mb-3">
                            <label for="fileUpload" class="form-label">Select File</label>
                            <input type="file" class="form-control" id="fileUpload" name="file" required>
                            <small class="form-text text-muted">Max file size: 5MB</small>
                        </div>
                        <div class="progress mb-3 d-none" id="uploadProgress">
                            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div id="uploadError" class="alert alert-danger d-none"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" id="uploadBtn" class="btn btn-primary">Upload</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Preview Modal -->
    <div class="modal fade" id="previewModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="previewTitle">File Preview</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="previewContent" class="text-center">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <a id="downloadBtn" href="#" class="btn btn-primary" target="_blank">Download</a>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>