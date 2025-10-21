import path from "node:path";
import { Command } from "commander";
import { z } from "zod";
import { stringifyCSV, writeCSV } from "../helpers.ts";
import { logger } from "../instances.ts";
import * as api from "../kofia/index.ts";
import { MyDateMod } from "../krx/mod.ts";
import type { MyDate } from "../krx/types.ts";

export const Input = z.object({
  dataDir: z.string(),
});
type Input = z.infer<typeof Input>;

export const program = new Command("kofia");
program
  .requiredOption("--data-dir <dataDir>", "data directory")
  .action(async (opts: unknown) => {
    const input = Input.parse(opts);
    await main(input);
  });

const main = async (input: Input) => {
  const { dataDir } = input;

  // 2025-03-01 조회했을때의 결과
  // 지난달 마지막날은 2025-02-28 인데 조회하면 안나온다
  // 2025-01-31로 조회해야 결과물이 나온다.
  // 이런 문제를 피하려고 과거를 2개 이상 조회한다.
  const now = new Date();
  for (let i = 1; i < 4; i++) {
    const past = getLastDayOfMonth(now, i);
    const y = past.year;
    const m = past.month.toString().padStart(2, "0");
    const d = past.day.toString().padStart(2, "0");
    const date = MyDateMod.parse(`${y}-${m}-${d}`);
    const result = await fetchSummary({ dataDir, date });
    if (result) {
      break;
    }
  }
};

const fetchSummary = async (input: { dataDir: string; date: MyDate }) => {
  const { dataDir, date } = input;
  const rows = await api.펀드별_보수비용비교.load({
    date,
    name: "상장지수",
  });
  logger.info(`kofia: date=${date} count=${rows.length}`);
  if (rows.length === 0) {
    return false;
  }

  const records = rows.map((row) => {
    const { 운용회사: _운용회사, ...rest } = row;
    return rest;
  });
  const text = stringifyCSV(records);
  const fp = path.resolve(dataDir, "전종목_보수비용.csv");
  await writeCSV(fp, text);
  return true;
};

const getLastDayOfMonth = (now: Date, past: number) => {
  const month = now.getMonth() - past + 1;
  const lastDay = new Date(now.getFullYear(), month, 0);
  return {
    year: lastDay.getFullYear(),
    month: lastDay.getMonth() + 1,
    day: lastDay.getDate(),
    date: lastDay,
  };
};
