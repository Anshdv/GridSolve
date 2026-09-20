"use client";

import { useState } from "react";
import { Field, Message, SubmitButton } from "@/components/auth/fields";
import { PRIVACY_EMAIL } from "@/lib/legal";

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Message tone="notice">
        If we add optional product emails, this address will be excluded. For
        other privacy requests, write {PRIVACY_EMAIL}.
      </Message>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 max-w-sm space-y-4">
      <Field
        label="Email"
        id="unsub-email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <SubmitButton loading={loading}>
        {loading ? "Saving…" : "Opt out of optional emails"}
      </SubmitButton>
    </form>
  );
}
