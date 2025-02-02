import { fetch_webio } from "./fetcher.js";
import * as parser from "./parser.js";
import { type MyDate, 주가지수계열 } from "./types.js";

export interface Input {
  계열구분: 주가지수계열;
}

export interface Element {
  지수명: string;
  영문지수명: string;
  기준일: MyDate;
  발표일: MyDate;
  기준지수: number;
  산출주기: string;
  산출시간: string;
  구성종목수: number;
  indIdx: string;
  indIdx2: string;
}

const bld = "dbms/MDC/STAT/standard/MDCSTAT00401";

/**
 * [11004] 전체지수 기본정보
 * 통계 - 기본 통계 - 지수 - 주가지수 - 전체지수 기본정보
 */
export const load = async (input: Input): Promise<[Array<Element>, string]> => {
  const idxIndMidclssCd = 주가지수계열.convertMidClass(input.계열구분);
  const { 계열구분: drop_계열구분, ...rest } = input;
  const params = {
    ...rest,
    idxIndMidclssCd,
    bld,
  };

  const json = await fetch_webio(params);
  const data = json as {
    output: Record<string, string>[];
    CURRENT_DATETIME: string;
  };

  const elements = data.output.map((x): Element => {
    return {
      지수명: parser.prepareString("IDX_NM")(x),
      영문지수명: parser.prepareString("IDX_ENG_NM")(x),
      기준일: parser.prepareDate("BAS_TM_CONTN")(x),
      발표일: parser.prepareDate("ANNC_TM_CONTN")(x),
      기준지수: parser.prepareDecimal("BAS_IDX_CONTN")(x),
      산출주기: parser.prepareString("CALC_CYCLE_CONTN")(x),
      산출시간: parser.prepareString("CALC_TM_CONTN")(x),
      구성종목수: parser.prepareDecimal("COMPST_ISU_CNT")(x),
      indIdx: parser.prepareString("IND_TP_CD")(x),
      indIdx2: parser.prepareString("IDX_IND_CD")(x),
    };
  });

  return [elements, data.CURRENT_DATETIME];
};
