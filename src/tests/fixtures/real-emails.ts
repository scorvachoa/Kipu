import type { EmailEnvelope } from "@/lib/email/bank-email-parser";
import type { ParsedTransaction } from "@/types/transactions";

function envelope(
  id: string,
  from: string,
  subject: string,
  html: string,
): EmailEnvelope {
  return {
    id,
    threadId: id,
    internalDate: "0",
    from,
    subject,
    html,
  };
}

export const bcpConsumoRealHtml = `<html><body>
<p>Realizaste un consumo de <b>S/ 11.08</b> con tu <b>Tarjeta de Débito BCP</b> en <b>OP *Market Mary.</b></p>
<p><b>Monto</b></p>
<table>
<tr><td>Total del consumo</td><td><b>S/ 11.08</b></td></tr>
</table>
<p><b>Datos de la operación</b></p>
<table>
<tr><td>Operación realizada</td><td><b>Consumo Tarjeta de Débito</b></td></tr>
<tr><td>Fecha y hora</td><td><b><a href="">07 de agosto de 2026 - 07:38 PM</a></b></td></tr>
<tr><td>Número de Tarjeta de Débito</td><td><b>************8795</b></td></tr>
<tr><td>Empresa</td><td><b>OP *Market Mary</b></td></tr>
<tr><td>Número de operación</td><td><b><a href="">045171</a></b></td></tr>
</table>
</body></html>`;

export const bcpConsumoRealEmail = envelope(
  "bcp-real-consumo",
  "BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>",
  "Realizaste un consumo con tu Tarjeta de Débito BCP - Servicio de Notificaciones BCP",
  bcpConsumoRealHtml,
);

export const bcpConsumoRealExpected: ParsedTransaction = {
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

export const bcpRetiroRealHtml = `<html><body>
<p>Realizaste un retiro de <b>S/ 60.00</b> con tu <b>Tarjeta de Débito BCP</b> en un Cajero BCP.</p>
<p><b>Montos</b></p>
<table>
<tr><td>Total retirado</td><td><b>S/ 60.00</b></td></tr>
<tr><td>Comisión por operación</td><td><b>GRATIS</b></td></tr>
</table>
<p><b>Datos de la operación</b></p>
<table>
<tr><td>Operación realizada</td><td><b>Retiro</b></td></tr>
<tr><td>Fecha y hora</td><td><b><a href="">01 de agosto de 2026 - 03:27 PM</a></b></td></tr>
<tr><td>Número de Tarjeta de Débito</td><td><b>************8795</b></td></tr>
<tr><td>Código de cajero</td><td><b>C285575</b></td></tr>
<tr><td>Número de operación</td><td><b><a href="">1670</a></b></td></tr>
</table>
</body></html>`;

export const bcpRetiroRealEmail = envelope(
  "bcp-real-retiro",
  "BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>",
  "Realizaste un retiro en un cajero automático BCP - Servicio de Notificaciones BCP",
  bcpRetiroRealHtml,
);

export const bcpRetiroRealExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "withdrawal",
  paymentMethod: "debit_card",
  amount: 60,
  currency: "PEN",
  transactionDate: "2026-08-01",
  transactionTime: "15:27",
  cardLast4: "8795",
  operationNumber: "1670",
};

export const bcpPagoServiciosRealHtml = `<html><body>
<p>Hola SMITH, ¡Tu operación se realizó con éxito!</p>
<table>
<tr><td>Operación realizada:</td><td><b>Pago de servicios</b></td></tr>
<tr><td>Número de operación:</td><td><b>04600330</b></td></tr>
<tr><td>Fecha y hora:</td><td><b>Martes, 21 Julio 2026 - 05:38 P. M.</b></td></tr>
<tr><td>Empresa:</td><td><b>UNIVERSIDAD CONTINENTAL S.A.C.</b></td></tr>
<tr><td>Servicio:</td><td><b>PENSIONES VENTANILLA</b></td></tr>
<tr><td>Cuenta de origen:</td><td><b>Tarjeta de crédito</b></td></tr>
<tr><td></td><td><b>**** 4165</b></td></tr>
<tr><td>Monto total:</td><td><b>S/ 677.30</b></td></tr>
</table>
</body></html>`;

