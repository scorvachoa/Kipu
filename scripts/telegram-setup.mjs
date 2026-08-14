#!/usr/bin/env node
/**
 * Registra el webhook del bot de Telegram apuntando a la app desplegada.
 *
 * Uso:
 *   npm run telegram:setup                  # registra el webhook
 *   npm run telegram:setup -- --unset       # borra el webhook
 *
 * Variables usadas (desde .env o entorno):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_WEBHOOK_SECRET
 *   NEXT_PUBLIC_APP_URL
 */

import fs from "node:fs";
import path from "node:path";

const TELEGRAM_API = "https://api.telegram.org";

function loadEnv() {
  const env = { ...process.env };
  const envFile = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      env[key] = trimmed.slice(eq + 1).trim();
    }
  }
  return env;
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function main() {
  const env = loadEnv();
  const unset = process.argv.includes("--unset");

  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) fail("TELEGRAM_BOT_TOKEN no configurado.");

  if (unset) {
    const res = await fetch(
      `${TELEGRAM_API}/bot${token}/deleteWebhook`,
      { method: "POST" },
    );
    const data = await res.json();
    if (!data.ok) fail(`No se pudo borrar el webhook: ${JSON.stringify(data)}`);
    console.log("🛑 Webhook eliminado.");
    return;
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const secret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!baseUrl) fail("NEXT_PUBLIC_APP_URL no configurada.");
  if (!secret) fail("TELEGRAM_WEBHOOK_SECRET no configurado.");

  const url = `${baseUrl.replace(/\/+$/, "")}/api/telegram/webhook`;

  const res = await fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ["message", "edited_message"],
    }),
  });

  const data = await res.json();
  if (!data.ok) fail(`Telegram rechazó el webhook: ${JSON.stringify(data)}`);
  console.log(`✅ Webhook registrado en ${url}`);
  console.log(`   Descripción: ${data.description ?? "ok"}`);

  const info = await fetch(`${TELEGRAM_API}/bot${token}/getWebhookInfo`)
    .then((r) => r.json());
  console.log(`   Info actual: ${info.result?.url ?? "(vacío)"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});