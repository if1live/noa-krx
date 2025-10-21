import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { Command } from "commander";
import * as R from "remeda";
import { z } from "zod";
import {
  createDateFileName,
  mkdirp,
  stringifyCSV,
  writeCSV,
} from "../helpers.ts";
import { logger } from "../instances.ts";
import * as api from "../krx/index.ts";
import { MyDateMod } from "../krx/mod.ts";
import type { MyDate, MyYear } from "../krx/types.ts";

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

const prepareDirectory = async (dataDir: string) => {
  // 연도별 디렉토리 미리 만들기. 뒤쪽에서 검증 안하려고
  // 연도 구분없이 폴더 하나에 다 넣으면 파일수가 수천개가 되어버려서 분리
  // 2002년부터 데이터 모으면 20년이상 * 365일 하면 숫자가 너무 커
  const todayYear = new Date().getFullYear();
  for (let year = 2002; year <= todayYear; year++) {
    const dir_etf = path.resolve(dataDir, "전종목", String(year));
    const dir_index = path.resolve(dataDir, "전체지수", String(year));

    await mkdirp(dir_etf);
    await mkdirp(dir_index);
  }
};

const main = async (input: Input) => {
  const { dataDir, startDate, endDate } = input;

  await prepareDirectory(dataDir);

  await fetchSummary(input);

  const total = MyDateMod.diffDay(startDate, endDate);
  for (
    let cursorDate = startDate, step = 1;
    cursorDate <= endDate;
    cursorDate = MyDateMod.addDay(cursorDate, 1), step++
  ) {
    const label = `ETF ${step}/${total}`;
    await fetchDate(input, cursorDate, label);
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

const fetchDate = async (input: Input, date: MyDate, label: string) => {
  const { dataDir, overwrite } = input;

  // 주말은 KRX 안열리니까 무시. 공휴일을 알아낼 방법이 마땅히 없어서 공휴일은 그냥 요청한다
  if (MyDateMod.isWeekendInKST(date)) {
    logger.info(`${label}: date=${date} weekend`);
    return;
  }

  const filename = createDateFileName(date);

  const parsed = MyDateMod.split(date);
  const year: MyYear = parsed[0];

  const fp_etf = path.resolve(dataDir, "전종목", year, filename);
  const fp_index = path.resolve(dataDir, "전체지수", year, filename);

  try {
    if (!overwrite) {
      const _stat = await fs.stat(fp_etf);
      logger.info(`${label}: date=${date} exists`);
      // 있으면 스킵. 데이터 갱신이 필요할 수 있음
      return;
    }
  } catch (_e) {
    //
  }

  const list = await api.ETF_전종목_시세.load({ date: date });
  await setTimeout(500);

  // 미래. 예외상황 대응용
  if (list.length === 0) {
    logger.info(`${label}: date=${date} count=0`);
    return;
  }

  // 공휴일이나 장이 열리지 않은 날은 레코드는 있지만 데이터가 전부 "-"
  if (Number.isNaN(list[0]?.시가)) {
    logger.info(`${label}: date=${date} count=${list.length} ignore`);
    return;
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
};

/*
const createProductFileName = (row: {
  단축코드: string;
  한글종목약명: string;
}) => {
  return `${row.단축코드}_${row.한글종목약명}.csv`;
};

const main = async (input: Input) => {
  const dataDir = input.dataDir;

  const rows = await api.ETF_전종목_기본정보.load({});
  logger.info(`ETF: 전종목 count=${rows.length}`);
  await setTimeout(500);

  const text = stringifyCSV(
    rows.map((row) => {
      // 자주 바뀌는 필드 버리기. 요약 정보에서는 없어도 될거같아서
      const { 상장좌수, ...rest } = row;
      return rest;
    }),
  );
  const fp = path.resolve(dataDir, "전종목_기본정보.csv");
  await writeCSV(fp, text);

  await fetchInitial(input, rows);
  await insertNewDate(input);
};

// ETF 상품 시세 한번에 채우기
const fetchInitial = async (
  input: Input,
  rows: api.ETF_전종목_기본정보.Element[],
) => {
  const dataDir = input.dataDir;

  for (const [idx, row] of rows.entries()) {
    const curr = idx + 1;
    const total = rows.length;
    const label = `ETF ${curr}/${total}`;

    const filename = createProductFileName(row);
    const fp = path.resolve(dataDir, "개별종목", filename);

    try {
      const exists = await fs.stat(fp);
      logger.info(`${label}: ${row.한글종목약명} ticker=${row.단축코드} skip`);
    } catch (e) {
      const elements = await api.ETF_개별종목_시세.load({
        isin: row.표준코드,
        startDate: row.상장일,
        endDate: "2025-02-01",
      });
      logger.info(`${label}: ${row.한글종목약명} ticker=${row.단축코드} fetch`);
      await setTimeout(500);

      const text = stringifyCSV(elements);
      await writeCSV(fp, text);
    }
  }
};

// 특정 날짜의 전종목 데이터 얻어서 한번에 적용
const insertNewDate = async (input: Input) => {
  const { dataDir, date } = input;

  const list = await api.ETF_전종목_시세.load({ date });
  if (list.length === 0) {
    logger.warn(`ETF: 전종목 count=0 date=${date}`);
    return;
  }
  if (Number.isNaN(list[0]?.시가)) {
    logger.warn(`ETF: 전종목 count=${list.length} date=${date} skip`);
    return;
  }

  const text = stringifyCSV(list);

  const filename = createDateFileName(date);
  const fp = path.resolve(dataDir, "전종목", filename);
  await writeCSV(fp, text);

  // 개별종목별로 데이터 추가하기
  for (const [idx, row] of list.entries()) {
    const curr = idx + 1;
    const total = list.length;
    const label = `ETF ${curr}/${total}`;

    const filename = createProductFileName({
      단축코드: row.단축코드,
      한글종목약명: row.종목명,
    });
    const fp = path.resolve(dataDir, "개별종목", filename);
    const text = await fs.readFile(fp, "utf-8");

    // \r\n 방지용으로 trim
    const lines = text.split("\n").map((x) => x.trim());
    assertNonEmptyArray(lines);
    const [line_header, ...lines_content] = lines;
    const headers = line_header.split(",");

    // 기초지수명같은곳에 ","가 들어가면서 무식한 csv 변환에서 함정 밟을수 있음
    // 안전을 위해서 csv 라이브러리를 거치도록 수정
    const nextElement: api.ETF_개별종목_시세.Element = {
      ...row,
      일자: date,
    };
    const nextEntries = headers.map((header) => {
      const value = (nextElement as unknown as Record<string, string>)[header];
      assert(value !== undefined);
      return [header, value] as const;
    });
    const nextRow = Object.fromEntries(nextEntries);
    const nextLine = stringifyCSV([nextRow]).split("\n")[1] ?? "";

    // 순자산총액 정보는 하루 지연되서 올라온다. 이를 반영하려면 기존 데이터도 덮어쓰는게 좋음
    const insertOrUpdate = text.includes(date) ? "update" : "insert";
    const nextLines =
      insertOrUpdate === "update"
        ? updateLine(lines, date, nextLine)
        : insertLine(lines, date, nextLine);

    const nextText = nextLines.join(os.EOL);
    await writeCSV(fp, nextText);
    logger.info(
      `${label}: ${row.종목명} ticker=${row.단축코드} ${insertOrUpdate}`,
    );
  }
};

const updateLine = (lines: string[], date: string, nextLine: string) => {
  const [line_header, ...lines_rest] = lines;
  const lines_content = lines_rest.map((line) => {
    return line.includes(date) ? nextLine : line;
  });
  const nextLines = [line_header, ...lines_content];
  return nextLines;
};

const insertLine = (lines: string[], date: string, nextLine: string) => {
  const [line_header, ...lines_content] = lines;
  const nextLines = [line_header, nextLine, ...lines_content];
  return nextLines;
};
*/
