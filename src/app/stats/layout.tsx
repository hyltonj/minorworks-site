import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio stats · Minor Works",
  description: "Private studio numbers.",
  robots: { index: false, follow: false, nocache: true },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
