import { Router, Request, Response } from "express";
import Joi from "joi";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { MediaService } from "../services/media.service";

const router = Router();
const service = new MediaService();

router.use(authenticate);

const presignSchema = Joi.object({
  contentType:    Joi.string().required(),
  fileSizeBytes:  Joi.number().integer().min(1).required(),
});

/**
 * POST /api/media/presign
 * Request a presigned S3 PUT URL for direct client upload.
 * Body: { contentType, fileSizeBytes }
 * Returns: { uploadUrl, objectUrl, key }
 */
router.post(
  "/presign",
  validate(presignSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentType, fileSizeBytes } = req.body as { contentType: string; fileSizeBytes: number };
    const result = await service.getPresignedUploadUrl(
      (req as any).user.id,
      contentType,
      fileSizeBytes
    );
    sendSuccess(res, result, 200, "Presigned URL generated");
  })
);

/**
 * POST /api/media/confirm
 * Inform the server that an upload to S3 has completed.
 * Body: { key }  (the key returned by /presign)
 * Currently a no-op placeholder — can trigger transcoding jobs in future phases.
 */
router.post(
  "/confirm",
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, null, 200, "Upload confirmed");
  })
);

export default router;
