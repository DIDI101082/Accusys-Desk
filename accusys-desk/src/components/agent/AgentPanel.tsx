"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types";
import { formatDateRelative, formatDate } from "@/lib/utils";
import { EstadoBadge, PrioridadBadge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Loader2, AlertTriangle, Clock, Search, Filter,
  Ticket as TicketIcon, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const ESTADOS = ["todos", "abierto", "en_progreso", "pendiente_usuario", "resuelto"];
const PRIORIDADES = ["todas", "critica", "alta", "media", "baja"];

export function AgentPanel() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [prioridadFiltro, setPrioridadFiltro] = useState("todas");
  const [sectorFiltro, setSectorFiltro] = useState("todos");
  const [soloMios, setSoloMios] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase
        .from("tickets")
        .select(`
          *,
          categoria:categorias(nombre),
          sector_asignado:sectores(nombre),
          creado_por:usuarios!tickets_creado_por_id_fkey(nombre, apellido, email),
          asignado_a:usuarios!tickets_asignado_a_id_fkey(nombre, apellido)
        `)
        .not("estado", "in", "(cerrado,cancelado)")
        .order("created_at", { ascending: false }),
      supabase.from("sectores").select("id, nombre").eq("activo", true).order("nombre"),
    ]);
    if (t) setTickets(t as any);
    if (s) setSectores(s);
    setLoading(false);
  }

  async function tomarTicket(ticketId: string) {
    const { error } = await supabase
      .from("tickets")
      .update({ asignado_a_id: user.id, estado: "en_progreso" })
      .eq("id", ticketId);
    if (!error) {
      await supabase.from("ticket_actividad").insert({
        ticket_id: ticketId,
        usuario_id: user.id,
        tipo: "asignacion",
        contenido: `Ticket tomado por ${user.name}`,
      });
      toast.success("Ticket tomado");
      fetchData();
    }
  }

  const filtrados = tickets.filter((t) => {
    const matchSearch = !search ||
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      String(t.numero).includes(search) ||
      (t as any).creado_por?.email?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFiltro === "todos" || t.estado === estadoFiltro;
    const matchPrioridad = prioridadFiltro === "todas" || t.prioridad === prioridadFiltro;
    const matchSector = sectorFiltro === "todos" || t.sector_asignado_id === sectorFiltro;
    const matchMios = !soloMios || t.asignado_a_id === user?.id;
    return matchSearch && matchEstado && matchPrioridad && matchSector && matchMios;
  });

  const criticos = filtrados.filter((t) => t.prioridad === "critica").length;
  const sinAsignar = filtrados.filter((t) => !t.asignado_a_id).length;
  const vencidos = filtrados.filter((t) =>
    t.sla_resolucion_vence && new Date(t.sla_resolucion_vence) < new Date()
  ).length;

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Panel de agente</h1>
          <p className="text-text-secondary mt-1 text-sm">Gestión de tickets abiertos y en progreso</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl bg-surface border border-border hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <TicketIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total activos</p>
            <p className="text-2xl font-bold text-text-primary">{filtrados.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Sin asignar</p>
            <p className="text-2xl font-bold text-text-primary">{sinAsignar}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Vencidos SLA</p>
            <p className="text-2xl font-bold text-text-primary">{vencidos}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none">
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e === "todos" ? "Todos los estados" : e.replace("_", " ")}</option>
          ))}
        </select>
        <select value={prioridadFiltro} onChange={(e) => setPrioridadFiltro(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none">
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>{p === "todas" ? "Todas las prioridades" : p}</option>
          ))}
        </select>
        <select value={sectorFiltro} onChange={(e) => setSectorFiltro(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none">
          <option value="todos">Todos los sectores</option>
          {sectores.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer bg-surface border border-border rounded-xl px-3 py-2">
          <input type="checkbox" checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} className="accent-primary" />
          Solo los míos
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center">
          <TicketIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No hay tickets con esos filtros</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">#</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Ticket</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Sector</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Prioridad</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Asignado a</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">SLA</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((ticket) => {
                const t = ticket as any;
                const slaVencido = ticket.sla_resolucion_vence && new Date(ticket.sla_resolucion_vence) < new Date();
                return (
                  <tr key={ticket.id} className={`hover:bg-surface-2 transition-colors group ${slaVencido ? "border-l-2 border-l-danger" : ""}`}>
                    <td className="px-5 py-3.5 text-sm text-text-muted">#{ticket.numero}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/tickets/${ticket.id}`}
                        className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                        {ticket.titulo}
                      </Link>
                      <p className="text-xs text-text-muted mt-0.5">
                        {t.creado_por?.nombre} {t.creado_por?.apellido} · {formatDateRelative(ticket.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary hidden md:table-cell">
                      {t.sector_asignado?.nombre || "—"}
                    </td>
                    <td className="px-5 py-3.5"><EstadoBadge estado={ticket.estado} /></td>
                    <td className="px-5 py-3.5"><PrioridadBadge prioridad={ticket.prioridad} /></td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary hidden lg:table-cell">
                      {t.asignado_a ? `${t.asignado_a.nombre} ${t.asignado_a.apellido || ""}`.trim() : (
                        <span className="text-warning">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {ticket.sla_resolucion_vence ? (
                        <span className={`text-xs ${slaVencido ? "text-danger font-medium" : "text-text-muted"}`}>
                          {slaVencido ? "⚠ " : ""}{formatDate(ticket.sla_resolucion_vence)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {!ticket.asignado_a_id && (
                        <button
                          onClick={() => tomarTicket(ticket.id)}
                          className="text-xs font-medium text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                        >
                          Tomar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
