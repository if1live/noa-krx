import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { Command } from "commander";
import { z } from "zod";
import {
  createDateFileName,
  mkdirp,
  stringifyCSV,
  writeCSV,
} from "../helpers.js";
import { logger } from "../instances.js";
import * as api from "../krx/index.js";
import { MyDateMod } from "../krx/mod.js";
import type { MyDate, MyYear } from "../krx/types.js";

export const Input = z.object({
  dataDir: z.string(),
  startDate: MyDateMod.schema(),
  endDate: MyDateMod.schema(),
  overwrite: z.coerce.boolean(),
  market: z.union([z.literal("kospi"), z.literal("kosdaq")]),
});
type Input = z.infer<typeof Input>;

// 임의로 시작점 잡음. 너무 과거부터 보는건 큰 의미 없을거같아서
// 2008년은 범위에 넣고싶었다
const initialDate: MyDate = "2005-01-01";

export const program = new Command("stock");
program
  .requiredOption("--data-dir <dataDir>", "data directory")
  .requiredOption("--start-date <date>", "date kst", initialDate)
  .requiredOption("--end-date <date>", "date kst")
  .requiredOption("--market <market>", "market")
  .option("--overwrite")
  .action(async (opts: unknown) => {
    const input = Input.parse(opts);
    await main(input);
  });

const prepareDirectory = async (dataDir: string) => {
  const todayYear = new Date().getFullYear();
  for (let year = 2002; year <= todayYear; year++) {
    const dir = path.resolve(dataDir, "전종목", String(year));
    await mkdirp(dir);
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
    const label = `stock ${step}/${total}`;
    await fetchDate(input, cursorDate, label);
  }
};

const marketTable = {
  kospi: "STK",
  kosdaq: "KSQ",
} as const;

// 표준코드때문에 전체 목록을 한번 읽어야한다
const fetchSummary = async (input: Input) => {
  const dataDir = input.dataDir;

  const mktId = marketTable[input.market];
  const rows = await api.주식_전종목_기본정보.load({ mktId });
  logger.info(`stock: 전종목 count=${rows.length}`);
  await setTimeout(500);

  const text = stringifyCSV(rows);
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

  const fp = path.resolve(dataDir, "전종목", year, filename);

  try {
    if (!overwrite) {
      const stat = await fs.stat(fp);
      logger.info(`${label}: date=${date} exists`);
      // 있으면 스킵. 데이터 갱신이 필요할 수 있음
      return;
    }
  } catch (e) {
    //
  }

  const mktId = marketTable[input.market];
  const list = await api.주식_전종목_시세.load({ date: date, mktId });
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
    const { 표준코드: _drop_표준코드, ...rest } = row;
    return rest;
  });

  const text = stringifyCSV(rows);
  await writeCSV(fp, text);
  logger.info(`${label}: date=${date} count=${list.length} save`);
};
