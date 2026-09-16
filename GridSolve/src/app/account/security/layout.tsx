import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
