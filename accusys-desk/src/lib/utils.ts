import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatDateRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export const estadoLabels: Record<string, string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  pendiente_usuario: "Pendiente usuario",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

export const estadoColors: Record<string, string> = {
  abierto: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  en_progreso: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pendiente_usuario: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resuelto: "bg-green-500/20 text-green-400 border-green-500/30",
  cerrado: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const prioridadLabels: Record<string, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const prioridadColors: Record<string, string> = {
  critica: "bg-red-500/20 text-red-400 border-red-500/30",
  alta: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  media: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  baja: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
