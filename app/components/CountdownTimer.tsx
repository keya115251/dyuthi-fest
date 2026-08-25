"use client";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function CountdownTimer({
  timeRemainingMs,
}: {
  timeRemainingMs: number | null;
}) {
  if (timeRemainingMs === null) return null;
  return <span className="font-mono tabular-nums">{formatDuration(timeRemainingMs)}</span>;
}
