import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Memory Garden",
  description: "A personal knowledge garden for notes, topics, idea links, and resurfaced memories."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
