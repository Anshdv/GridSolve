// Shared header/footer for printable reports (single-substation detail and
// multi-substation compare). Rendered only inside a .print-report container
// (see globals.css), so it's always light-on-white regardless of the app's
// dark theme.
export function PrintHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="flex items-baseline justify-between border-b border-black/20 pb-3">
      <div className="text-lg font-bold">GridSolve</div>
      <div className="text-xs text-black/60">{today}</div>
    </div>
  );
}

export function PrintFooter() {
  return (
    <p className="mt-8 border-t border-black/20 pt-3 text-[10px] leading-relaxed text-black/50">
      Source: ISO/RTO interconnection queues (LBNL Queued Up) and LBNL
      interconnection cost studies. For internal screening and IC memos — not
      a utility interconnection study, engineering stamp, or investment
      advice. Withdrawal rates are empirical, per region; survival-model
      validation varies — see each substation&apos;s model reliability note.
    </p>
  );
}