export const bcpPagoServiciosRealEmail = envelope(
  "bcp-real-pago-servicio",
  "BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>",
  "ENVIO AUTOMATICO - CONSTANCIA DE PAGO DE SERVICIO - BANCA MOVIL BCP",
  bcpPagoServiciosRealHtml,
);

export const bcpPagoServiciosRealExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "payment",
  paymentMethod: "credit_card",
  amount: 677.3,
  currency: "PEN",
  transactionDate: "2026-07-21",
  cardLast4: "4165",
  merchant: "UNIVERSIDAD CONTINENTAL S.A.C.",
  operationNumber: "04600330",
};

export const bcpYapeoRealEmail = envelope(
  "bcp-real-yapeo",
  "BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>",
  "Constancia de recepción de Yapeo a celular BCP - Servicio de Notificaciones BCP",
  `<html><body>
<p><b>Monto</b></p>
<table>
<tr><td>Monto recibido</td><td><b>S/ 65.00</b></td></tr>
</table>
<p><b>Datos de la operación</b></p>
<table>
<tr><td>Operación realizada</td><td><b>Yapeo a celular</b></td></tr>
<tr><td>Fecha y hora</td><td><b>04 de agosto de 2026 - 08:02 AM</b></td></tr>
<tr><td>Enviado por</td><td><b>Rocio Corvacho</b></td></tr>
</table>
</body></html>`,
);

export const bcpYapeoRealExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "income",
  paymentMethod: "unknown",
  amount: 65,
  currency: "PEN",
  transactionDate: "2026-08-04",
  transactionTime: "08:02",
  merchant: "Rocio Corvacho",
};

export const bcpWardaditoAporteRealEmail = envelope(
  "bcp-real-wardadito-aporte",
  "BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>",
  "Realizaste un aporte voluntario a tu wardadito.",
  `<html><body>
<p><b>Montos</b></p>
<table>
<tr><td>Total aportado</td><td><b>S/ 500.00</b></td></tr>
</table>
<p><b>Datos de la operación</b></p>
<table>
<tr><td>Operación realizada</td><td><b>Aporte voluntario</b></td></tr>
<tr><td>Fecha y hora</td><td><b>12 de agosto de 2026 - 13:59:53</b></td></tr>
<tr><td>Origen</td><td><b>AHOR. *************006</b></td></tr>
<tr><td>Destino</td><td><b>Wardadito Deuda</b></td></tr>
</table>
</body></html>`,
);

export const bcpWardaditoAporteRealExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "transfer",
  paymentMethod: "bank_account",
  amount: 500,
  currency: "PEN",
  transactionDate: "2026-08-12",
  merchant: "Wardadito Deuda",
};

export const bcpWardaditoRetiroRealEmail = envelope(
  "bcp-real-wardadito-retiro",
  "BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>",
  "Realizaste un retiro de tu wardadito.",
  `<html><body>
<p><b>Montos</b></p>
<table>
<tr><td>Total retirado</td><td><b>S/ 400.00</b></td></tr>
</table>
<p><b>Datos de la operación</b></p>
<table>
<tr><td>Operación realizada</td><td><b>Retiro</b></td></tr>
<tr><td>Fecha y hora</td><td><b>31 de julio de 2026 - 17:44:31</b></td></tr>
<tr><td>Origen</td><td><b>Wardadito Deuda</b></td></tr>
<tr><td>Destino</td><td><b>AHOR. *************006</b></td></tr>
</table>
</body></html>`,
);

export const bcpWardaditoRetiroRealExpected: ParsedTransaction = {
  bank: "BCP",
  transactionType: "income",
  paymentMethod: "bank_account",
  amount: 400,
  currency: "PEN",
  transactionDate: "2026-07-31",
  merchant: "Wardadito Deuda",
};

export const interbankConsumoRealHtml = `<html><body>
<div>Smith, realizaste un consumo con tu Tarjeta Interbank Visa Clásica</div>
<div>
  Tarjeta: <span style="font-weight: bold;">****3902</span><br>Comercio:
  <span style="font-weight: bold;">OPENPAY*MARKET MARY   C</span><br>Monto:
  <span style="font-weight: bold;">S/. 19.00</span><br>Fecha:
  <span style="font-weight: bold;">01/08/2026</span><br>Hora:
  <span style="font-weight: bold;">09:58 PM</span><br>
</div>
</body></html>`;

