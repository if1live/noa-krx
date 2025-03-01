import { fetch_webio } from "./fetcher.ts";
import { MyDateMod } from "./mod.ts";
import * as parser from "./parser.ts";
import type { MyDate } from "./types.ts";

export interface Input {
  date: MyDate;
}

export interface Element {
  단축코드: string;
  종목코드: string;
  종목명: string;
  종가: number;
  대비: number;
  등락률: number;
  순자산가치: number;
  시가: number;
  고가: number;
  저가: number;
  거래량: number;
  거래대금: number;
  시가총액: number;
  순자산총액: number;
  상장좌수: number;
  기초지수_지수명: string;
  기초지수_종가: number;
  기초지수_대비: number;
  기초지수_등락률: number;
}

const bld = "dbms/MDC/STAT/standard/MDCSTAT04301";

/**
 * [13101] 전종목 시세
 * 통계 - 기본 통계 - 증권상품 - ETF - 전종목 시세
 *
 * 주말 및 공휴일에는 ETF 목록은 나오지만 숫자 필드는 죄다 '-'
 * 미래를 선택하면 빈배열 리턴
 */
export const load = async (input: Input): Promise<Element[]> => {
  const params = {
    ...input,
    trdDd: MyDateMod.marshal(input.date, ""),
    bld,
  };

  const json = await fetch_webio(params);
  const data = json as {
    output: Record<string, string>[];
    CURRENT_DATETIME: string;
  };

  const elements = data.output.map((x): Element => {
    return {
      단축코드: parser.prepareString("ISU_SRT_CD")(x),
      종목코드: parser.prepareString("ISU_CD")(x),
      종목명: parser.prepareString("ISU_ABBRV")(x),
      종가: parser.prepareDecimal("TDD_CLSPRC")(x),
      대비: parser.prepareDecimal("CMPPREVDD_PRC")(x),
      등락률: parser.prepareDecimal("FLUC_RT")(x),
      순자산가치: parser.prepareDecimal("NAV")(x),
      시가: parser.prepareDecimal("TDD_OPNPRC")(x),
      고가: parser.prepareDecimal("TDD_HGPRC")(x),
      저가: parser.prepareDecimal("TDD_LWPRC")(x),
      거래량: parser.prepareDecimal("ACC_TRDVOL")(x),
      거래대금: parser.prepareDecimal("ACC_TRDVAL")(x),
      시가총액: parser.prepareDecimal("MKTCAP")(x),
      순자산총액: parser.prepareDecimal("INVSTASST_NETASST_TOTAMT")(x),
      상장좌수: parser.prepareDecimal("LIST_SHRS")(x),
      기초지수_지수명: parser.prepareString("IDX_IND_NM")(x),
      기초지수_종가: parser.prepareDecimal("OBJ_STKPRC_IDX")(x),
      기초지수_대비: parser.prepareDecimal("CMPPREVDD_IDX")(x),
      기초지수_등락률: parser.prepareDecimal("FLUC_RT1")(x),
    };
  });

  return elements;
};
