import { fetch_webio } from "./fetcher.js";
import { MyDateMod } from "./mod.js";
import * as parser from "./parser.js";
import type { MyDate } from "./types.js";

export interface Input {
  indIdx: string;
  indIdx2: string;
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
  상장시가총액: number;
}

const bld = "dbms/MDC/STAT/standard/MDCSTAT00301";

/**
 * [11003] 개별지수 시세 추이
 * 통계 - 기본 통계 - 지수 - 주가지수 - 개별지수 시세 추이
 */
export const load = async (input: Input): Promise<[Element[], string]> => {
  const { startDate, endDate, ...rest } = input;
  const params = {
    ...rest,
    strtDd: MyDateMod.marshal(startDate, ""),
    endDd: MyDateMod.marshal(endDate, ""),
    bld,
  };

  const json = await fetch_webio(params);
  const data = json as {
    output: Record<string, string>[];
    CURRENT_DATETIME: string;
  };

  const elements = data.output.map((x): Element => {
    return {
      일자: parser.prepareDate("TRD_DD")(x),
      종가: parser.prepareDecimal("CLSPRC_IDX")(x),
      대비: parser.prepareDecimal("PRV_DD_CMPR")(x),
      등락률: parser.prepareDecimal("UPDN_RATE")(x),
      시가: parser.prepareDecimal("OPNPRC_IDX")(x),
      고가: parser.prepareDecimal("HGPRC_IDX")(x),
      저가: parser.prepareDecimal("LWPRC_IDX")(x),
      거래량: parser.prepareDecimal("ACC_TRDVOL")(x),
      거래대금: parser.prepareDecimal("ACC_TRDVAL")(x),
      상장시가총액: parser.prepareDecimal("MKTCAP")(x),
    };
  });

  return [elements, data.CURRENT_DATETIME];
};