export const interbankConsumoRealEmail = envelope(
  "interbank-real-consumo",
  "Servicio al cliente <servicioalcliente@netinterbank.com.pe>",
  "Smith, realizaste un consumo con tu Tarjeta Interbank Visa Clásica",
  interbankConsumoRealHtml,
);

export const interbankConsumoRealExpected: ParsedTransaction = {
  bank: "INTERBANK",
  transactionType: "purchase",
  paymentMethod: "credit_card",
  amount: 19,
  currency: "PEN",
  transactionDate: "2026-08-01",
  transactionTime: "21:58",
  cardLast4: "3902",
  merchant: "OPENPAY*MARKET MARY C",
};

export const interbankTransferenciaRealHtml = `<html><body>
<p>Constancia de transferencia</p>
<table>
<tr><td>Código de operación</td><td><b>00443401</b></td></tr>
<tr><td>Fecha y hora</td><td><b>11 Ago 2026</b></td></tr>
<tr><td>Fecha y hora</td><td><b>01:36 PM</b></td></tr>
<tr><td>Cuenta a cargo</td><td><b>Ahorro Sueldo</b></td></tr>
<tr><td>Cuenta a cargo</td><td><b>420 3413121732</b></td></tr>
<tr><td>Tipo de operación</td><td><b>Transferencia inmediata</b></td></tr>
<tr><td>Monto y moneda</td><td><b>S/</b></td></tr>
<tr><td>Monto y moneda</td><td><b>1,000.00</b></td></tr>
<tr><td>Monto total</td><td><b>S/</b></td></tr>
<tr><td>Monto total</td><td><b>1000.00</b></td></tr>
</table>
</body></html>`;

export const interbankTransferenciaRealEmail = envelope(
  "interbank-real-transferencia",
  "Interbank Servicio al Cliente <servicioalcliente@netinterbank.com.pe>",
  "Constancia de transferencia",
  interbankTransferenciaRealHtml,
);

export const interbankTransferenciaRealExpected: ParsedTransaction = {
  bank: "INTERBANK",
  transactionType: "transfer",
  paymentMethod: "bank_account",
  amount: 1000,
  currency: "PEN",
  transactionDate: "2026-08-11",
  transactionTime: "13:36",
  accountLast4: "1732",
  operationNumber: "00443401",
};

export const interbankPagoRealHtml = `<html><body>
<p>Constancia de pago</p>
<table>
<tr><td>Código de operación</td><td><b>0451124</b></td></tr>
<tr><td>Fecha y hora</td><td><b>11 Ago 2026</b></td></tr>
<tr><td>Fecha y hora</td><td><b>01:35 PM</b></td></tr>
<tr><td>Cuenta cargo</td><td><b>Ahorro Sueldo</b></td></tr>
<tr><td>Cuenta cargo</td><td><b>Soles</b></td></tr>
<tr><td>Cuenta cargo</td><td><b>420 3413121732</b></td></tr>
<tr><td>Tarjeta de crédito</td><td><b>Visa</b></td></tr>
<tr><td>Tarjeta de crédito</td><td><b>Soles</b></td></tr>
<tr><td>Tarjeta de crédito</td><td><b>454775******3902</b></td></tr>
<tr><td>Moneda y monto</td><td><b>S/</b></td></tr>
<tr><td>Moneda y monto</td><td><b>306.46</b></td></tr>
</table>
</body></html>`;

export const interbankPagoRealEmail = envelope(
  "interbank-real-pago",
  "Servicio al cliente <servicioalcliente@netinterbank.com.pe>",
  "Constancia de pago",
  interbankPagoRealHtml,
);

export const interbankPagoRealExpected: ParsedTransaction = {
  bank: "INTERBANK",
  transactionType: "payment",
  paymentMethod: "credit_card",
  amount: 306.46,
  currency: "PEN",
  transactionDate: "2026-08-11",
  transactionTime: "13:35",
  accountLast4: "1732",
  cardLast4: "3902",
  operationNumber: "0451124",
};