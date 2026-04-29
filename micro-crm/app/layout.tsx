import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Micro CRM",
  description: "A lightweight relationship and follow-up tracker."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
