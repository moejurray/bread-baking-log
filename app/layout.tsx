import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bread Baking Log",
  description: "A baker's experimental notebook.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
