import type { Metadata } from "next";
import HomePage from "@/components/landing/HomePage";
import JsonLd from "@/components/JsonLd";
import { faqPageJsonLd, webPageJsonLd } from "@/lib/seo";
import { pageMetadata, seoKeywords, siteFaqs } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata.home,
  keywords: [...seoKeywords],
  openGraph: {
    title: pageMetadata.home.title.absolute,
    description: pageMetadata.home.description,
    url: "/",
  },
  twitter: {
    title: pageMetadata.home.title.absolute,
    description: pageMetadata.home.description,
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/",
            title: pageMetadata.home.title.absolute,
            description: pageMetadata.home.description,
          }),
          faqPageJsonLd(siteFaqs),
        ]}
      />
      <HomePage />
    </>
  );
}
