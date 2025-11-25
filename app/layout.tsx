import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Controle de Gastos",
  description: "Veja para onde seu dinheiro vai e planeje o mês sem sustos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
