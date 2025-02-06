import { fetch_webio } from "./fetcher.js";
import { MyDateMod } from "./mod.js";
import * as parser from "./parser.js";
import type { MyDate } from "./types.js";

export type Input = {
  date: MyDate;

  /**
   * - ALL: 전체
   * - STK: KOSPI
   * - KSQ: KOSDAQ
   * 나머지는 관심 없어서 버림
   */
  mktId: "ALL" | "STK" | "KSQ";
};

export interface Element {
  단축코드: string;
  표준코드: string;
  종목명: string;
  종가: number;
  대비: number;
  등락률: number;
  시가: number;
  고가: number;
  저가: number;
  거래량: number;
  거래대금: number;
  시가총액: number;
  상장주식수: number;
}

const bld = "dbms/MDC/STAT/standard/MDCSTAT01501";
// locale: ko_KR
// mktId: STK
// trdDd: 20250206
// share: 1
// money: 1
// csvxls_isNo: false

/**
 * [12001] 전종목 시세
 * 통계 - 기본 통계 - 주식 - 종목시세 - 전종목 시세
 */
export const load = async (input: Input): Promise<Element[]> => {
  const params = {
    ...input,
    trdDd: MyDateMod.marshal(input.date, ""),
    bld,
  };

  const json = await fetch_webio(params);
  const data = json as {
    OutBlock_1: Record<string, string>[];
    CURRENT_DATETIME: string;
  };

  const elements = data.OutBlock_1.map((x): Element => {
    return {
      단축코드: parser.prepareString("ISU_SRT_CD")(x),
      표준코드: parser.prepareString("ISU_CD")(x),
      종목명: parser.prepareString("ISU_ABBRV")(x),
      종가: parser.prepareDecimal("TDD_CLSPRC")(x),
      대비: parser.prepareDecimal("CMPPREVDD_PRC")(x),
      등락률: parser.prepareDecimal("FLUC_RT")(x),
      시가: parser.prepareDecimal("TDD_OPNPRC")(x),
      고가: parser.prepareDecimal("TDD_HGPRC")(x),
      저가: parser.prepareDecimal("TDD_LWPRC")(x),
      거래량: parser.prepareDecimal("ACC_TRDVOL")(x),
      거래대금: parser.prepareDecimal("ACC_TRDVAL")(x),
      시가총액: parser.prepareDecimal("MKTCAP")(x),
      상장주식수: parser.prepareDecimal("LIST_SHRS")(x),
    };
  });
  return elements;
};
