import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Accusys Desk",
  description: "Mesa de ayuda - Accusys Technology",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#1a1d27",
                border: "1px solid #2e3348",
                color: "#e8eaf6",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
