"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Email o contraseña incorrectos");
    }
    setLoading(false);
  };

  const handleMicrosoft = () => {
    signIn("azure-ad", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Accusys Desk</h1>
          <p className="text-text-secondary text-sm mt-1">Mesa de ayuda corporativa</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">

          {/* Login con Microsoft */}
          <button
            onClick={handleMicrosoft}
            className="w-full flex items-center justify-center gap-3 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary font-medium py-3 px-4 rounded-xl transition-all duration-200 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
              <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
              <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
              <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
            </svg>
            Continuar con Microsoft
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-secondary text-xs">o ingresá con email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Formulario email/contraseña */}
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@accusys.com.ar"
                required
                className="w-full bg-surface-2 border border-border text-text-primary placeholder-text-secondary/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-2 border border-border text-text-primary placeholder-text-secondary/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-secondary/50 text-xs mt-6">
          Accusys Technology © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
