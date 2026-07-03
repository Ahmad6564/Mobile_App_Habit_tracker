import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { Errors } from "../utils/AppError";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!env.aws.region || !env.aws.accessKeyId || !env.aws.secretAccessKey) {
      throw Errors.badRequest("Media upload is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.");
    }
    s3Client = new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId:     env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
    });
  }
  return s3Client;
}

export class MediaService {
  /**
   * Generate a presigned PUT URL so the client can upload directly to S3.
   * Returns the presigned URL and the final public object URL.
   */
  async getPresignedUploadUrl(
    userId: string,
    contentType: string,
    fileSizeBytes: number
  ): Promise<{ uploadUrl: string; objectUrl: string; key: string }> {
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw Errors.badRequest(`Unsupported file type: ${contentType}`);
    }
    if (fileSizeBytes > MAX_FILE_SIZE) {
      throw Errors.badRequest("File exceeds maximum allowed size of 100 MB");
    }

    if (!env.aws.s3Bucket) {
      throw Errors.badRequest("Media upload is not configured. Set AWS_S3_BUCKET.");
    }

    const ext = contentType.split("/")[1].replace("quicktime", "mov");
    const key = `uploads/${userId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket:        env.aws.s3Bucket,
      Key:           key,
      ContentType:   contentType,
      ContentLength: fileSizeBytes,
    });

    const client = getS3Client();
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }); // 5 min TTL

    const objectUrl = `https://${env.aws.s3Bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;

    return { uploadUrl, objectUrl, key };
  }
}
