import type { BankEmailParser, EmailEnvelope } from "../bank-email-parser";
import { bcpParser } from "./bcp";
import { interbankParser } from "./interbank";
import { ioParser } from "./io";

export const bankEmailParsers: BankEmailParser[] = [
  bcpParser,
  interbankParser,
  ioParser,
];

export function parserForEmail(
  email: EmailEnvelope,
): BankEmailParser | undefined {
  return bankEmailParsers.find((parser) => parser.canParse(email));
}