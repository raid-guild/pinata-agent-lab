import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "RaidGuild Agent App Starter",
  description: "A small Next.js and SQLite starter for Pinata agent apps."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
