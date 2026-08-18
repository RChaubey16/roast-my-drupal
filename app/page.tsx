"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

export default function Home() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [roastText, setRoastText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState("");

  const isBusy = status === "loading" || status === "streaming";

  async function submitRoast(username: string) {
    setStatus("loading");
    setRoastText("");
    setErrorMessage("");

    let response: Response;
    try {
      response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
      return;
    }

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => null);
      setErrorMessage(body?.error ?? "Something went wrong. Please try again.");
      setStatus("error");
      return;
    }

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
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Roast My Drupal
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Enter a drupal.org username or profile URL and get roasted.
        </p>
        <form className="flex w-full gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="e.g. dries"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isBusy}
            className="flex-1 rounded-full border border-black/[.08] bg-white px-5 py-3 text-black outline-none disabled:opacity-60 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {isBusy ? "Roasting…" : "Roast"}
          </button>
        </form>

        {status === "loading" && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Digging through their Drupal footprint…
          </p>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.06]"
            >
              Try again
            </button>
          </div>
        )}

        {(status === "streaming" || status === "done") && (
          <p className="w-full whitespace-pre-wrap text-left text-black dark:text-zinc-50">
            {roastText}
          </p>
        )}
      </main>
    </div>
  );
}
