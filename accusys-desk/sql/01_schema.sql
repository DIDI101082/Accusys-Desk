-- ============================================================
-- ACCUSYS DESK - Schema de base de datos
-- Ejecutar en Supabase SQL Editor en orden
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- SECTORES
-- ============================================================
CREATE TABLE sectores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  email_notificacion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sectores (nombre, descripcion) VALUES
  ('CAU Microinformática', 'Soporte de equipos de escritorio, notebooks y periféricos'),
  ('CAU Servidores', 'Soporte de servidores y virtualización'),
  ('Ciberseguridad', 'Incidentes de seguridad, accesos y políticas'),
  ('SRE', 'Infraestructura cloud, AWS, Azure'),
  ('Plataforma Core', 'Aplicaciones core del negocio'),
  ('Infraestructura', 'Red, switches, firewall, conectividad'),
  ('RRHH', 'Altas, bajas, modificaciones de personal'),
  ('Administración', 'Facturación, contratos, proveedores');

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  nombre_display TEXT,
  avatar_url TEXT,
  microsoft_id TEXT UNIQUE,
  password_hash TEXT,
  sector_id UUID REFERENCES sectores(id),
  puesto TEXT,
  jefe_id UUID REFERENCES usuarios(id),
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'agente', 'supervisor', 'admin')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORÍAS Y PLANTILLAS
-- ============================================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sector_id UUID REFERENCES sectores(id),
  icono TEXT,
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categorias (nombre, descripcion, sector_id) VALUES
  ('Problema con PC / notebook', 'Mi equipo no funciona correctamente', (SELECT id FROM sectores WHERE nombre = 'CAU Microinformática')),
  ('Instalación de software', 'Necesito instalar una aplicación', (SELECT id FROM sectores WHERE nombre = 'CAU Microinformática')),
  ('Impresora / periférico', 'Problema con impresora u otro periférico', (SELECT id FROM sectores WHERE nombre = 'CAU Microinformática')),
  ('Servidor caído o lento', 'Un servidor no responde o está degradado', (SELECT id FROM sectores WHERE nombre = 'CAU Servidores')),
  ('Acceso a servidor', 'Necesito acceso a un servidor', (SELECT id FROM sectores WHERE nombre = 'CAU Servidores')),
  ('Incidente de seguridad', 'Detecté algo sospechoso o fui afectado', (SELECT id FROM sectores WHERE nombre = 'Ciberseguridad')),
  ('Acceso a VPN fuera de horario', 'Necesito acceso VPN en horario no habitual', (SELECT id FROM sectores WHERE nombre = 'Ciberseguridad')),
  ('Alta de usuario en sistemas', 'Crear cuenta para nuevo empleado', (SELECT id FROM sectores WHERE nombre = 'Ciberseguridad')),
  ('Baja de usuario', 'Desactivar cuenta de un empleado', (SELECT id FROM sectores WHERE nombre = 'Ciberseguridad')),
  ('Cambio de área / permisos', 'Modificar permisos o área de un usuario', (SELECT id FROM sectores WHERE nombre = 'Ciberseguridad')),
  ('Permisos en AWS', 'Solicitud de permisos en cuentas de AWS', (SELECT id FROM sectores WHERE nombre = 'SRE')),
  ('Permisos en Azure DevOps', 'Acceso o cambios en Azure DevOps', (SELECT id FROM sectores WHERE nombre = 'SRE')),
  ('Armado de servidor', 'Solicitud de nuevo servidor o VM', (SELECT id FROM sectores WHERE nombre = 'CAU Servidores')),
  ('Problema de conectividad', 'Sin internet o sin acceso a red', (SELECT id FROM sectores WHERE nombre = 'Infraestructura')),
  ('Otro', 'Consulta o pedido que no encaja en otra categoría', NULL);

