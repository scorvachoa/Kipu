import type { EmailEnvelope } from "./bank-email-parser";
import { canonical } from "./parsers/support";

const GREETING_PATTERN =
  /(?:^|\s)(?:hola|estimad[oa])\s*,?\s*([A-Za-zÁÉÍÓÚÑñáéíóú]+(?:[\s.'][A-Za-zÁÉÍÓÚÑñáéíóú]+)*)/i;

const INITIAL_NAME_PATTERN =
  /^([A-Za-zÁÉÍÓÚÑñáéíóú]+(?:[\s.'][A-Za-zÁÉÍÓÚÑñáéíóú]+)*),(?=\s+(?:realizaste|hiciste|efectuaste|tu|su|has|registraste|compraste|enviaste|recibiste))/i;

const GENERIC_NAMES = new Set([
  "USUARIO",
  "CLIENTE",
  "USER",
  "ESTIMADO",
  "AMIGO",
  "HOLA",
  "KIPU",
]);

const NAME_WORD_PATTERN = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:['`][A-Za-zÁÉÍÓÚÑñáéíóú]+)?$/;

export function titleCaseName(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return cleaned;
  }
  return cleaned
    .split(/(\s|\.)/)
    .map((part) => {
      if (/^[\s.]+$/.test(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

function isValidName(candidate: string): boolean {
  const normalized = titleCaseName(candidate);
  const upper = canonical(normalized);
  if (!upper || upper.length < 2 || upper.length > 40) {
    return false;
  }
  if (GENERIC_NAMES.has(upper)) {
    return false;
  }
  return normalized
    .split(/\s+/)
    .every((word) => word.length > 0 && NAME_WORD_PATTERN.test(word));
}

export function extractGreetingName(
  email: EmailEnvelope,
): string | undefined {
  const source = `${email.subject ?? ""}\n${
    email.html ?? email.text ?? ""
  }`;
  const text = source.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const greetingMatch = text.match(GREETING_PATTERN);
  if (greetingMatch) {
    const candidate = titleCaseName(greetingMatch[1]);
    if (isValidName(candidate)) {
      return candidate;
    }
  }

  const initialMatch = text.match(INITIAL_NAME_PATTERN);
  if (initialMatch) {
    const candidate = titleCaseName(initialMatch[1]);
    if (isValidName(candidate)) {
      return candidate;
    }
  }

  return undefined;
}