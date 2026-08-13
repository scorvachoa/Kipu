const GMAIL_SENDERS = [
  "bcp.com.pe",
  "interbank.com.pe",
  "notificacionesbcp.com.pe",
  "netinterbank.com.pe",
];

export const SYNC_RANGES = ["30d", "3m", "6m", "12m"] as const;
export type SyncRange = (typeof SYNC_RANGES)[number];

export const DEFAULT_SYNC_RANGE: SyncRange = "3m";

const RANGE_DAYS: Record<SyncRange, number> = {
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "12m": 365,
};

export function isSyncRange(value: unknown): value is SyncRange {
  return (
    typeof value === "string" &&
    (SYNC_RANGES as readonly string[]).includes(value)
  );
}

export function rangeToDays(range: SyncRange): number {
  return RANGE_DAYS[range];
}

export function formatGmailDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export function buildGmailQuery(since: Date): string {
  const senders = GMAIL_SENDERS.map((sender) => `from:${sender}`).join(" OR ");
  return `(${senders}) after:${formatGmailDate(since)}`;
}