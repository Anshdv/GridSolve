import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";

export const metadata = {
  title: "Cookie Policy",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPageShell title="Cookie Policy" lastUpdated="October 27, 2026">
      <LegalSection title="What we set">
        <p>
          GridSolve sets essential cookies only, so a signed-in session stays
          authenticated. Those cookies are provided by our authentication
          host (Supabase) and are required for the logged-in product. They
          are not used for advertising.
        </p>
        <p>
          We do not set analytics cookies, advertising cookies, or
          third-party tracking cookies. We do not use session replay.
        </p>
      </LegalSection>

      <LegalSection title="Notice, not a consent wall">
        <p>
          A short notice on the site states this and links here. Dismissing
          it stores a flag in your browser&apos;s local storage. That flag is
          not a cookie and is not sent to us. Because the cookies we set are
          strictly necessary to run the account, the notice does not block
          the site or ask you to opt into tracking we do not do.
        </p>
      </LegalSection>

      <LegalSection title="Map tiles">
        <p>
          Opening the explorer loads map tiles from OpenFreeMap
          (tiles.openfreemap.org). That request includes your IP address so
          the tile server can respond. We do not add an analytics SDK to that
          request. The map is part of the tool you opened, not an ad pixel.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can clear cookies in your browser. Clearing the session cookie
          signs you out. Blocking all cookies will prevent sign-in.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
