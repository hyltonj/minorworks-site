import type { Metadata } from "next";
import Script from "next/script";
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XL5RG8VX86"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XL5RG8VX86');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
