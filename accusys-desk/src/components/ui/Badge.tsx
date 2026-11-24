import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        className
      )}
    >
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    abierto: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    en_progreso: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pendiente_usuario: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    resuelto: "bg-green-500/20 text-green-400 border-green-500/30",
    cerrado: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labels: Record<string, string> = {
    abierto: "Abierto",
    en_progreso: "En progreso",
    pendiente_usuario: "Esperando usuario",
    resuelto: "Resuelto",
    cerrado: "Cerrado",
    cancelado: "Cancelado",
  };

  return (
    <Badge className={colors[estado] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
      {labels[estado] || estado}
    </Badge>
  );
}

export function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const colors: Record<string, string> = {
    critica: "bg-red-500/20 text-red-400 border-red-500/30",
    alta: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    media: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    baja: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const labels: Record<string, string> = {
    critica: "Crítica",
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

  return (
    <Badge className={colors[prioridad] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
      {labels[prioridad] || prioridad}
    </Badge>
  );
}
