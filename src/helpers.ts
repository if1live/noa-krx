import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { type Options, stringify } from "csv-stringify/sync";
import type { MyDate } from "./krx/types.ts";

const options: Options = {
  header: true,
  cast: {
    number: (value) => (Number.isNaN(value) ? "" : value.toString()),
  },
};

export const stringifyCSV = (rows: unknown[]) => {
  return stringify(rows, options);
};

export const writeCSV = async (fp: string, text: string) => {
  const BOM = "\uFEFF";
  await fs.writeFile(fp, BOM + text, "utf-8");
};

export const readCSV = async (fp: string): Promise<unknown[]> => {
  const text = await fs.readFile(fp, "utf-8").then((x) => x.trimStart());
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
  });
};

export const createDateFileName = (date: MyDate) => {
  return `${date}.csv`;
};

export const mkdirp = async (dir: string) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (_e) {
    //
  }
};
