import type { EmailEnvelope } from "@/lib/email/bank-email-parser";
import type { ParsedTransaction } from "@/types/transactions";

export const bcpConsumoHtml = `<!DOCTYPE html>
<html>
<body>
<p>Realizaste un consumo de S/ 11.08 con tu Tarjeta de Débito BCP en OP *Market Mary.</p>
<table>
<tr><td>Monto</td><td>S/ 11.08</td></tr>
<tr><td>Total del consumo</td><td>S/ 11.08</td></tr>
<tr><td>Operación realizada</td><td>Consumo Tarjeta de Débito</td></tr>
<tr><td>Fecha y hora</td><td>07 de agosto de 2026 - 07:38 PM</td></tr>
<tr><td>Número de Tarjeta de Débito</td><td>************8795</td></tr>
<tr><td>Empresa</td><td>OP *Market Mary</td></tr>
<tr><td>Número de operación</td><td>045171</td></tr>
</table>
</body>
</html>`;

export const bcpConsumoEmail: EmailEnvelope = {
  id: "bcp-1",
  threadId: "bcp-1",
  internalDate: "1783470300000",
  from: "BCP <noreply@bcp.com.pe>",
  subject: "Realizaste un consumo de S/ 11.08",
  html: bcpConsumoHtml,
};

export const bcpConsumoExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "purchase",
  paymentMethod: "debit_card",
  amount: 11.08,
  currency: "PEN",
  transactionDate: "2026-08-07",
  transactionTime: "19:38",
  cardLast4: "8795",
  merchant: "OP *Market Mary",
  operationNumber: "045171",
};

export const bcpSegundoConsumoHtml = `<!DOCTYPE html>
<html>
<body>
<p>Realizaste un consumo de S/ 100.60 con tu Tarjeta de Débito BCP.</p>
<table>
<tr><td>Monto</td><td>S/ 100.60</td></tr>
<tr><td>Total del consumo</td><td>S/ 100.60</td></tr>
<tr><td>Fecha y hora</td><td>12 de mayo de 2026 - 06:44 AM</td></tr>
<tr><td>Número de Tarjeta de Débito</td><td>************8795</td></tr>
<tr><td>Empresa</td><td>IO*first_last_name_firs</td></tr>
<tr><td>Número de operación</td><td>109586</td></tr>
</table>
</body>
</html>`;

export const bcpSegundoConsumoEmail: EmailEnvelope = {
  id: "bcp-2",
  threadId: "bcp-2",
  internalDate: "1773431000000",
  from: "BCP <noreply@bcp.com.pe>",
  subject: "Realizaste un consumo de S/ 100.60",
  html: bcpSegundoConsumoHtml,
};

export const bcpSegundoConsumoExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "purchase",
  paymentMethod: "debit_card",
  amount: 100.6,
  currency: "PEN",
  transactionDate: "2026-05-12",
  transactionTime: "06:44",
  cardLast4: "8795",
  merchant: "IO*first_last_name_firs",
  operationNumber: "109586",
};

export const interbankPagoHtml = `<!DOCTYPE html>
<html>
<body>
<h1>Constancia de pago</h1>
<table>
<tr><td>Código de operación</td><td>3317266</td></tr>
<tr><td>Fecha y hora</td><td>13 Jul 2026</td></tr>
<tr><td>Fecha y hora</td><td>10:23 AM</td></tr>
<tr><td>Cuenta cargo</td><td>Visa Soles 454775******3902</td></tr>
<tr><td>Empresa</td><td>PAGOEFECTIVO</td></tr>
<tr><td>Empresa</td><td>PagoEfectivo</td></tr>
<tr><td>Recibo</td><td>S/ 200.00</td></tr>
<tr><td>Recibo</td><td>30/11</td></tr>
<tr><td>Moneda y monto</td><td>S/ 200.00</td></tr>
</table>
</body>
</html>`;

export const interbankPagoEmail: EmailEnvelope = {
  id: "interbank-1",
  threadId: "interbank-1",
  internalDate: "1782858000000",
  from: "Interbank <comunicaciones@interbank.com.pe>",
  subject: "Constancia de pago",
  html: interbankPagoHtml,
};

export const interbankPagoExpected: ParsedTransaction = {
  bank: "INTERBANK",
  transactionType: "payment",
  paymentMethod: "credit_card",
  amount: 200,
  currency: "PEN",
  transactionDate: "2026-07-13",
  transactionTime: "10:23",
  accountLast4: "3902",
  merchant: "PAGOEFECTIVO",
  operationNumber: "3317266",
};