-- Campos personalizados por categoría (plantillas de formulario)
CREATE TABLE campos_formulario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  etiqueta TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('text', 'textarea', 'select', 'checkbox', 'date', 'email')),
  opciones JSONB, -- para tipo select
  requerido BOOLEAN DEFAULT false,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campos para "Acceso a VPN fuera de horario"
INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'fecha_inicio', 'Fecha de inicio del acceso', 'date', true, 1
FROM categorias WHERE nombre = 'Acceso a VPN fuera de horario';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'fecha_fin', 'Fecha de fin del acceso', 'date', true, 2
FROM categorias WHERE nombre = 'Acceso a VPN fuera de horario';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'motivo', 'Motivo del acceso fuera de horario', 'textarea', true, 3
FROM categorias WHERE nombre = 'Acceso a VPN fuera de horario';

-- Campos para "Alta de usuario en sistemas"
INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'nombre_empleado', 'Nombre y apellido del nuevo empleado', 'text', true, 1
FROM categorias WHERE nombre = 'Alta de usuario en sistemas';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'area_empleado', 'Área donde ingresa', 'text', true, 2
FROM categorias WHERE nombre = 'Alta de usuario en sistemas';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'fecha_ingreso', 'Fecha de ingreso', 'date', true, 3
FROM categorias WHERE nombre = 'Alta de usuario en sistemas';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, opciones, requerido, orden)
SELECT id, 'sistemas', 'Sistemas a habilitar', 'select',
  '["Office 365", "VPN", "Accusys Cyber", "Azure DevOps", "Sentry", "AWS", "Todos los anteriores"]'::jsonb,
  true, 4
FROM categorias WHERE nombre = 'Alta de usuario en sistemas';

-- Campos para "Permisos en AWS"
INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'cuenta_aws', 'Nombre o ID de la cuenta AWS', 'text', true, 1
FROM categorias WHERE nombre = 'Permisos en AWS';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, opciones, requerido, orden)
SELECT id, 'tipo_permiso', 'Tipo de permiso solicitado', 'select',
  '["Solo lectura (ReadOnly)", "Acceso por servicio específico", "Acceso administrador", "Otro"]'::jsonb,
  true, 2
FROM categorias WHERE nombre = 'Permisos en AWS';

INSERT INTO campos_formulario (categoria_id, nombre, etiqueta, tipo, requerido, orden)
SELECT id, 'justificacion', 'Justificación del pedido', 'textarea', true, 3
FROM categorias WHERE nombre = 'Permisos en AWS';

-- ============================================================
-- SLA
-- ============================================================
CREATE TABLE sla_politicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('critica', 'alta', 'media', 'baja')),
  tiempo_primera_respuesta_minutos INT NOT NULL,
  tiempo_resolucion_minutos INT NOT NULL,
  solo_horario_habil BOOLEAN DEFAULT true,
  horario_inicio TIME DEFAULT '08:00',
  horario_fin TIME DEFAULT '18:00',
  dias_habiles INT[] DEFAULT ARRAY[1,2,3,4,5], -- lunes a viernes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sla_politicas (nombre, prioridad, tiempo_primera_respuesta_minutos, tiempo_resolucion_minutos) VALUES
  ('Crítica', 'critica', 15, 240),
  ('Alta', 'alta', 60, 480),
  ('Media', 'media', 240, 1440),
  ('Baja', 'baja', 480, 2880);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto'
    CHECK (estado IN ('abierto', 'en_progreso', 'pendiente_usuario', 'resuelto', 'cerrado', 'cancelado')),
  prioridad TEXT NOT NULL DEFAULT 'media'
    CHECK (prioridad IN ('critica', 'alta', 'media', 'baja')),
  categoria_id UUID REFERENCES categorias(id),
  sector_asignado_id UUID REFERENCES sectores(id),
  creado_por_id UUID NOT NULL REFERENCES usuarios(id),
  asignado_a_id UUID REFERENCES usuarios(id),
  sla_id UUID REFERENCES sla_politicas(id),

  -- Campos personalizados del formulario
  campos_extra JSONB DEFAULT '{}',

  -- Derivación IA
  ia_sector_sugerido UUID REFERENCES sectores(id),
  ia_confianza FLOAT,
  ia_razonamiento TEXT,

  -- Tiempos
  primera_respuesta_at TIMESTAMPTZ,
  resuelto_at TIMESTAMPTZ,
  cerrado_at TIMESTAMPTZ,
  sla_primera_respuesta_vence TIMESTAMPTZ,
  sla_resolucion_vence TIMESTAMPTZ,
  sla_primera_respuesta_cumplido BOOLEAN,
  sla_resolucion_cumplido BOOLEAN,

  -- Pedido para otro
  solicitante_id UUID REFERENCES usuarios(id),

  -- Aprobación
  requiere_aprobacion BOOLEAN DEFAULT false,
  aprobador_id UUID REFERENCES usuarios(id),
  aprobado_at TIMESTAMPTZ,
  aprobado_por_id UUID REFERENCES usuarios(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HISTORIAL / ACTIVIDAD
-- ============================================================
CREATE TABLE ticket_actividad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'creacion', 'comentario', 'cambio_estado', 'cambio_prioridad',
    'asignacion', 'reasignacion', 'resolucion', 'cierre',
    'aprobacion', 'rechazo', 'nota_interna', 'ia_derivacion'
  )),
  contenido TEXT,
  metadata JSONB DEFAULT '{}',
  es_nota_interna BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADJUNTOS
