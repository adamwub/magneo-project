import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magneo Dashboard",
  description: "Ekosistem digital sekolah — dashboard web.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
