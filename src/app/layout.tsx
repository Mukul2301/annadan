import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Annadan - Gift of Food",
  description: "Turning India's food surplus into meals",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
