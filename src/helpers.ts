import fs from "node:fs/promises";
import { type Options, stringify } from "csv-stringify/sync";

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
