import { fetch_webio } from "./fetcher.ts";
import * as parser from "./parser.ts";
import { 주가지수계열 } from "./types.ts";

export interface Input {
  trdDd: string;
  계열구분: 주가지수계열;
}

export interface Element {
  지수명: string;
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

const bld = "dbms/MDC/STAT/standard/MDCSTAT00101";

/**
 * [11001] 전체지수 시세
 * 기본 통계 - 지수 - 주가지수 - 전체지수 시세
 */
export const load = async (input: Input): Promise<Element[]> => {
  const idxIndMidclssCd = 주가지수계열.convertMidClass(input.계열구분);
  const { 계열구분: _계열구분, ...rest } = input;
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
      종가: parser.prepareDecimal("CLSPRC_IDX")(x),
      대비: parser.prepareDecimal("CMPPREVDD_IDX")(x),
      등락률: parser.prepareDecimal("FLUC_RT")(x),
      시가: parser.prepareDecimal("OPNPRC_IDX")(x),
      고가: parser.prepareDecimal("HGPRC_IDX")(x),
      저가: parser.prepareDecimal("LWPRC_IDX")(x),
      거래량: parser.prepareDecimal("ACC_TRDVOL")(x),
      거래대금: parser.prepareDecimal("ACC_TRDVAL")(x),
      상장시가총액: parser.prepareDecimal("MKTCAP")(x),
    };
  });

  return elements;
};
