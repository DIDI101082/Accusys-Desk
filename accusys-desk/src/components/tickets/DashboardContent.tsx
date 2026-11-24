"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types";
import { formatDateRelative } from "@/lib/utils";
import { EstadoBadge, PrioridadBadge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Ticket as TicketIcon, Clock, CheckCircle, AlertTriangle,
  PlusCircle, ArrowRight, Loader2
} from "lucide-react";

export function DashboardContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, abiertos: 0, en_progreso: 0, resueltos: 0 });

  useEffect(() => {
    if (!user?.id) return;
    fetchData();
  }, [user?.id]);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(`
        *,
        categoria:categorias(nombre),
        sector_asignado:sectores(nombre)
      `)
      .or(`creado_por_id.eq.${user.id},solicitante_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setTickets(data as any);
      setStats({
        total: data.length,
        abiertos: data.filter((t) => t.estado === "abierto").length,
        en_progreso: data.filter((t) => t.estado === "en_progreso").length,
        resueltos: data.filter((t) => t.estado === "resuelto").length,
      });
    }
    setLoading(false);
  }

  const nombre = user?.name?.split(" ")[0] || "usuario";

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Bienvenido, {nombre} 👋
        </h1>
        <p className="text-text-secondary mt-1">
          Acá podés ver y gestionar tus pedidos de soporte.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} icon={TicketIcon} color="text-text-secondary" />
        <StatCard label="Abiertos" value={stats.abiertos} icon={AlertTriangle} color="text-blue-400" />
        <StatCard label="En progreso" value={stats.en_progreso} icon={Clock} color="text-yellow-400" />
        <StatCard label="Resueltos" value={stats.resueltos} icon={CheckCircle} color="text-green-400" />
      </div>

      {/* Acciones rápidas */}
      <div className="mb-8">
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo ticket
        </Link>
      </div>

      {/* Tickets recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Mis tickets recientes</h2>
          <Link href="/tickets" className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <TicketIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">No tenés tickets aún</p>
            <p className="text-text-muted text-sm mt-1">
              Cuando necesites ayuda, creá un ticket y te asistimos.
            </p>
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-2 mt-4 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Crear primer ticket
            </Link>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Título</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Sector</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Prioridad</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-surface-2 transition-colors group">
                    <td className="px-5 py-3.5 text-sm text-text-muted">#{ticket.numero}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/tickets/${ticket.id}`} className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                        {ticket.titulo}
                      </Link>
                      {(ticket as any).categoria?.nombre && (
                        <p className="text-xs text-text-muted mt-0.5">{(ticket as any).categoria.nombre}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary hidden md:table-cell">
                      {(ticket as any).sector_asignado?.nombre || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <EstadoBadge estado={ticket.estado} />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <PrioridadBadge prioridad={ticket.prioridad} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted hidden lg:table-cell whitespace-nowrap">
                      {formatDateRelative(ticket.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <span className="text-3xl font-bold text-text-primary">{value}</span>
    </div>
  );
}
