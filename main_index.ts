import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { stringify } from "csv-stringify/sync";
import { api } from "./src/index.js";
import { logger } from "./src/instances.js";
import type { 주가지수계열 } from "./src/types.js";

const main_주가지수 = async () => {
  const list_midclass: 주가지수계열[] = ["KRX", "KOSPI", "KOSDAQ", "테마"];
  const tasks = list_midclass.map(async (주가지수계열) => {
    const elements = await api.주가지수_전체지수_기본정보.load({
      계열구분: 주가지수계열,
    });
    logger.info(`주가지수: ${주가지수계열}, count=${elements.length}`);
    await setTimeout(500);
    return [주가지수계열, elements] as const;
  });
  const results = await Promise.all(tasks);

  const rows = [];
  for (const [계열구분, elements] of results) {
    const list = elements.map((data) => {
      return { ...data, 계열구분 };
    });
    rows.push(...list);
  }
  const text = stringify(rows, { header: true });
  const fp = path.resolve("data_주가지수/전체지수_기본정보.csv");
  await fs.writeFile(fp, text);

  for (const [idx, row] of rows.entries()) {
    const curr = idx + 1;
    const total = rows.length;
    const label = `주가지수 ${curr}/${total}`;

    const { indIdx, indIdx2 } = row;

    // "코스피 200 에너지/화학" 같은거때문에 '/' 처리해야함
    const name = `${indIdx}_${indIdx2}_${row.지수명.replace(/\//g, "")}`;
    const fp = path.resolve(`data_주가지수/개별지수/${name}.csv`);

    try {
      const exists = await fs.stat(fp);
      logger.info(`${label}: ${row.지수명} id=${indIdx}/${indIdx2} skip`);
    } catch (e) {
      // "코스피 200"의 경우 1975년 데이터도 있다.
      // 근데 전체지수 기본정보로는 시작일을 정확히 모르겠다.
      // ETF의 시작점 (20021014)와 맞추기로 한다.
      const startDate = "2002-10-14";
      const elements = await api.주가지수_개별지수_시세.load({
        indIdx,
        indIdx2,
        startDate,
        endDate: "2025-02-01",
      });
      logger.info(`${label}: ${row.지수명} id=${indIdx}/${indIdx2} fetch`);
      await setTimeout(500);

      const text = stringify(elements, { header: true });
      await fs.writeFile(fp, text);
    }
  }
};

await main_주가지수();
