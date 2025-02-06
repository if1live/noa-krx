import { fetch_range } from "./fetcher.js";
import * as parser from "./parser.js";
import type { MyDate } from "./types.js";

export interface Input {
  isin: string;
  startDate: MyDate;
  endDate: MyDate;
}

export interface Element {
  일자: MyDate;
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

const bld = "dbms/MDC/STAT/standard/MDCSTAT01701";

/**
 * [12003] 개별종목 시세 추이
 * 통계 - 기본 통계 - 주식 - 종목시세 - 개별종목 시세 추이
 */
export const load = async (input: Input): Promise<Element[]> => {
  const { isin, startDate, endDate, ...rest } = input;
  const params = {
    ...rest,
    isuCd: input.isin,
    adjStkPrc: "2",
    bld,
  };

  const output = await fetch_range(params, startDate, endDate);
  const elements = output.map((x): Element => {
    return {
      일자: parser.prepareDate("TRD_DD")(x),
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
