"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Categoria, CampoFormulario } from "@/types";
import { toast } from "sonner";
import { Loader2, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";

export function NuevoTicketForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
  const [campos, setCampos] = useState<CampoFormulario[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaSugerencia, setIaSugerencia] = useState<{ sector: string; confianza: number; razon: string } | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "media",
    categoria_id: "",
    campos_extra: {} as Record<string, any>,
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function fetchCategorias() {
    const { data } = await supabase
      .from("categorias")
      .select("*, sector:sectores(nombre)")
      .eq("activo", true)
      .order("nombre");
    if (data) setCategorias(data as any);
    setLoadingCategorias(false);
  }

  async function fetchCampos(categoriaId: string) {
    const { data } = await supabase
      .from("campos_formulario")
      .select("*")
      .eq("categoria_id", categoriaId)
      .order("orden");
    if (data) setCampos(data as CampoFormulario[]);
    else setCampos([]);
  }

  const handleCategoriaChange = async (categoriaId: string) => {
    const cat = categorias.find((c) => c.id === categoriaId) || null;
    setCategoriaSeleccionada(cat);
    setForm((prev) => ({ ...prev, categoria_id: categoriaId, campos_extra: {} }));
    if (categoriaId) fetchCampos(categoriaId);
    else setCampos([]);
  };

  const handleDescripcionBlur = async () => {
    if (!form.descripcion || form.descripcion.length < 20) return;
    setIaLoading(true);
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: form.titulo, descripcion: form.descripcion }),
      });
      const data = await res.json();
      if (data.sector) setIaSugerencia(data);
    } catch {}
    setIaLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.descripcion) {
      toast.error("Completá el título y la descripción");
      return;
    }
    setLoading(true);

    try {
      // Obtener SLA según prioridad
      const { data: sla } = await supabase
        .from("sla_politicas")
        .select("id")
        .eq("prioridad", form.prioridad)
        .single();

      // Calcular vencimiento SLA (simplificado)
      const ahora = new Date();
      const { data: slaData } = await supabase
        .from("sla_politicas")
        .select("tiempo_primera_respuesta_minutos, tiempo_resolucion_minutos")
        .eq("prioridad", form.prioridad)
        .single();

      const slaVencePrimeraRespuesta = slaData
        ? new Date(ahora.getTime() + slaData.tiempo_primera_respuesta_minutos * 60000)
        : null;
      const slaVenceResolucion = slaData
        ? new Date(ahora.getTime() + slaData.tiempo_resolucion_minutos * 60000)
        : null;

      // Crear ticket
      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          titulo: form.titulo,
          descripcion: form.descripcion,
          prioridad: form.prioridad,
          categoria_id: form.categoria_id || null,
          creado_por_id: user.id,
          sla_id: sla?.id || null,
          campos_extra: form.campos_extra,
          sla_primera_respuesta_vence: slaVencePrimeraRespuesta,
          sla_resolucion_vence: slaVenceResolucion,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar actividad de creación
      await supabase.from("ticket_actividad").insert({
        ticket_id: ticket.id,
        usuario_id: user.id,
        tipo: "creacion",
        contenido: "Ticket creado",
      });

      // Derivar con IA
      await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticket.id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          save: true,
        }),
      });

      toast.success(`Ticket #${ticket.numero} creado correctamente`);
      router.push(`/tickets/${ticket.id}`);
    } catch (error) {
      toast.error("Error al crear el ticket. Intentá de nuevo.");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Nuevo ticket</h1>
        <p className="text-text-secondary mt-1 text-sm">Describí tu problema o pedido y te asistimos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Título <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Ej: No puedo conectarme a la VPN"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Descripción <span className="text-danger">*</span>
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            onBlur={handleDescripcionBlur}
            placeholder="Describí en detalle qué pasó, desde cuándo, qué pasos intentaste..."
            rows={5}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none resize-none transition-colors"
          />
          {/* Sugerencia IA */}
          {iaLoading && (
            <div className="flex items-center gap-2 mt-2 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" /> Analizando con IA...
            </div>
          )}
          {iaSugerencia && !iaLoading && (
            <div className="mt-2 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-text-secondary">
                <span className="text-primary font-medium">IA sugiere:</span> Este ticket iría a{" "}
                <span className="font-medium text-text-primary">{iaSugerencia.sector}</span>.{" "}
                {iaSugerencia.razon}
              </div>
            </div>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Categoría</label>
          {loadingCategorias ? (
            <div className="h-11 bg-surface border border-border rounded-xl animate-pulse" />
          ) : (
            <select
              value={form.categoria_id}
              onChange={(e) => handleCategoriaChange(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">— Sin categoría —</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                  {(cat as any).sector?.nombre ? ` (${(cat as any).sector.nombre})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Campos dinámicos del formulario */}
        {campos.length > 0 && (
          <div className="bg-surface-2 border border-border rounded-2xl p-5 space-y-5">
            <p className="text-sm font-medium text-text-primary">Información adicional</p>
            {campos.map((campo) => (
              <CampoDinamico
                key={campo.id}
                campo={campo}
                value={form.campos_extra[campo.nombre] || ""}
                onChange={(val) =>
                  setForm((p) => ({
                    ...p,
                    campos_extra: { ...p.campos_extra, [campo.nombre]: val },
                  }))
                }
              />
            ))}
          </div>
        )}

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Prioridad</label>
          <div className="grid grid-cols-4 gap-2">
            {["baja", "media", "alta", "critica"].map((p) => {
              const labels: Record<string, string> = {
                baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica",
              };
              const colors: Record<string, string> = {
                baja: "border-blue-500/50 text-blue-400 bg-blue-500/10",
                media: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
                alta: "border-orange-500/50 text-orange-400 bg-orange-500/10",
                critica: "border-red-500/50 text-red-400 bg-red-500/10",
              };
              const isSelected = form.prioridad === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, prioridad: p }))}
                  className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? colors[p]
                      : "border-border text-text-muted hover:border-border-light hover:text-text-secondary bg-surface"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creando ticket..." : "Crear ticket"}
        </button>
      </form>
    </div>
  );
}

function CampoDinamico({
  campo, value, onChange,
}: {
  campo: CampoFormulario;
  value: any;
  onChange: (val: any) => void;
}) {
  const baseClass =
    "w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none transition-colors";

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {campo.etiqueta}
        {campo.requerido && <span className="text-danger ml-1">*</span>}
      </label>
      {campo.tipo === "textarea" ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} resize-none`} />
      ) : campo.tipo === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">— Seleccioná una opción —</option>
          {campo.opciones?.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      ) : campo.tipo === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded accent-primary" />
          <span className="text-sm text-text-secondary">Sí</span>
        </label>
      ) : (
        <input
          type={campo.tipo}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          required={campo.requerido}
        />
      )}
    </div>
  );
}
