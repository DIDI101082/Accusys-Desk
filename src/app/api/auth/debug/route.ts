import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const admin = supabaseAdmin();
  const { data: user, error } = await admin.from("usuarios").select("email, password_hash, activo, rol").eq("email", email).single();
  if (error || !user) return NextResponse.json({ step: "user_not_found", error: error?.message });
  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, user.password_hash || "");
  return NextResponse.json({ user_found: true, activo: user.activo, rol: user.rol, hash_length: user.password_hash?.length, password_valid: valid });
}
