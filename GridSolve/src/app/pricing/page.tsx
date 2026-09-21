import type { Metadata } from "next";
import PricingPage from "@/components/pricing/PricingPage";
import { pageMetadata, seoKeywords } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata.pricing,
  keywords: [...seoKeywords],
  openGraph: {
    title: `${pageMetadata.pricing.title} — GridSolve`,
    description: pageMetadata.pricing.description,
    url: "/pricing",
  },
  twitter: {
    title: `${pageMetadata.pricing.title} — GridSolve`,
    description: pageMetadata.pricing.description,
  },
};

export default function Page() {
  return <PricingPage />;
}
