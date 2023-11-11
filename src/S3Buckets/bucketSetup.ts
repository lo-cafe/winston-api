import { S3Client } from "@aws-sdk/client-s3";
import { config } from 'dotenv';
config();

/**
 * Represents a client for interacting with an S3 (Simple Storage Service) API.
 *
 * @class
 * @constructor
 * @param {Object} options - The configuration options for the S3 client.
 * @param {string} options.region - The AWS region to connect to.
 * @param {Object} options.credentials - The AWS credentials for authentication.
 * @param {string} options.credentials.accessKeyId - The access key ID for authentication.
 * @param {string} options.credentials.secretAccessKey - The secret access key for authentication.
 * @param {string} options.endpoint - The S3 endpoint to connect to.
 */
export const s3Client = new S3Client({
  region: "garage",
  credentials: {
    accessKeyId: process.env.S3_KEY_ID!,
    secretAccessKey: process.env.S3_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT
});
