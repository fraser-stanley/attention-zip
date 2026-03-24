"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staging-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          next: searchParams.get("next") || "/",
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error || "Wrong password");
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.location.assign(data.next || "/");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-4 px-4"
      >
        <p className="font-mono text-sm text-muted-foreground">
          This site is password-protected.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        {error && (
          <p className="font-mono text-sm text-[#FF00F0]">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-foreground px-3 py-2 font-mono text-sm text-background disabled:opacity-50"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
