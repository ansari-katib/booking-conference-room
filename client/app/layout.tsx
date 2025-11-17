import type { Metadata } from "next";
import { BookingsProvider } from "@/context/BookingsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Conference Room",
  description: "Book conference room",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BookingsProvider>{children}</BookingsProvider>
      </body>
    </html>
  );
}

