import type { Metadata, Viewport } from "next";
import { BookingsProvider } from "@/context/BookingsContext";
import "./globals.css";
import RegisterSW from "./register-sw";

export const metadata: Metadata = {
  title: "Book Conference Room",
  description: "Book conference room",
  generator: "Next.js",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RegisterSW />
        <BookingsProvider>{children}</BookingsProvider>
      </body>
    </html>
  );
}
