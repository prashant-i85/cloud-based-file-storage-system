const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize AWS services
const s3 = new AWS.S3();
const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// S3 bucket name
const BUCKET_NAME = process.env.BUCKET_NAME || 'cloud-storage-app-files';

// Cognito User Pool configurations
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

// DynamoDB table name
const FILES_TABLE = 'userFiles';

// Create S3 bucket if it doesn't exist
const createBucketIfNotExists = async () => {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`Bucket ${BUCKET_NAME} already exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      await s3.createBucket({
        Bucket: BUCKET_NAME,
        ACL: 'private'
      }).promise();
      console.log(`Bucket ${BUCKET_NAME} created successfully`);

      // Set bucket policy for public read access to specific files
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [{
          Sid: 'PublicReadForGetBucketObjects',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/public/*`]
        }]
      };

      await s3.putBucketPolicy({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(bucketPolicy)
      }).promise();
    } else {
      console.error('Error creating bucket:', error);
      throw error;
    }
  }
};

// Create DynamoDB table if it doesn't exist
const createTableIfNotExists = async () => {
  const params = {
    TableName: FILES_TABLE,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'fileId', KeyType: 'RANGE' }  // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'fileId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'FileTypeIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'fileId', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ]
  };

  try {
    const dynamodb = new AWS.DynamoDB();
    await dynamodb.createTable(params).promise();
    console.log(`Table ${FILES_TABLE} created successfully`);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log(`Table ${FILES_TABLE} already exists`);
    } else {
      console.error('Error creating DynamoDB table:', error);
      throw error;
    }
  }
};

// Initialize AWS resources
const initializeAWS = async () => {
  await createBucketIfNotExists();
  await createTableIfNotExists();
};

module.exports = {
  s3,
  cognito,
  dynamoDB,
  BUCKET_NAME,
  USER_POOL_ID,
  CLIENT_ID,
  FILES_TABLE,
  initializeAWS
};