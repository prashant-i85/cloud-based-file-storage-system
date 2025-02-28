const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const { s3, dynamoDB, BUCKET_NAME, FILES_TABLE } = require('../config/aws-config');
const { authenticate } = require('../middlewares/auth');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const userId = req.userId;
      const fileId = uuidv4();
      const extension = path.extname(file.originalname);
      cb(null, `${userId}/${fileId}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for demonstration purposes
    // In a real application, you might want to restrict file types
    cb(null, true);
  }
});

// Helper function to get file type
const getFileType = (filename) => {
  const extension = path.extname(filename).toLowerCase();

  // Group files by type
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension)) {
    return 'image';
  } else if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(extension)) {
    return 'video';
  } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(extension)) {
    return 'document';
  } else {
    return 'other';
  }
};

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = path.basename(req.file.key).split('.')[0];
    const fileType = getFileType(req.file.originalname);

    // Save file metadata to DynamoDB
    const fileData = {
      TableName: FILES_TABLE,
      Item: {
        userId: req.userId,
        fileId: fileId,
        filename: req.file.originalname,
        s3Key: req.file.key,
        fileType: fileType,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    };

    await dynamoDB.put(fileData).promise();

    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        fileId,
        filename: req.file.originalname,
        fileType,
        size: req.file.size,
        uploadedAt: fileData.Item.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of files for user
router.get('/list', authenticate, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { fileType, sortBy = 'uploadedAt', order = 'desc' } = req.query;

    // Prepare DynamoDB query
    const params = {
      TableName: FILES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': req.userId
      }
    };

    // Add filter for file type if specified
    if (fileType) {
      params.FilterExpression = 'fileType = :fileType';
      params.ExpressionAttributeValues[':fileType'] = fileType;
    }

    const result = await dynamoDB.query(params).promise();

    // Sort the results
    let files = result.Items;
    files.sort((a, b) => {
      if (order === 'asc') {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });

    res.status(200).json({
      message: 'Files retrieved successfully',
      files
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search files
router.get('/search', authenticate, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: 'Search keyword is required' });
    }

    const params = {
      TableName: FILES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'contains(filename, :keyword)',
      ExpressionAttributeValues: {
        ':userId': req.userId,
        ':keyword': keyword
      }
    };

    const result = await dynamoDB.query(params).promise();

    res.status(200).json({
      message: 'Search results',
      files: result.Items
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file details
router.get('/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    const params = {
      TableName: FILES_TABLE,
      Key: {
        userId: req.userId,
        fileId: fileId
      }
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(200).json({
      message: 'File details retrieved',
      file: result.Item
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/:fileId/download', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata from DynamoDB
    const fileParams = {
      TableName: FILES_TABLE,
      Key: {
        userId: req.userId,
        fileId: fileId
      }
    };

    const fileData = await dynamoDB.get(fileParams).promise();

    if (!fileData.Item) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate pre-signed URL for temporary download access
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileData.Item.s3Key,
      Expires: 60, // URL expires in 60 seconds
      ResponseContentDisposition: `attachment; filename="${fileData.Item.filename}"`
    };

    const downloadUrl = s3.getSignedUrl('getObject', s3Params);

    res.status(200).json({
      message: 'Download URL generated',
      downloadUrl,
      filename: fileData.Item.filename
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preview file (for images, documents, videos)
router.get('/:fileId/preview', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata from DynamoDB
    const fileParams = {
      TableName: FILES_TABLE,
      Key: {
        userId: req.userId,
        fileId: fileId
      }
    };

    const fileData = await dynamoDB.get(fileParams).promise();

    if (!fileData.Item) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate pre-signed URL for temporary view access
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileData.Item.s3Key,
      Expires: 300 // URL expires in 5 minutes
    };

    const previewUrl = s3.getSignedUrl('getObject', s3Params);

    res.status(200).json({
      message: 'Preview URL generated',
      previewUrl,
      fileType: fileData.Item.fileType,
      mimeType: fileData.Item.mimeType,
      filename: fileData.Item.filename
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata from DynamoDB
    const fileParams = {
      TableName: FILES_TABLE,
      Key: {
        userId: req.userId,
        fileId: fileId
      }
    };

    const fileData = await dynamoDB.get(fileParams).promise();

    if (!fileData.Item) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from S3
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileData.Item.s3Key
    };

    await s3.deleteObject(s3Params).promise();

    // Delete metadata from DynamoDB
    await dynamoDB.delete(fileParams).promise();

    res.status(200).json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;