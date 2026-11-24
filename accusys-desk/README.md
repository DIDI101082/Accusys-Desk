# Accusys Desk

Mesa de ayuda corporativa de Accusys Technology.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS (dark theme)
- **Auth**: NextAuth.js + Microsoft Entra ID
- **DB**: Supabase (PostgreSQL)
- **IA**: OpenAI GPT-4o-mini para derivación automática

## Setup

### 1. Clonar y configurar
```bash
npm install
cp .env.example .env.local
# Completar variables en .env.local
```

### 2. Variables de entorno
Completar en `.env.local`:
- `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` → app registrada en Azure AD
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → proyecto Supabase
- `OPENAI_API_KEY` → para derivación con IA
- `NEXTAUTH_SECRET` → `openssl rand -base64 32`

### 3. Base de datos
En Supabase SQL Editor, ejecutar `sql/01_schema.sql`

### 4. Configurar Azure AD
En el portal de Azure:
1. Registrar nueva aplicación
2. Redirect URI: `https://accusys-desk.accusystechnology.com/api/auth/callback/azure-ad` (y `http://localhost:3000/api/auth/callback/azure-ad` para dev)
3. Permisos: `openid`, `profile`, `email`, `User.Read`
4. Crear client secret

### 5. Correr en desarrollo
```bash
npm run dev
```

## Estructura
```
src/
  app/
    api/
      auth/     → NextAuth
      tickets/  → API de tickets
      ai/       → Derivación con IA
    dashboard/  → Home del usuario
    tickets/    → Lista y detalle de tickets
    agent/      → Panel del agente
    login/      → Login Microsoft
  components/
    layout/     → Sidebar, AppShell, Providers
    tickets/    → Dashboard, lista, detalle, formulario
    agent/      → Panel del agente
    ui/         → Badges y componentes reutilizables
  lib/          → supabase, auth, utils
  types/        → Tipos TypeScript
sql/            → Schema de Supabase
```

## Roles
- **usuario**: puede crear y ver sus propios tickets
- **agente**: ve todos los tickets, puede tomarlos y cambiar estado
- **supervisor**: igual que agente + puede reasignar
- **admin**: acceso completo + configuración

El rol se asigna desde la tabla `usuarios` en Supabase (por defecto todos entran como `usuario`).
