import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const isAgent = ["agente", "supervisor", "admin"].includes(user.rol);

  const admin = supabaseAdmin();

  let query = admin
    .from("tickets")
    .select(`
      *,
      categoria:categorias(nombre),
      sector_asignado:sectores(nombre),
      creado_por:usuarios!tickets_creado_por_id_fkey(nombre, apellido, email)
    `)
    .order("created_at", { ascending: false });

  if (!all || !isAgent) {
    query = query.or(`creado_por_id.eq.${user.id},solicitante_id.eq.${user.id}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tickets: data });
}
