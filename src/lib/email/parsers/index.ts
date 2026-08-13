import type { BankEmailParser, EmailEnvelope } from "../bank-email-parser";
import { bcpParser } from "./bcp";
import { interbankParser } from "./interbank";

export const bankEmailParsers: BankEmailParser[] = [
  bcpParser,
  interbankParser,
];

export function parserForEmail(
  email: EmailEnvelope,
): BankEmailParser | undefined {
  return bankEmailParsers.find((parser) => parser.canParse(email));
}