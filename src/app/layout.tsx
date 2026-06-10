import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rwenzori Process Issue Tracker",
  description:
    "Report, track, and resolve workplace issues for the Rwenzori Process team.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
