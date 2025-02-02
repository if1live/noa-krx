import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { assert } from "@toss/assert";
import { program } from "commander";
import { type Options, stringify } from "csv-stringify/sync";
import { z } from "zod";
import { api } from "./src/index.js";
import { logger } from "./src/instances.js";
import type { MyDate } from "./src/types.js";

const options: Options = {
  header: true,
  cast: {
    number: (value) => (Number.isNaN(value) ? "" : value.toString()),
  },
};

const Input = z.object({
  dataDir: z.string(),
});
type Input = z.infer<typeof Input>;

program.requiredOption("--data-dir", "data directory", "data_ETF");

const createDateFileName = (date: MyDate) => {
  return `${date}.csv`;
};

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

  const text = stringify(rows, options);
  const fp = path.resolve(dataDir, "전종목_기본정보.csv");
  await fs.writeFile(fp, text);

  await fetchInitial(input, rows);
  await insertNewDate(input);
};

/** ETF 상품 시세 한번에 채우기 */
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

      const text = stringify(elements, options);
      await fs.writeFile(fp, text);
    }
  }
};

/** 특정 날짜의 전종목 데이터 얻어서 한번에 적용 */
const insertNewDate = async (input: Input) => {
  const dataDir = input.dataDir;

  const date = "2025-02-01";
  const list = await api.ETF_전종목_시세.load({ date });
  if (list.length === 0) {
    logger.warn(`ETF: 전종목 count=0 date=${date}`);
    return;
  }
  if (Number.isNaN(list[0].시가)) {
    logger.warn(`ETF: 전종목 count=${list.length} date=${date} skip`);
    return;
  }

  const text = stringify(list, options);

  const filename = createDateFileName(date);
  const fp = path.resolve(dataDir, "전종목", filename);
  await fs.writeFile(fp, text);

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

    // 날짜 정보가 포함되어있으면 이미 처리된 데이터이므로 넘김
    if (text.includes(date)) {
      continue;
    }

    // \r\n 방지용으로 trim
    const lines = text.split("\n").map((x) => x.trim());
    const [line_header, ...lines_content] = lines;
    const headers = line_header.split(",");

    // csv로 바꿔서 끼워넣기. 좀 무식하지만 csv 규격 안바꾼다면 문제 없음
    const nextRow: api.ETF_개별종목_시세.Element = {
      ...row,
      일자: date,
    };
    const nextLine = headers
      .map((header) => {
        const value = (nextRow as unknown as Record<string, string>)[header];
        assert(value !== undefined);
        return value;
      })
      .join(",");

    const nextLines = [line_header, nextLine, ...lines_content];
    const nextText = nextLines.join("\n");
    await fs.writeFile(fp, nextText);
    logger.info(`${label}: ${row.종목명} ticker=${row.단축코드} insert`);
  }
};

program.parse();

const input = Input.parse(program.opts());
await main(input);
