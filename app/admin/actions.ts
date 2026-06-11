"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "./auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret || password !== expected) {
    redirect("/admin?e=1");
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14일
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}

const ALLOWED_STATUSES = [
  "new",
  "contacted",
  "consulted",
  "paid",
  "build",
  "live",
  "verdict",
  "won",
  "lost",
] as const;

export async function updateLead(formData: FormData) {
  const { isAdmin } = await import("./auth");
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const memo = String(formData.get("memo") ?? "").slice(0, 2000);
  if (!id || !ALLOWED_STATUSES.includes(status as never)) redirect("/admin");

  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  await getSupabaseAdmin()
    .from("o2o_leads")
    .update({ status, memo: memo || null })
    .eq("id", id);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
}
