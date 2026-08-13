import { readFileSync } from "fs";
import { describe, it } from "vitest";
import { bcpParser } from "@/lib/email/parsers/bcp";
import { interbankParser } from "@/lib/email/parsers/interbank";
import { extractTextFragments } from "@/lib/email/parsers/support";

const DIR = "E:/Python/Git/Kipu/prueba/html";
const index = JSON.parse(readFileSync(`${DIR}/index.json`, "utf8"));

describe("debug real html", () => {
  it("parsea cada correo real", () => {
    for (const entry of index) {
      const html = readFileSync(`${DIR}/${entry.id}.html`, "utf8");
      const email = {
        id: entry.id,
        threadId: entry.id,
        internalDate: "0",
        from: entry.from,
        subject: entry.subject,
        html,
      };
      const bcpResult = bcpParser.canParse(email)
        ? bcpParser.parse(email)
        : null;
      const interbankResult = interbankParser.canParse(email)
        ? interbankParser.parse(email)
        : null;
      const result = bcpResult ?? interbankResult;
      console.log(
        `[${entry.id}] ${entry.subject.slice(0, 60)} | ${
          bcpResult || interbankResult ? "PARSED" : "SKIPPED"
        } | ${result ? result.length : 0} tx`,
      );
      if (result && result.length === 0) {
        console.log("  fragments:", extractTextFragments(html).slice(0, 30));
      }
      if (result) {
        for (const tx of result) {
          console.log(
            `    -> ${tx.transactionType} ${tx.amount} ${tx.currency} ${tx.transactionDate} ${tx.transactionTime ?? ""} card=${tx.cardLast4 ?? "-"} acct=${tx.accountLast4 ?? "-"} m="${tx.merchant ?? "-"}" op=${tx.operationNumber ?? "-"}`,
          );
        }
      }
    }
  });
});