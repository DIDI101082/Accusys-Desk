"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Ticket, PlusCircle, Users, Settings,
  LogOut, Bell, ChevronDown, Headphones, BarChart3, BookOpen,
  ShieldCheck
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/tickets", label: "Mis tickets", icon: Ticket },
  { href: "/tickets/new", label: "Nuevo ticket", icon: PlusCircle },
];

const agentItems = [
  { href: "/agent", label: "Panel de agente", icon: Headphones },
  { href: "/agent/stats", label: "Estadísticas", icon: BarChart3 },
];

const adminItems = [
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/sectors", label: "Sectores", icon: ShieldCheck },
  { href: "/admin/kb", label: "Base de conocimiento", icon: BookOpen },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAgent = user?.rol && ["agente", "supervisor", "admin"].includes(user.rol);
  const isAdmin = user?.rol === "admin";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M6 8h20M6 16h14M6 24h8" stroke="#4f7cff" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="26" cy="22" r="5" fill="#4f7cff" fillOpacity="0.2" stroke="#4f7cff" strokeWidth="1.5"/>
            <path d="M24 22l1.5 1.5L28 20" stroke="#4f7cff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <span className="font-bold text-text-primary text-sm">Accusys Desk</span>
          <p className="text-xs text-text-muted">Mesa de ayuda</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {/* Usuario */}
        <NavSection label="Mi espacio">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </NavSection>

        {/* Agente */}
        {isAgent && (
          <NavSection label="Gestión">
            {agentItems.map((item) => (
              <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </NavSection>
        )}

        {/* Admin */}
        {isAdmin && (
          <NavSection label="Administración">
            {adminItems.map((item) => (
              <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </NavSection>
        )}
      </nav>

      {/* Usuario */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
            {user?.name ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || "Usuario"}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform", userMenuOpen && "rotate-180")} />
        </button>

        {userMenuOpen && (
          <div className="mt-1 rounded-xl bg-surface-2 border border-border overflow-hidden">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-3 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: any; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-primary/15 text-primary"
          : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}
