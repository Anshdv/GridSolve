"use client";

import { useState } from "react";
import { Field, Message, SubmitButton } from "@/components/auth/fields";
import { PRIVACY_EMAIL } from "@/lib/legal";

const TYPES = [
  { id: "access", label: "Access a copy of my information" },
  { id: "correction", label: "Correct information" },
  { id: "deletion", label: "Delete my account and information" },
] as const;

export function DataRequestForm() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("deletion");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/privacy/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          type,
          detail: detail.trim(),
        }),
      });
      if (res.status === 429) {
        setError("Too many requests from this network. Try again later, or email us.");
        return;
      }
      if (!res.ok) {
        setError(`We could not send that from the site. Email ${PRIVACY_EMAIL} with the same request.`);
        return;
      }
      setDone(true);
    } catch {
      setError(`We could not send that from the site. Email ${PRIVACY_EMAIL} with the same request.`);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Message tone="notice">
        Request received. We will reply to {email.trim()} after we verify it
        belongs to the account. You can also write {PRIVACY_EMAIL}.
      </Message>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm text-neutral-300">Request</legend>
        {TYPES.map((option) => (
          <label key={option.id} className="flex items-start gap-2 text-sm text-neutral-300">
            <input
              type="radio"
              name="request-type"
              value={option.id}
              checked={type === option.id}
              onChange={() => setType(option.id)}
              className="mt-1 accent-[var(--accent)]"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <Field
        label="Account email"
        id="privacy-email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <label className="block text-sm text-neutral-300" htmlFor="privacy-detail">
        Detail <span className="text-neutral-400">(optional)</span>
        <textarea
          id="privacy-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={2000}
          rows={4}
          disabled={loading}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-neutral-400 hover:border-white/20 focus:border-[var(--accent)]/70"
        />
      </label>
      <Message tone="error">{error}</Message>
      <SubmitButton loading={loading}>
        {loading ? "Sending…" : "Submit request"}
      </SubmitButton>
    </form>
  );
}
