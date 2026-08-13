import { describe, expect, it } from "vitest";
import { bcpParser } from "@/lib/email/parsers/bcp";
import { interbankParser } from "@/lib/email/parsers/interbank";
import {
  bcpConsumoRealEmail,
  bcpConsumoRealExpected,
  bcpPagoServiciosRealEmail,
  bcpPagoServiciosRealExpected,
  bcpRetiroRealEmail,
  bcpRetiroRealExpected,
  bcpWardaditoAporteRealEmail,
  bcpWardaditoAporteRealExpected,
  bcpWardaditoRetiroRealEmail,
  bcpWardaditoRetiroRealExpected,
  bcpYapeoRealEmail,
  bcpYapeoRealExpected,
  interbankConsumoRealEmail,
  interbankConsumoRealExpected,
  interbankPagoRealEmail,
  interbankPagoRealExpected,
  interbankTransferenciaRealEmail,
  interbankTransferenciaRealExpected,
} from "@/tests/fixtures/real-emails";

describe("parsers con formatos reales", () => {
  it("parsea un consumo BCP real (fecha dentro de <a>)", () => {
    expect(bcpParser.parse(bcpConsumoRealEmail)).toEqual([
      bcpConsumoRealExpected,
    ]);
  });

  it("parsea un retiro de cajero BCP real", () => {
    expect(bcpParser.parse(bcpRetiroRealEmail)).toEqual([
      bcpRetiroRealExpected,
    ]);
  });

  it("parsea un pago de servicio BCP real", () => {
    expect(bcpParser.parse(bcpPagoServiciosRealEmail)).toEqual([
      bcpPagoServiciosRealExpected,
    ]);
  });

  it("parsea un yapeo recibido como ingreso", () => {
    expect(bcpParser.parse(bcpYapeoRealEmail)).toEqual([
      bcpYapeoRealExpected,
    ]);
  });

  it("parsea un aporte a wardadito como transferencia", () => {
    expect(bcpParser.parse(bcpWardaditoAporteRealEmail)).toEqual([
      bcpWardaditoAporteRealExpected,
    ]);
  });

  it("parsea un retiro de wardadito como ingreso", () => {
    expect(bcpParser.parse(bcpWardaditoRetiroRealEmail)).toEqual([
      bcpWardaditoRetiroRealExpected,
    ]);
  });

  it("parsea un consumo Interbank real (layout detalle)", () => {
    expect(interbankParser.parse(interbankConsumoRealEmail)).toEqual([
      interbankConsumoRealExpected,
    ]);
  });

  it("parsea una transferencia Interbank real", () => {
    expect(interbankParser.parse(interbankTransferenciaRealEmail)).toEqual([
      interbankTransferenciaRealExpected,
    ]);
  });

  it("parsea un pago Interbank real", () => {
    expect(interbankParser.parse(interbankPagoRealEmail)).toEqual([
      interbankPagoRealExpected,
    ]);
  });
});