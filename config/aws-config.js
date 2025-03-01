const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Constants
const FILES_TABLE = process.env.FILES_TABLE || 'cloud_storage_files';
const BUCKET_NAME = process.env.BUCKET_NAME || 'cloud-storage-files';

// Configure AWS
const initializeAWS = async () => {
  // Configure AWS SDK
  AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  // Create S3 bucket if it doesn't exist
  await createBucketIfNotExists();

  // Create DynamoDB table if it doesn't exist
  await createTableIfNotExists();

  return {
    s3: new AWS.S3(),
    dynamodb: new AWS.DynamoDB.DocumentClient(),
    cognito: new AWS.CognitoIdentityServiceProvider() //Added Cognito from original
  };
};

const createBucketIfNotExists = async () => {
  const s3 = new AWS.S3();
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`Bucket ${BUCKET_NAME} already exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      try {
        await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`Bucket ${BUCKET_NAME} created successfully`);
      } catch (createError) {
        console.error('Error creating S3 bucket:', createError);
        throw createError;
      }
    } else {
      console.error('Error checking S3 bucket:', error);
      throw error;
    }
  }
};

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

module.exports = {
  initializeAWS,
  BUCKET_NAME,
  FILES_TABLE,
  //Retained from original
  s3: new AWS.S3(),
  cognito: new AWS.CognitoIdentityServiceProvider(),
  dynamoDB: new AWS.DynamoDB.DocumentClient()
};