"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types";
import { formatDateRelative } from "@/lib/utils";
import { EstadoBadge, PrioridadBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { PlusCircle, Search, Loader2, Ticket as TicketIcon } from "lucide-react";

export function TicketsList() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  useEffect(() => {
    if (!user?.id) return;
    fetchTickets();
  }, [user?.id]);

  async function fetchTickets() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(`*, categoria:categorias(nombre), sector_asignado:sectores(nombre)`)
      .or(`creado_por_id.eq.${user.id},solicitante_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (data) setTickets(data as any);
    setLoading(false);
  }

  const filtrados = tickets.filter((t) => {
    const matchSearch =
      !search ||
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      String(t.numero).includes(search);
    const matchEstado = estadoFiltro === "todos" || t.estado === estadoFiltro;
    return matchSearch && matchEstado;
  });

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mis tickets</h1>
          <p className="text-text-secondary mt-1 text-sm">Todos tus pedidos de soporte</p>
        </div>
        <Link href="/tickets/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm">
          <PlusCircle className="h-4 w-4" /> Nuevo ticket
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por título o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          <option value="abierto">Abiertos</option>
          <option value="en_progreso">En progreso</option>
          <option value="pendiente_usuario">Esperando mí</option>
          <option value="resuelto">Resueltos</option>
          <option value="cerrado">Cerrados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center">
          <TicketIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No hay tickets</p>
          <p className="text-text-muted text-sm mt-1">
            {search || estadoFiltro !== "todos" ? "Probá cambiando los filtros" : "Creá tu primer ticket cuando necesites soporte"}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Título</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Sector</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Prioridad</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-surface-2 transition-colors group">
                    <td className="px-5 py-3.5 text-sm text-text-muted">#{ticket.numero}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/tickets/${ticket.id}`}
                        className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                        {ticket.titulo}
                      </Link>
                      {(ticket as any).categoria?.nombre && (
                        <p className="text-xs text-text-muted mt-0.5">{(ticket as any).categoria.nombre}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary hidden md:table-cell">
                      {(ticket as any).sector_asignado?.nombre || "—"}
                    </td>
                    <td className="px-5 py-3.5"><EstadoBadge estado={ticket.estado} /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><PrioridadBadge prioridad={ticket.prioridad} /></td>
                    <td className="px-5 py-3.5 text-sm text-text-muted hidden lg:table-cell whitespace-nowrap">
                      {formatDateRelative(ticket.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
