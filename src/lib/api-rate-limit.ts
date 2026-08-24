import { db } from "@/lib/db";

export async function consumeApiRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await db.rpc("consume_api_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] unable to verify request allowance");
    return false;
  }

  return data === true;
}
