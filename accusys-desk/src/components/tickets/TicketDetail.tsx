"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Ticket, TicketActividad } from "@/types";
import { formatDate, formatDateRelative } from "@/lib/utils";
import { EstadoBadge, PrioridadBadge } from "@/components/ui/Badge";
import { toast } from "sonner";
import {
  ChevronLeft, Loader2, Send, Clock, User, Tag, Building,
  Sparkles, MessageSquare, Lock
} from "lucide-react";
import Link from "next/link";

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [actividad, setActividad] = useState<TicketActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");
  const [esNotaInterna, setEsNotaInterna] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const isAgent = user?.rol && ["agente", "supervisor", "admin"].includes(user.rol);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  async function fetchTicket() {
    setLoading(true);
    const [{ data: t }, { data: act }] = await Promise.all([
      supabase
        .from("tickets")
        .select(`
          *,
          categoria:categorias(nombre),
          sector_asignado:sectores(nombre),
          creado_por:usuarios!tickets_creado_por_id_fkey(nombre, apellido, email, avatar_url),
          asignado_a:usuarios!tickets_asignado_a_id_fkey(nombre, apellido, email)
        `)
        .eq("id", ticketId)
        .single(),
      supabase
        .from("ticket_actividad")
        .select(`*, usuario:usuarios(nombre, apellido, avatar_url, rol)`)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
    ]);

    if (t) setTicket(t as any);
    if (act) setActividad(act as any);
    setLoading(false);
  }

  async function enviarComentario() {
    if (!comentario.trim()) return;
    setEnviando(true);
    const { error } = await supabase.from("ticket_actividad").insert({
      ticket_id: ticketId,
      usuario_id: user.id,
      tipo: esNotaInterna ? "nota_interna" : "comentario",
      contenido: comentario,
      es_nota_interna: esNotaInterna,
    });
    if (!error) {
      setComentario("");
      fetchTicket();
      toast.success("Comentario agregado");
    }
    setEnviando(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Ticket no encontrado.</p>
        <Link href="/dashboard" className="text-primary hover:underline text-sm mt-2 inline-block">Volver al inicio</Link>
      </div>
    );
  }

  const t = ticket as any;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/tickets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Mis tickets
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary leading-tight">{ticket.titulo}</h1>
            <p className="text-text-muted text-sm mt-1">Ticket #{ticket.numero} · creado {formatDateRelative(ticket.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PrioridadBadge prioridad={ticket.prioridad} />
            <EstadoBadge estado={ticket.estado} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Descripción</h2>
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>

            {/* Campos extra */}
            {Object.keys(ticket.campos_extra || {}).length > 0 && (
              <div className="mt-5 pt-5 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Información adicional</p>
                {Object.entries(ticket.campos_extra).map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="text-text-muted capitalize w-40 flex-shrink-0">{k.replace(/_/g, " ")}:</span>
                    <span className="text-text-primary">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IA */}
          {ticket.ia_sector_sugerido && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Derivación automática con IA</span>
                {ticket.ia_confianza && (
                  <span className="text-xs text-text-muted ml-auto">Confianza: {Math.round(ticket.ia_confianza * 100)}%</span>
                )}
              </div>
              {ticket.ia_razonamiento && (
                <p className="text-xs text-text-secondary">{ticket.ia_razonamiento}</p>
              )}
            </div>
          )}

          {/* Actividad */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-5">Actividad</h2>
            <div className="space-y-5">
              {actividad.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Sin actividad aún.</p>
              ) : (
                actividad.map((act) => <ActividadItem key={act.id} actividad={act} />)
              )}
            </div>

            {/* Nuevo comentario */}
            <div className="mt-6 pt-5 border-t border-border">
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={esNotaInterna ? "Nota interna (solo visible para agentes)..." : "Escribí un comentario..."}
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none resize-none transition-colors"
              />
              <div className="flex items-center justify-between mt-3">
                {isAgent && (
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esNotaInterna}
                      onChange={(e) => setEsNotaInterna(e.target.checked)}
                      className="accent-primary"
                    />
                    <Lock className="h-3.5 w-3.5" /> Nota interna
                  </label>
                )}
                <div className={!isAgent ? "ml-auto" : ""}>
                  <button
                    onClick={enviarComentario}
                    disabled={!comentario.trim() || enviando}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-5">
          <InfoCard>
            <InfoRow icon={Tag} label="Categoría" value={t.categoria?.nombre || "—"} />
            <InfoRow icon={Building} label="Sector" value={t.sector_asignado?.nombre || "Sin asignar"} />
            <InfoRow icon={User} label="Asignado a" value={t.asignado_a ? `${t.asignado_a.nombre} ${t.asignado_a.apellido || ""}`.trim() : "Sin asignar"} />
          </InfoCard>

          <InfoCard title="SLA">
            <InfoRow icon={Clock} label="1ra respuesta" value={ticket.sla_primera_respuesta_vence ? formatDate(ticket.sla_primera_respuesta_vence) : "—"} />
            <InfoRow icon={Clock} label="Resolución" value={ticket.sla_resolucion_vence ? formatDate(ticket.sla_resolucion_vence) : "—"} />
          </InfoCard>

          <InfoCard title="Creado por">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {t.creado_por?.nombre?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {t.creado_por ? `${t.creado_por.nombre} ${t.creado_por.apellido || ""}`.trim() : "—"}
                </p>
                <p className="text-xs text-text-muted">{t.creado_por?.email}</p>
              </div>
            </div>
          </InfoCard>

          {/* Acciones agente */}
          {isAgent && (
            <AgentActions ticket={ticket} onRefresh={fetchTicket} userId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function ActividadItem({ actividad }: { actividad: TicketActividad }) {
  const act = actividad as any;
  const nombres: Record<string, string> = {
    creacion: "creó el ticket",
    comentario: "comentó",
    nota_interna: "dejó una nota interna",
    cambio_estado: "cambió el estado",
    asignacion: "asignó el ticket",
    resolucion: "marcó como resuelto",
    ia_derivacion: "derivó automáticamente",
  };

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0 mt-0.5">
        {act.usuario?.nombre?.[0]?.toUpperCase() || "S"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary">
            {act.usuario ? `${act.usuario.nombre} ${act.usuario.apellido || ""}`.trim() : "Sistema"}
          </span>
          <span className="text-xs text-text-muted">{nombres[actividad.tipo] || actividad.tipo}</span>
          <span className="text-xs text-text-muted ml-auto">{formatDateRelative(actividad.created_at)}</span>
        </div>
        {actividad.contenido && (
          <p className={`text-sm mt-1 p-3 rounded-xl ${actividad.es_nota_interna ? "bg-yellow-500/5 border border-yellow-500/20 text-yellow-300/80" : "bg-surface-2 text-text-secondary"}`}>
            {actividad.contenido}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      {title && <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">{title}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm text-text-primary font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function AgentActions({ ticket, onRefresh, userId }: { ticket: Ticket; onRefresh: () => void; userId: string }) {
  const [loading, setLoading] = useState(false);

  async function cambiarEstado(nuevoEstado: string) {
    setLoading(true);
    const updates: any = { estado: nuevoEstado };
    if (nuevoEstado === "resuelto") updates.resuelto_at = new Date().toISOString();
    if (nuevoEstado === "cerrado") updates.cerrado_at = new Date().toISOString();

    const { error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", ticket.id);

    if (!error) {
      await supabase.from("ticket_actividad").insert({
        ticket_id: ticket.id,
        usuario_id: userId,
        tipo: "cambio_estado",
        contenido: `Estado cambiado a: ${nuevoEstado.replace("_", " ")}`,
        metadata: { estado_anterior: ticket.estado, estado_nuevo: nuevoEstado },
      });
      onRefresh();
      toast.success("Estado actualizado");
    }
    setLoading(false);
  }

  const estadosSiguientes: Record<string, string[]> = {
    abierto: ["en_progreso", "cancelado"],
    en_progreso: ["pendiente_usuario", "resuelto"],
    pendiente_usuario: ["en_progreso", "resuelto"],
    resuelto: ["cerrado", "en_progreso"],
    cerrado: [],
    cancelado: [],
  };

  const labels: Record<string, string> = {
    en_progreso: "Tomar / En progreso",
    pendiente_usuario: "Esperando usuario",
    resuelto: "Marcar resuelto",
    cerrado: "Cerrar",
    cancelado: "Cancelar",
    abierto: "Reabrir",
  };

  const siguientes = estadosSiguientes[ticket.estado] || [];

  if (siguientes.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Acciones</p>
      <div className="space-y-2">
        {siguientes.map((estado) => (
          <button
            key={estado}
            onClick={() => cambiarEstado(estado)}
            disabled={loading}
            className="w-full text-left text-sm font-medium px-3 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary border border-border transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            {labels[estado] || estado}
          </button>
        ))}
      </div>
    </div>
  );
}
