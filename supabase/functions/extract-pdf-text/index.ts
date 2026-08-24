import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const PROJECT_HOST = "uwalxhxajdkecucjcdwk.supabase.co";
const ASSET_PATHS = [
  "/storage/v1/object/sign/training-assets/",
];
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_CHARS = 750_000;
const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function approvedAssetUrl(raw: string): URL | null {
  try {
    const target = new URL(raw);
    const approvedPath = ASSET_PATHS.some((prefix) =>
      target.pathname.startsWith(prefix)
    );

    if (
      target.protocol !== "https:" ||
      target.hostname !== PROJECT_HOST ||
      target.username ||
      target.password ||
      !approvedPath
    ) {
      return null;
    }

    return target;
  } catch {
    return null;
  }
}

async function isAuthorizedManager(req: Request): Promise<boolean> {
  const authorization = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return false;
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile } = await adminClient
    .from("User")
    .select("role, isActive, mustResetPassword")
    .eq("authId", user.id)
    .maybeSingle();

  return Boolean(
    profile?.isActive &&
      !profile.mustResetPassword &&
      ALLOWED_ROLES.has(profile.role),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!(await isAuthorizedManager(req))) {
    return json({ error: "Manager authentication required" }, 403);
  }

  const rawTarget = new URL(req.url).searchParams.get("url");
  if (!rawTarget || rawTarget.length > 2_048) {
    return json({ error: "A valid training asset URL is required" }, 400);
  }

  const target = approvedAssetUrl(rawTarget);
  if (!target) {
    return json({ error: "Only approved TrainOS PDF assets can be read" }, 400);
  }

  try {
    const response = await fetch(target, {
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/pdf" },
    });

    if (!response.ok) {
      return json({ error: `Asset fetch failed (${response.status})` }, 502);
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_PDF_BYTES) {
      return json({ error: "PDF exceeds the 15 MB extraction limit" }, 413);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("pdf") && !target.pathname.toLowerCase().endsWith(".pdf")) {
      return json({ error: "The selected asset is not a PDF" }, 415);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > MAX_PDF_BYTES) {
      return json({ error: "PDF exceeds the 15 MB extraction limit" }, 413);
    }

    const pdf = await getDocumentProxy(bytes);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const fullText = (Array.isArray(text) ? text.join("\n\n") : text).slice(
      0,
      MAX_TEXT_CHARS,
    );

    return json({
      bytes: bytes.length,
      pages: totalPages,
      textLength: fullText.length,
      truncated: fullText.length === MAX_TEXT_CHARS,
      text: fullText,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return json(
      { error: timedOut ? "Asset fetch timed out" : "PDF extraction failed" },
      timedOut ? 504 : 500,
    );
  }
});
