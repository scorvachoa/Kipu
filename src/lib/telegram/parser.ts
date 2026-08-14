export interface ParsedCommand {
  name: string;
  args: string;
}

/**
 * Extrae el comando y sus argumentos del texto de un mensaje de Telegram.
 * Ej.: "/start AB12CD" → { name: "start", args: "AB12CD" }
 */
export function parseCommand(text: string): ParsedCommand | null {
  if (!text.startsWith("/")) {
    return null;
  }
  const trimmed = text.trim();
  const [token, ...rest] = trimmed.split(/\s+/);
  if (!token) {
    return null;
  }
  return {
    name: token.toLowerCase(),
    args: rest.join(" "),
  };
}