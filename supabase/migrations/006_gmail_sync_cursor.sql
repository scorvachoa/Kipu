-- Cursor de Gmail para sincronización incremental por lotes:
-- permite reanudar con el mismo pageToken y la misma query tras un timeout.
alter table public.gmail_connections
  add column if not exists sync_cursor text,
  add column if not exists sync_since timestamptz,
  add column if not exists sync_range text;