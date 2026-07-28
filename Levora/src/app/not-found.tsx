import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#07080a] px-6 text-center text-neutral-200">
      <p className="font-tele text-sm text-[var(--accent-bright)]">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-white">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        This route doesn&apos;t exist. The homepage and methodology are public;
        the explorer requires sign-in.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
        >
          Home
        </Link>
        <Link
          href="/methodology"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
        >
          Methodology
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-sm text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
