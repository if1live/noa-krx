import { XMLParser } from "fast-xml-parser";
import { MyDateMod } from "../krx/mod.ts";
import type { MyDate } from "../krx/types.ts";

const createPayload = (params: { name: string; date: string }) =>
  `
<?xml version="1.0" encoding="utf-8"?>
<message>
  <proframeHeader>
    <pfmAppName>FS-DIS2</pfmAppName>
    <pfmSvcName>DISFundFeeCmsSO</pfmSvcName>
    <pfmFnName>select</pfmFnName>
  </proframeHeader>
  <systemHeader></systemHeader>
    <DISCondFuncDTO>
    <tmpV30>${params.date}</tmpV30>
    <tmpV11></tmpV11>
    <tmpV12>${params.name}</tmpV12>
    <tmpV3></tmpV3>
    <tmpV5></tmpV5>
    <tmpV4></tmpV4>
</DISCondFuncDTO>
</message>
`.trim();

const url = "https://dis.kofia.or.kr/proframeWeb/XMLSERVICES/";

export interface Element {
  운용회사: string;
  펀드명: string;
  펀드유형: string;
  설정일: MyDate;

  // kofia에서는 "표준코드"로 부르는데 주식의 표준코드와 다르다!
  // 낚시방지하려고 필드 이름 바꿈
  펀드코드: string;

  // 금융투자협회에서 펀드 정보에 들어가면
  // "()은 주식형 유형평균보수 비율입니다." 를 볼 수 있다.
  // 다른 펀드보다 높냐/낮냐를 개별 항목으로 비교할때를 필요할거같아서 넣음
  운용보수: number;
  판매보수: number;
  수탁보수: number;
  사무관리보수: number;
  보수합계: number;
  기타비용: number;
  유사유형평균보수율: number;

  /** @summary TER */
  TER: number;

  선취수수료: number;
  후취수수료: number;

  매매중개수수료율: number;
}

export type Input = {
  date: MyDate;
  name: string;
};

// kofia - 펀드공시 - 펀드 보수 및 비용
export const load = async (input: Input) => {
  const ymd = MyDateMod.split(input.date);
  const date = `${ymd[0]}${ymd[1]}${ymd[2]}`;
  const payload = createPayload({
    name: input.name,
    date,
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "text/xml",
    },
    body: payload,
  });
  const xmlText = await resp.text();
  const parser = new XMLParser();
  const jsonObj = parser.parse(xmlText);

  const data = jsonObj.root.message.DISCondFuncListDTO;
  const _count = data.dbio_total_count_;

  const oneOrMany = data.selectMeta;
  const list = Array.isArray(oneOrMany)
    ? oneOrMany
    : oneOrMany
      ? [oneOrMany]
      : [];

  type Dto = {
    [key in `tmpV${number}`]: string | number;
  };

  const elements = list.map((x: Dto): Element => {
    const 운용회사 = x["tmpV1"] as string;
    const 펀드명 = x["tmpV2"] as string;
    const 펀드유형 = x["tmpV3"] as string;

    const 설정일Num = x["tmpV4"] as number;
    const 설정일 = MyDateMod.parse(설정일Num.toString());

    const 운용보수 = x["tmpV5"] as number;
    const 판매보수 = x["tmpV6"] as number;
    const 수탁보수 = x["tmpV7"] as number;
    const 사무관리보수 = x["tmpV8"] as number;
    const 보수합계 = x["tmpV9"] as number;
    const 유사유형평균보수율 = x["tmpV10"] as number;
    const 기타비용 = x["tmpV11"] as number;
    const TER = x["tmpV12"] as number;
    const 선취수수료 = x["tmpV13"] as number;
    const 후취수수료 = x["tmpV14"] as number;

    const 펀드코드 = x["tmpV15"] as string;
    const 매매중개수수료율 = x["tmpV16"] as number;

    return {
      운용회사,
      펀드명,
      펀드유형,
      설정일,
      펀드코드,
      운용보수,
      판매보수,
      수탁보수,
      사무관리보수,
      보수합계,
      유사유형평균보수율,
      기타비용,
      TER,
      선취수수료,
      후취수수료,
      매매중개수수료율,
    };
  });

  return elements;
};
