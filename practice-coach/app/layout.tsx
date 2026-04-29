import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Practice Coach",
  description: "A habit and skill-building companion for focused practice."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
