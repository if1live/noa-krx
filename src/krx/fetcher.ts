import { setTimeout } from "node:timers/promises";
import { z } from "zod";
import { logger } from "../instances.ts";
import { MyDateMod } from "./mod.ts";
import type { MyDate } from "./types.ts";

const headers = {
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Accept: "application/json",
  "Accept-Encoding": "gzip, deflate",
  "User-Agent": "Mozilla/5.0",
  Referer: "http://data.krx.co.kr/",
};

export const fetch_webio = async (data: Record<string, string | number>) => {
  const params = data as Record<string, string>;
  const urlEncodedData = new URLSearchParams(params).toString();
  const url = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd";

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: urlEncodedData,
  });

  const json = await resp.json();
  return json;
};

export const fetch_range = async (
  input: Record<string, string | number>,
  startDate: MyDate,
  endDate: MyDate,
) => {
  let list: Array<Record<string, string>> = [];

  // 2년 단위로 잘라서 요청. 365*2 = 730
  const maxDay = 730;

  let remain = MyDateMod.diffDay(startDate, endDate);
  let cursorStartDate = startDate;

  const schema = z.object({
    isuCd: z.any(),
    bld: z.any(),
  });
  const paresd = schema.parse(input);

  while (remain > 0) {
    const range = Math.min(remain, maxDay);

    // range=1이라고 해도 2일치를 읽는다 (startDate, endDate 포함이니까)
    // 1일씩 더 읽게 되니까 remain 계산에서 1을 뺀다
    const cursorEndDate = MyDateMod.addDay(cursorStartDate, range);
    const params = {
      ...input,
      strtDd: MyDateMod.marshal(cursorStartDate, ""),
      endDd: MyDateMod.marshal(cursorEndDate, ""),
    };

    const json = await fetch_webio(params);
    logger.info(
      {
        isin: paresd.isuCd,
        bld: paresd.bld,
        cursorStartDate,
        cursorEndDate,
      },
      "fetch_range",
    );
    const data = json as {
      output: Record<string, string>[];
      CURRENT_DATETIME: string;
    };

    // 검색결과는 최신 데이터가 위로 배치된다
    // CSV로 작성시 맨뒤에 한줄씩 붙이면 되니까 시간 오름차순이 성능상 유리하지만
    // 관심있는 정보는 맨뒤에 아니라 맨 앞이 일반적이다.
    list = [...data.output, ...list];

    // 다음 루프 준비
    remain = remain - (range + 1);
    cursorStartDate = MyDateMod.addDay(cursorEndDate, 1);

    // 대기 시간은 고정하고 싶지 않아서
    if (remain > 0) {
      if (data.output.length > 0) {
        const millis = Math.random() * 500 + 200;
        await setTimeout(millis);
      } else {
        // 검색 결과 없을때의 대기시간은 짧게 해도 되지 않을까?
        await setTimeout(100);
      }
    }
  }

  return list;
};
