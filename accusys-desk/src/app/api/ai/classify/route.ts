import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import OpenAI from "openai";

const SECTORES_DESCRIPCIONES = `
- CAU Microinformática: problemas con PC, notebook, impresoras, periféricos, instalación de software de escritorio
- CAU Servidores: servidores físicos o virtuales caídos, lentos, armado de servidores, acceso a servidores
- Ciberseguridad: incidentes de seguridad, acceso VPN, alta/baja/modificación de usuarios, cambio de permisos, contraseñas
- SRE: infraestructura cloud, AWS, Azure, DevOps, permisos en AWS o Azure DevOps, Sentry
- Plataforma Core: aplicaciones del negocio, sistemas internos, integraciones
- Infraestructura: problemas de red, conectividad, switches, firewall, FortiGate
- RRHH: altas, bajas, cambios de personal, contratos
- Administración: facturación, contratos con proveedores, compras
`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { titulo, descripcion, ticket_id, save } = body;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI no configurado" }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Sos un asistente de mesa de ayuda IT de Accusys Technology.
Tu tarea es clasificar tickets de soporte y asignarlos al sector correcto.

Sectores disponibles y sus responsabilidades:
${SECTORES_DESCRIPCIONES}

Respondé SOLO con un JSON con esta estructura:
{
  "sector": "nombre exacto del sector",
  "confianza": 0.0 a 1.0,
  "razonamiento": "explicación breve en español de por qué elegiste ese sector",
  "prioridad_sugerida": "baja|media|alta|critica"
}`,
        },
        {
          role: "user",
          content: `Ticket:
Título: ${titulo}
Descripción: ${descripcion}`,
        },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Si se pide guardar, actualizar el ticket
    if (save && ticket_id && result.sector) {
      const admin = supabaseAdmin();

      // Buscar el sector en la BD
      const { data: sector } = await admin
        .from("sectores")
        .select("id")
        .ilike("nombre", `%${result.sector}%`)
        .single();

      if (sector) {
        await admin
          .from("tickets")
          .update({
            sector_asignado_id: sector.id,
            ia_sector_sugerido: sector.id,
            ia_confianza: result.confianza,
            ia_razonamiento: result.razonamiento,
          })
          .eq("id", ticket_id);

        await admin.from("ticket_actividad").insert({
          ticket_id,
          tipo: "ia_derivacion",
          contenido: `IA derivó automáticamente a ${result.sector} (confianza: ${Math.round(result.confianza * 100)}%). ${result.razonamiento}`,
          metadata: { sector: result.sector, confianza: result.confianza },
        });
      }
    }

    return NextResponse.json({
      sector: result.sector,
      confianza: result.confianza,
      razon: result.razonamiento,
      prioridad_sugerida: result.prioridad_sugerida,
    });
  } catch (error) {
    console.error("Error en clasificación IA:", error);
    return NextResponse.json({ error: "Error al clasificar" }, { status: 500 });
  }
}
