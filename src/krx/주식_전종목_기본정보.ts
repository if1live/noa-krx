import { fetch_webio } from "./fetcher.js";
import * as parser from "./parser.js";
import type { MyDate } from "./types.js";

export type Input = {
  /**
   * - ALL: 전체
   * - STK: KOSPI
   * - KSQ: KOSDAQ
   * 나머지는 관심 없어서 버림
   */
  mktId: "ALL" | "STK" | "KSQ";
};

export interface Element {
  표준코드: string;
  단축코드: string;
  한글종목명: string;
  한글종목약명: string;
  영문종목명: string;
  상장일: MyDate;
  시장구분: string;
  증권구분: string;
  소속부: string;
  주식종류: string;
  액면가: number;
  상장주식수: number;
}

const bld = "dbms/MDC/STAT/standard/MDCSTAT01901";

/**
 * [12005] 전종목 기본정보
 * 통계 - 기본 통계 - 주식 - 종목정보- 전종목 기본정보
 */
export const load = async (input: Input): Promise<Element[]> => {
  const params = {
    ...input,
    share: 1,
    bld,
  };

  const json = await fetch_webio(params);
  const data = json as {
    OutBlock_1: Record<string, string>[];
    CURRENT_DATETIME: string;
  };

  const elements = data.OutBlock_1.map((x): Element => {
    return {
      표준코드: parser.prepareString("ISU_CD")(x),
      단축코드: parser.prepareString("ISU_SRT_CD")(x),
      한글종목명: parser.prepareString("ISU_NM")(x),
      한글종목약명: parser.prepareString("ISU_ABBRV")(x),
      영문종목명: parser.prepareString("ISU_ENG_NM")(x),
      상장일: parser.prepareDate("LIST_DD")(x),
      시장구분: parser.prepareString("MKT_TP_NM")(x),
      증권구분: parser.prepareString("SECUGRP_NM")(x),
      소속부: parser.prepareString("SECT_TP_NM")(x),
      주식종류: parser.prepareString("KIND_STKCERT_TP_NM")(x),
      액면가: parser.prepareDecimal("PARVAL")(x),
      상장주식수: parser.prepareDecimal("LIST_SHRS")(x),
    };
  });
  return elements;
};
