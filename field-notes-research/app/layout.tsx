import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Field Notes Research",
  description: "A local-first research notebook for observations, quotes, themes, and follow-up questions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
