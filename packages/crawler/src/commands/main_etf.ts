import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { Command } from "commander";
import * as R from "remeda";
import { z } from "zod";
import { stringifyCSV, writeCSV } from "../helpers.ts";
import { logger } from "../instances.ts";
import * as api from "../krx/index.ts";
import { MyDateMod } from "../krx/mod.ts";
import type { MyDate } from "../krx/types.ts";

export const Input = z.object({
  dataDir: z.string(),
  startDate: MyDateMod.schema(),
  endDate: MyDateMod.schema(),
  overwrite: z.coerce.boolean(),
});
type Input = z.infer<typeof Input>;

// KRX ETF의 시작점
const initialDate: MyDate = "2002-10-14";

export const program = new Command("etf");
program
  .requiredOption("--data-dir <dataDir>", "data directory")
  .requiredOption("--start-date <date>", "date kst", initialDate)
  .requiredOption("--end-date <date>", "date kst")
  .option("--overwrite")
  .action(async (opts: unknown) => {
    const input = Input.parse(opts);
    await main(input);
  });

const main = async (input: Input) => {
  const { startDate, endDate } = input;

  await fetchSummary(input);

  const total = MyDateMod.diffDay(startDate, endDate);

  // 날짜는 역순으로 처리. 가장 최근에 채워진 값을 우선적으로 사용
  for (
    let cursorDate = endDate, step = 1;
    cursorDate >= startDate;
    cursorDate = MyDateMod.addDay(cursorDate, -1), step++
  ) {
    const label = `ETF ${step}/${total}`;
    const count = await fetchDate(input, cursorDate, label);
    if (count > 0) {
      break;
    }
  }
};

const fetchSummary = async (input: Input) => {
  const dataDir = input.dataDir;

  const rows = await api.ETF_전종목_기본정보.load({});
  logger.info(`ETF: 전종목 count=${rows.length}`);
  await setTimeout(500);

  const text = stringifyCSV(
    rows.map((row) => {
      // 자주 바뀌는 필드 버리기. 요약 정보에서는 없어도 될거같아서
      const { 상장좌수: _상장좌수, ...rest } = row;
      return rest;
    }),
  );
  const fp = path.resolve(dataDir, "전종목_기본정보.csv");
  await writeCSV(fp, text);
};

const fetchDate = async (
  input: Input,
  date: MyDate,
  label: string,
): Promise<number> => {
  const { dataDir, overwrite } = input;

  // 주말은 KRX 안열리니까 무시. 공휴일을 알아낼 방법이 마땅히 없어서 공휴일은 그냥 요청한다
  if (MyDateMod.isWeekendInKST(date)) {
    logger.info(`${label}: date=${date} weekend`);
    return 0;
  }

  const fp_etf = path.resolve(dataDir, "전종목_시세.csv");
  const fp_index = path.resolve(dataDir, "전체지수_시세.csv");

  try {
    if (!overwrite) {
      const _stat = await fs.stat(fp_etf);
      logger.info(`${label}: date=${date} exists`);
      // 있으면 스킵. 데이터 갱신이 필요할 수 있음
      return 0;
    }
  } catch (_e) {
    //
  }

  const list = await api.ETF_전종목_시세.load({ date: date });
  await setTimeout(500);

  // 미래. 예외상황 대응용
  if (list.length === 0) {
    logger.info(`${label}: date=${date} count=0`);
    return 0;
  }

  // 공휴일이나 장이 열리지 않은 날은 레코드는 있지만 데이터가 전부 "-"
  if (Number.isNaN(list[0]?.시가)) {
    logger.info(`${label}: date=${date} count=${list.length} ignore`);
    return 0;
  }

  // 전종목 데이터 저장
  const rows = list.map((row) => {
    // 순자산총액은 하루씩 밀려서 데이터가 보인다.
    // 오늘 장마감해도 오늘 데이터는 0으로 나온다. 이전날 데이터부터 제대로 보인다.
    const {
      기초지수_지수명,
      기초지수_종가,
      기초지수_대비,
      기초지수_등락률,
      종목코드: _종목코드,
      순자산총액: _순자산총액,
      ...row_etf
    } = row;

    // 기초지수를 크롤링할 마땅한곳을 못찾았다.
    // 그래서 개별데이터에서 기초지수를 뜯어냈다.
    const row_index = {
      지수명: 기초지수_지수명,
      종가: 기초지수_종가,
      대비: 기초지수_대비,
      등락률: 기초지수_등락률,
    };

    return [row_etf, row_index] as const;
  });

  const rows_etf = rows.map((x) => x[0]);

  // 코스피200을 기초지수로 쓰는 ETF는 여러개 있을것이니까 중복 처리
  const rows_index = R.pipe(
    rows,
    R.map((x) => x[1]),
    R.uniqueBy((x) => x.지수명),
  );

  const text_etf = stringifyCSV(rows_etf);
  await writeCSV(fp_etf, text_etf);

  const text_index = stringifyCSV(rows_index);
  await writeCSV(fp_index, text_index);

  logger.info(`${label}: date=${date} count=${list.length} save`);
  return list.length;
};
