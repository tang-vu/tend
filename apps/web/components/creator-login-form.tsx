"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CreatorLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: form.get("accessKey") }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Sign-in failed.");
      router.replace("/community");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign-in failed.");
      setPending(false);
    }
  }

  return (
    <form className="creator-login-form" onSubmit={submit}>
      <label htmlFor="access-key">Creator access key</label>
      <input
        autoComplete="current-password"
        autoFocus
        id="access-key"
        maxLength={512}
        name="accessKey"
        required
        type="password"
      />
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Open creator dashboard"}
      </button>
    </form>
  );
}
