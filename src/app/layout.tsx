import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmoth — AI that writes in your voice",
  description: "Analyze your prose style, then draft chapters that sound like you — not like AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
