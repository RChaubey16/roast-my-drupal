"use client";

import { useEffect, useState } from "react";

function pipelineLines(username: string): string[] {
  return [
    `> resolving ${username} → uid`,
    `> scraping /u/${username}`,
    `> pulling contribution records`,
    `> compiling roast dossier`,
  ];
}

export function PipelineLog({ username }: { username: string }) {
  const lines = pipelineLines(username);
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => (prev < lines.length ? prev + 1 : prev));
    }, 650);
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <div className="w-full rounded-md border border-white/10 bg-surface p-4 text-left font-mono text-sm text-muted">
      {lines.slice(0, visible).map((line, index) => (
        <p key={line} className={index === visible - 1 ? "text-foreground" : undefined}>
          {line}
          {index === visible - 1 && (
            <span className="animate-blink ml-1 inline-block w-2 bg-flame-orange align-middle">
              &nbsp;
            </span>
          )}
        </p>
      ))}
    </div>
  );
}
