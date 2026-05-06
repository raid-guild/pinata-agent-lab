import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Agent of Moloch",
  description: "A Pinata agent template for Moloch/Baal DAO conviction, proposals, voting records, and suggested governance tasks."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
