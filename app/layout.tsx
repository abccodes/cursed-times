import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "The Cursed Times",
  description: "Read today's Times, except it's 10 years old.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
