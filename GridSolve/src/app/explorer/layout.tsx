import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorer",
  robots: { index: false, follow: false },
};

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
