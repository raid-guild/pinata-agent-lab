import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Quest Board",
  description: "Coordinate community quests, claims, updates, outcomes, and weekly recaps."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
