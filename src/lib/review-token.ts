import { createHmac, timingSafeEqual } from "node:crypto";

const REVIEW_SECONDS = 300;
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 4;

type ReviewTokenPayload = {
  version: 1;
  userId: string;
  moduleId: string;
  eligibleAt: number;
  expiresAt: number;
};

function signingSecret(): string {
  const secret =
    process.env.TRAINING_COMPLETION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Training completion signing secret is unavailable");
  return secret;
}

function signature(encodedPayload: string): Buffer {
  return createHmac("sha256", signingSecret()).update(encodedPayload).digest();
}

export function createReviewToken(
  userId: string,
  moduleId: string,
  skipTimer: boolean,
): { token: string; eligibleAt: number } {
  const now = Math.floor(Date.now() / 1_000);
  const payload: ReviewTokenPayload = {
    version: 1,
    userId,
    moduleId,
    eligibleAt: now + (skipTimer ? 0 : REVIEW_SECONDS),
    expiresAt: now + TOKEN_LIFETIME_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const encodedSignature = signature(encodedPayload).toString("base64url");

  return {
    token: `${encodedPayload}.${encodedSignature}`,
    eligibleAt: payload.eligibleAt,
  };
}

export function verifyReviewToken(
  token: string,
  expectedUserId: string,
  expectedModuleId: string,
): { valid: boolean; eligible: boolean } {
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) {
    return { valid: false, eligible: false };
  }

  try {
    const suppliedSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = signature(encodedPayload);
    if (
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      return { valid: false, eligible: false };
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as ReviewTokenPayload;
    const now = Math.floor(Date.now() / 1_000);
    const valid =
      payload.version === 1 &&
      payload.userId === expectedUserId &&
      payload.moduleId === expectedModuleId &&
      Number.isInteger(payload.eligibleAt) &&
      Number.isInteger(payload.expiresAt) &&
      payload.expiresAt >= now;

    return { valid, eligible: valid && payload.eligibleAt <= now };
  } catch {
    return { valid: false, eligible: false };
  }
}
