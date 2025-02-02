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

const bld = "dbms/MDC/STAT/standard/MDCSTAT04501";

/**
 * [13103] 개별종목 시세 추이
 * 통계 - 기본 통계 - 증권상품 - ETF - 개별종목 시세 추이
 */
export const load = async (input: Input): Promise<Element[]> => {
  const { startDate, endDate, ...rest } = input;

  const params = {
    ...rest,
    isuCd: input.isin,
    bld,
  };

  const output = await fetch_range(params, startDate, endDate);
  const elements = output.map((x): Element => {
    // ETF 개별종목 시세에서 대비는 항상 양수로 나오는 문제가 있다
    // 2025-01-31 430500 "KIWOOM 물가채KIS"는 등락률이 0인데 대비는 -5가 나오야한다.
    // 종가가 114950나 되다보니까 정밀도 문제로 등락률에서 보이지 않는것.
    // 부호로 추정되는 항목에서 값을 얻어다 쓴다
    const 대비abs = Math.abs(parser.prepareDecimal("CMPPREVDD_PRC")(x));
    const 대비 = 대비abs * parser.prepareSign("FLUC_TP_CD")(x);

    const 기초지수_대비abs = Math.abs(
      parser.prepareDecimal("CMPPREVDD_IDX")(x),
    );
    const 기초지수_대비 =
      기초지수_대비abs * parser.prepareSign("FLUC_TP_CD1")(x);

    return {
      일자: parser.prepareDate("TRD_DD")(x),
      종가: parser.prepareDecimal("TDD_CLSPRC")(x),
      대비,
      등락률: parser.prepareDecimal("FLUC_RT")(x),
      순자산가치: parser.prepareDecimal("LST_NAV")(x),
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
      기초지수_대비,
      기초지수_등락률: parser.prepareDecimal("IDX_FLUC_RT")(x),
    };
  });

  return elements;
};
