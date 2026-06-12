import { clearAccountSession } from "@/lib/accountSession";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await clearAccountSession();
  return Response.redirect(new URL("/", request.url), 302);
}
