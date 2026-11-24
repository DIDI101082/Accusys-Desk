export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  nombre_display?: string;
  avatar_url?: string;
  microsoft_id?: string;
  sector_id?: string;
  puesto?: string;
  jefe_id?: string;
  rol: "usuario" | "agente" | "supervisor" | "admin";
  activo: boolean;
  created_at: string;
  updated_at: string;
  sector?: Sector;
}

export interface Sector {
  id: string;
  nombre: string;
  descripcion?: string;
  email_notificacion?: string;
  activo: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  sector_id?: string;
  icono?: string;
  activo: boolean;
  sector?: Sector;
  campos_formulario?: CampoFormulario[];
}

export interface CampoFormulario {
  id: string;
  categoria_id: string;
  nombre: string;
  etiqueta: string;
  tipo: "text" | "textarea" | "select" | "checkbox" | "date" | "email";
  opciones?: string[];
  requerido: boolean;
  orden: number;
}

export interface SlaPolitica {
  id: string;
  nombre: string;
  prioridad: "critica" | "alta" | "media" | "baja";
  tiempo_primera_respuesta_minutos: number;
  tiempo_resolucion_minutos: number;
  solo_horario_habil: boolean;
}

export interface Ticket {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  estado: "abierto" | "en_progreso" | "pendiente_usuario" | "resuelto" | "cerrado" | "cancelado";
  prioridad: "critica" | "alta" | "media" | "baja";
  categoria_id?: string;
  sector_asignado_id?: string;
  creado_por_id: string;
  asignado_a_id?: string;
  sla_id?: string;
  campos_extra: Record<string, any>;
  ia_sector_sugerido?: string;
  ia_confianza?: number;
  ia_razonamiento?: string;
  primera_respuesta_at?: string;
  resuelto_at?: string;
  cerrado_at?: string;
  sla_primera_respuesta_vence?: string;
  sla_resolucion_vence?: string;
  sla_primera_respuesta_cumplido?: boolean;
  sla_resolucion_cumplido?: boolean;
  solicitante_id?: string;
  requiere_aprobacion: boolean;
  aprobador_id?: string;
  aprobado_at?: string;
  aprobado_por_id?: string;
  created_at: string;
  updated_at: string;
  // Joins
  categoria?: Categoria;
  sector_asignado?: Sector;
  creado_por?: Usuario;
  asignado_a?: Usuario;
  solicitante?: Usuario;
}

export interface TicketActividad {
  id: string;
  ticket_id: string;
  usuario_id?: string;
  tipo: string;
  contenido?: string;
  metadata: Record<string, any>;
  es_nota_interna: boolean;
  created_at: string;
  usuario?: Usuario;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  ticket_id?: string;
  titulo: string;
  mensaje?: string;
  leida: boolean;
  tipo: "info" | "warning" | "success" | "error";
  created_at: string;
  ticket?: Ticket;
}

export interface DashboardStats {
  total: number;
  abiertos: number;
  en_progreso: number;
  resueltos: number;
  vencidos_sla: number;
}
