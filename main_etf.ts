import fs from "node:fs/promises";
import { z } from "zod";
import { program } from "commander";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { stringify } from "csv-stringify/sync";
import { api } from "./src/index.js";
import { logger } from "./src/instances.js";

const input = z.object({
  dataDir: z.string(),
});
type Input = z.infer<typeof input>;

program.requiredOption("--data-dir", "data directory", "data_ETF");

const main = async (input: Input) => {
  const dataDir = input.dataDir;

  const rows = await api.ETF_전종목_기본정보.load({});
  logger.info(`ETF: 전종목 count=${rows.length}`);
  await setTimeout(500);

  const text = stringify(rows, { header: true });
  const fp = path.resolve(dataDir, "전종목_기본정보.csv");
  await fs.writeFile(fp, text);

  for (const [idx, row] of rows.entries()) {
    const curr = idx + 1;
    const total = rows.length;
    const label = `ETF ${curr}/${total}`;

    const name = `${row.단축코드}_${row.한글종목약명}`;
    const fp = path.resolve(dataDir, "개별지수", `${name}.csv`);

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

      const text = stringify(elements, { header: true });
      await fs.writeFile(fp, text);
    }
  }
};

program.parse();
const options = input.parse(program.opts());
await main(options);
