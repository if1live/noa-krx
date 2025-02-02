import { fetch_webio } from "./fetcher.js";
import * as parser from "./parser.js";

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Input = {};

export interface Element {
  표준코드: string;
  단축코드: string;
  한글종목명: string;
  한글종목약명: string;
  영문종목명: string;
  상장일: string;
  기초지수명: string;
  지수산출기관: string;
  추적배수: string;
  복제방법: string;
  기초시장분류: string;
  기초자산분류: string;
  상장좌수: number;
  운용사: string;
  CU수량: number;
  총보수: number;
  과세유형: string;
}

const bld = "dbms/MDC/STAT/standard/MDCSTAT04601";

/**
 * [13104] 전종목 기본정보
 * 통계 - 기본 통계 - 증권상품 - ETF - 전종목 기본정보
 */
export const load = async (input: Input): Promise<[Element[], string]> => {
  const params = {
    ...input,
    bld,
  };

  const json = await fetch_webio(params);
  const data = json as {
    output: Record<string, string>[];
    CURRENT_DATETIME: string;
  };

  const elements = data.output.map((x): Element => {
    return {
      표준코드: parser.prepareString("ISU_CD")(x),
      단축코드: parser.prepareString("ISU_SRT_CD")(x),
      한글종목명: parser.prepareString("ISU_NM")(x),
      한글종목약명: parser.prepareString("ISU_ABBRV")(x),
      영문종목명: parser.prepareString("ISU_ENG_NM")(x),
      상장일: parser.prepareString("LIST_DD")(x),
      기초지수명: parser.prepareString("ETF_OBJ_IDX_NM")(x),
      지수산출기관: parser.prepareString("IDX_CALC_INST_NM1")(x),
      추적배수: parser.prepareString("IDX_CALC_INST_NM2")(x),
      복제방법: parser.prepareString("ETF_REPLICA_METHD_TP_CD")(x),
      기초시장분류: parser.prepareString("IDX_MKT_CLSS_NM")(x),
      기초자산분류: parser.prepareString("IDX_ASST_CLSS_NM")(x),
      상장좌수: parser.prepareDecimal("LIST_SHRS")(x),
      운용사: parser.prepareString("COM_ABBRV")(x),
      CU수량: parser.prepareDecimal("CU_QTY")(x),
      총보수: parser.prepareDecimal("ETF_TOT_FEE")(x),
      과세유형: parser.prepareString("TAX_TP_CD")(x),
    };
  });

  return [elements, data.CURRENT_DATETIME];
};
