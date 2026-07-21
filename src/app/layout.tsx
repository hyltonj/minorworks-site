import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minor Works",
  description: "clarity over noise, craft over scale, curiosity over compulsion",
  metadataBase: new URL("https://minorworks.co"),
  openGraph: {
    title: "Minor Works",
    description:
      "clarity over noise, craft over scale, curiosity over compulsion",
    url: "https://minorworks.co",
    siteName: "Minor Works",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Minor Works",
    description:
      "clarity over noise, craft over scale, curiosity over compulsion",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-mw-background text-mw-text-dark antialiased">
        {children}
      </body>
    </html>
  );
}
