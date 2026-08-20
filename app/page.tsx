"use client";

import { useState } from "react";
import { decodeRoastStatsHeader, type RoastStats } from "@/lib/roast/roast-stats";
import { type RoastModeId } from "@/lib/roast/roast-modes";
import { FlameDrop } from "@/app/components/FlameDrop";
import { ModePicker } from "@/app/components/ModePicker";
import { StatsCard } from "@/app/components/StatsCard";
import { PipelineLog } from "@/app/components/PipelineLog";

type Status = "idle" | "loading" | "streaming" | "done" | "error" | "rate_limited";

export default function Home() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [roastText, setRoastText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState("");
  const [stats, setStats] = useState<RoastStats | null>(null);
  const [mode, setMode] = useState<RoastModeId>("default");

  const isBusy = status === "loading" || status === "streaming";

  async function submitRoast(username: string) {
    setStatus("loading");
    setRoastText("");
    setErrorMessage("");
    setStats(null);

    let response: Response;
    try {
      response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, mode }),
      });
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
      return;
    }

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => null);
      setErrorMessage(body?.error ?? "Something went wrong. Please try again.");
      setStatus(response.status === 429 ? "rate_limited" : "error");
      return;
    }

    setStats(decodeRoastStatsHeader(response.headers.get("X-Roast-Stats")));

    setStatus("streaming");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      setRoastText((prev) => prev + decoder.decode(value, { stream: true }));
    }

    setStatus("done");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = input.trim();
    if (!username || isBusy) return;
    setLastSubmitted(username);
    void submitRoast(username);
  }

  function handleRetry() {
    if (!lastSubmitted || isBusy) return;
    void submitRoast(lastSubmitted);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <FlameDrop className="animate-flicker h-14 w-14" />
          <h1 className="font-display text-4xl uppercase tracking-tight text-foreground sm:text-5xl">
            Roast My Drupal
          </h1>
          <p className="max-w-sm text-sm text-muted">
            We read your drupal.org contribution history and turn it against you.
          </p>
        </div>

        <ModePicker value={mode} onChange={setMode} disabled={isBusy} />

        <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <div className="flex flex-1 items-center rounded-md border border-white/15 bg-surface px-2">
            <span className="hidden shrink-0 pl-2 font-mono text-sm text-muted sm:inline">
              roast@drupal.org:~$
            </span>
            <span className="shrink-0 pl-2 font-mono text-sm text-muted sm:hidden">$</span>
            <input
              type="text"
              name="username"
              placeholder="dries"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isBusy}
              className="flex-1 bg-transparent px-3 py-3 font-mono text-sm text-foreground outline-none disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-gradient-to-r from-flame-orange to-flame-red px-6 py-3 font-mono text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isBusy ? "Roasting…" : "Roast"}
          </button>
        </form>

        {status === "loading" && <PipelineLog key={lastSubmitted} username={lastSubmitted} />}

        {status === "error" && (
          <div className="flex w-full flex-col items-center gap-3 rounded-md border border-red-500/30 bg-surface p-4 text-left">
            <div className="w-full">
              <p className="font-mono text-xs uppercase tracking-widest text-red-400">error</p>
              <p className="mt-1 text-sm text-foreground">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:border-white/30"
            >
              Try again
            </button>
          </div>
        )}

        {status === "rate_limited" && (
          <div className="flex w-full flex-col items-center gap-3 rounded-md border border-amber-500/30 bg-surface p-4 text-left">
            <div className="w-full">
              <p className="font-mono text-xs uppercase tracking-widest text-amber-400">
                cooldown
              </p>
              <p className="mt-1 text-sm text-foreground">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:border-white/30"
            >
              Try again
            </button>
          </div>
        )}

        {(status === "streaming" || status === "done") && stats && <StatsCard stats={stats} />}

        {(status === "streaming" || status === "done") && (
          <div className="flex w-full items-start gap-4 text-left">
            <div className="mt-1 h-full w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b from-flame-orange to-flame-red" />
            <p className="whitespace-pre-wrap text-foreground">
              {roastText}
              {status === "streaming" && (
                <span className="animate-blink ml-1 inline-block w-2 bg-flame-orange align-middle">
                  &nbsp;
                </span>
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
