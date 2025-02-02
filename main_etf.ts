import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { stringify } from "csv-stringify/sync";
import { api } from "./src/index.js";
import { logger } from "./src/instances.js";

const main_ETF = async () => {
  const rows = await api.ETF_전종목_기본정보.load({});
  logger.info(`ETF: 전종목 count=${rows.length}`);
  await setTimeout(500);

  const text = stringify(rows, { header: true });
  const fp = path.resolve("data_ETF/전종목_기본정보.csv");
  await fs.writeFile(fp, text);

  for (const [idx, row] of rows.entries()) {
    const curr = idx + 1;
    const total = rows.length;
    const label = `ETF ${curr}/${total}`;

    const name = `${row.단축코드}_${row.한글종목약명}`;
    const fp = path.resolve(`data_ETF/개별지수/${name}.csv`);

    try {
      const exists = await fs.stat(fp);
      logger.info(`${label}: ${row.한글종목약명} ticker=${row.단축코드} skip`);
    } catch (e) {
      const elements = await api.ETF_개별종목_시세.load({
        isuCd: row.표준코드,
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

await main_ETF();
