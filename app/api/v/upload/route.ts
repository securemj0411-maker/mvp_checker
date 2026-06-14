import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BUCKET = "site-media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

let bucketReady = false;
async function ensureBucket(admin: ReturnType<typeof getSupabaseAdmin>) {
  if (bucketReady) return;
  // 이미 있으면 에러 무시(public read 버킷). 첫 호출에만 생성 시도.
  await admin.storage
    .createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED,
    })
    .catch(() => {});
  bucketReady = true;
}

/** 검증 페이지 미디어(썸네일) 업로드.
 *  편집기에서 access_code로 본인 리드를 확인한 뒤 service_role로 적재한다.
 *  anon 스토리지 쓰기를 열지 않으므로 안전. public-read 버킷이라 URL만 돌려준다. */
export async function POST(request: Request) {
  if (!rateLimit(ipKey(request, "upload"), 20, 60_000))
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const file = form.get("file");
  const code = (form.get("code") ?? "")
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 12);
  if (!(file instanceof File) || code.length < 8)
    return Response.json({ ok: false }, { status: 400 });
  if (file.size > MAX_BYTES)
    return Response.json({ ok: false, error: "too_large" }, { status: 413 });
  if (!ALLOWED.includes(file.type))
    return Response.json({ ok: false, error: "bad_type" }, { status: 415 });

  const admin = getSupabaseAdmin();
  // access_code로 본인 리드 확인 (편집 권한)
  const { data: lead } = await admin
    .from("o2o_leads")
    .select("id, site_token")
    .eq("access_code", code)
    .maybeSingle();
  if (!lead?.id) return Response.json({ ok: false }, { status: 404 });

  await ensureBucket(admin);
  const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const path = `${lead.site_token || code}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("[v/upload]", error);
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return Response.json({ ok: true, url });
}