-- ============================================================
CREATE TABLE ticket_adjuntos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_mime TEXT,
  tamaño_bytes INT,
  subido_por_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'warning', 'success', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_creado_por ON tickets(creado_por_id);
CREATE INDEX idx_tickets_asignado_a ON tickets(asignado_a_id);
CREATE INDEX idx_tickets_sector ON tickets(sector_asignado_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_ticket_actividad_ticket ON ticket_actividad(ticket_id);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_microsoft ON usuarios(microsoft_id);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Los usuarios ven sus propios tickets
CREATE POLICY "usuarios_ven_sus_tickets"
  ON tickets FOR SELECT
  USING (
    creado_por_id = auth.uid()::uuid
    OR asignado_a_id = auth.uid()::uuid
    OR solicitante_id = auth.uid()::uuid
    OR EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.rol IN ('agente', 'supervisor', 'admin')
    )
  );

-- Los usuarios pueden crear tickets
CREATE POLICY "usuarios_pueden_crear_tickets"
  ON tickets FOR INSERT
  WITH CHECK (creado_por_id = auth.uid()::uuid);

-- Los agentes/admin pueden actualizar tickets
CREATE POLICY "agentes_pueden_actualizar_tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.rol IN ('agente', 'supervisor', 'admin')
    )
    OR creado_por_id = auth.uid()::uuid
  );

-- Actividad: ver actividad de tickets que podés ver
CREATE POLICY "ver_actividad_propia"
  ON ticket_actividad FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.creado_por_id = auth.uid()::uuid
        OR t.asignado_a_id = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM usuarios u
          WHERE u.id = auth.uid()::uuid
          AND u.rol IN ('agente', 'supervisor', 'admin')
        )
      )
    )
    AND (es_nota_interna = false
      OR EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid()::uuid
        AND u.rol IN ('agente', 'supervisor', 'admin')
      )
    )
  );

CREATE POLICY "insertar_actividad"
  ON ticket_actividad FOR INSERT
  WITH CHECK (usuario_id = auth.uid()::uuid);

-- Notificaciones: solo las propias
CREATE POLICY "ver_mis_notificaciones"
  ON notificaciones FOR ALL
  USING (usuario_id = auth.uid()::uuid);

-- Usuarios: todos pueden verse entre sí (para asignaciones)
CREATE POLICY "usuarios_son_visibles"
  ON usuarios FOR SELECT
  USING (true);

CREATE POLICY "usuario_actualiza_su_perfil"
  ON usuarios FOR UPDATE
  USING (id = auth.uid()::uuid);
