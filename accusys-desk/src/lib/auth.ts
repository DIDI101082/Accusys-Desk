import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "./supabase";

const providers = [];

// Provider de Microsoft solo si están configuradas las variables
if (
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_ID !== "placeholder" &&
  process.env.AZURE_AD_CLIENT_SECRET &&
  process.env.AZURE_AD_CLIENT_SECRET !== "placeholder" &&
  process.env.AZURE_AD_TENANT_ID &&
  process.env.AZURE_AD_TENANT_ID !== "placeholder"
) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: { scope: "openid profile email User.Read" },
      },
    })
  );
}

// Provider de email/contraseña (siempre disponible)
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      try {
        const admin = supabaseAdmin();

        const { data: user } = await admin
          .from("usuarios")
          .select("*")
          .eq("email", credentials.email)
          .eq("activo", true)
          .single();

        if (!user) return null;

        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(credentials.password, user.password_hash || "");
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nombre_display || `${user.nombre} ${user.apellido}`,
          image: user.avatar_url,
        };
      } catch (error) {
        console.error("Error en authorize:", error);
        return null;
      }
    },
  })
);

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      if (account?.provider === "azure-ad") {
        try {
          const admin = supabaseAdmin();
          const { data: existingUser } = await admin
            .from("usuarios")
            .select("*")
            .eq("email", user.email)
            .single();

          if (!existingUser) {
            const nombre_completo = user.name || "";
            const partes = nombre_completo.split(" ");
            const nombre = partes[0] || "";
            const apellido = partes.slice(1).join(" ") || "";

            await admin.from("usuarios").insert({
              email: user.email,
              nombre,
              apellido,
              nombre_display: user.name,
              avatar_url: user.image,
              microsoft_id: (profile as any)?.sub || account?.providerAccountId,
              rol: "usuario",
            });
          } else {
            await admin
              .from("usuarios")
              .update({
                nombre_display: user.name,
                avatar_url: user.image,
                microsoft_id: (profile as any)?.sub || account?.providerAccountId,
              })
              .eq("email", user.email);
          }
        } catch (error) {
          console.error("Error en signIn callback:", error);
          return false;
        }
      }
      return true;
    },

    async session({ session, token }) {
      if (session.user?.email) {
        const admin = supabaseAdmin();
        const { data: dbUser } = await admin
          .from("usuarios")
          .select("id, rol, nombre, apellido, sector_id, puesto")
          .eq("email", session.user.email)
          .single();

        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).rol = dbUser.rol;
          (session.user as any).sector_id = dbUser.sector_id;
          (session.user as any).puesto = dbUser.puesto;
        }
      }
      return session;
    },

    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      if (account) token.accessToken = account.access_token;
      return token;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
