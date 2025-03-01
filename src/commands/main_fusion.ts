import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import * as R from "remeda";
import { z } from "zod";
import { readCSV, stringifyCSV, writeCSV } from "../helpers.ts";
import { logger } from "../instances.ts";

export const Input = z.object({
  dataDir: z.string(),
});
type Input = z.infer<typeof Input>;

export const program = new Command("fusion");
program
  .requiredOption("--data-dir <dataDir>", "data directory")
  .action(async (opts: unknown) => {
    const input = Input.parse(opts);
    await main(input);
  });

const InfoRow = z.object({
  표준코드: z.string(),
  단축코드: z.string(),
  한글종목명: z.string(),
  한글종목약명: z.string(),
  영문종목명: z.string(),
  상장일: z.string(),
  기초지수명: z.string(),
  지수산출기관: z.string(),
  추적배수: z.string(),
  복제방법: z.string(),
  기초시장분류: z.string(),
  기초자산분류: z.string(),
  운용사: z.string(),
  CU수량: z.coerce.number(),
  총보수: z.coerce.number(),
  과세유형: z.string(),
});
type InfoRow = z.infer<typeof InfoRow>;

const FeeRow = z.object({
  펀드명: z.string(),
  펀드유형: z.string(),
  설정일: z.string(),
  펀드코드: z.string(),
  운용보수: z.coerce.number(),
  판매보수: z.coerce.number(),
  수탁보수: z.coerce.number(),
  사무관리보수: z.coerce.number(),
  보수합계: z.coerce.number(),
  유사유형평균보수율: z.coerce.number(),
  기타비용: z.coerce.number(),
  TER: z.coerce.number(),
  선취수수료: z.coerce.number(),
  후취수수료: z.coerce.number(),
  매매중개수수료율: z.coerce.number(),
});
type FeeRow = z.infer<typeof FeeRow>;

const main = async (input: Input) => {
  const { dataDir } = input;

  const feeTable = await loadFeeTable(input);

  const infoCsvFp = path.resolve(dataDir, "전종목_기본정보.csv");
  const infoNaiveRows = await readCSV(infoCsvFp);
  const infoRows = infoNaiveRows.map((x: unknown) => InfoRow.parse(x));

  const rows = infoRows
    .map((info) => ({ info, fee: findFee(feeTable, info) }))
    .map(({ info, fee }) => {
      if (!fee) return;
      return { info, fee };
    })
    .filter(R.isNonNullish);

  const records = rows.map(({ info, fee }) => {
    const {
      표준코드,
      단축코드,
      한글종목약명,
      기초지수명,
      기초시장분류,
      기초자산분류,
      과세유형,
      총보수,
    } = info;
    const { 펀드코드, TER, 매매중개수수료율 } = fee;
    const 실부담비용률 = TER + 매매중개수수료율;
    return {
      단축코드,
      한글종목약명,
      기초지수명,
      기초시장분류,
      기초자산분류,
      총보수: 총보수.toFixed(4),
      TER: TER.toFixed(4),
      실부담비용률: 실부담비용률.toFixed(4),
      과세유형,
      표준코드,
      펀드코드,
    };
  });

  logger.info(`fusion: count=${records.length}`);

  const text = stringifyCSV(records);
  const fp = path.resolve(dataDir, "전종목_종합.csv");
  await writeCSV(fp, text);
};

const sanitizeTitle = (title: string) => {
  let candidate = title;

  // kofia에서 사용되는 이름은 공백이 없는데 krx에는 공백이 포함된다
  candidate = candidate.replaceAll(" ", "");

  // KRX  : 한화 PLUS 주도업종증권상장지수투자신탁[주식]
  // KOFIA: 한화PLUS주도업종증권상장지수투자신탁(주식)
  // 괄호 정책이 미묘하게 다를수 있어서 한쪽으로 맞춤. () -> []
  candidate = candidate.replaceAll("(", "[").replaceAll(")", "]");

  const entries: Array<[string, string]> = [
    // KBRISE중국본토대형주CSI100증권상장지수자투자신탁(주식) -> 상장지수자투자신탁?
    ["상장지수자투자신탁", "상장지수투자신탁"],
    // 미래에셋TIGER글로벌AI사이버보안INDXX증권상장지수투자신탁(주식) -> INDXX?
    ["INDXX", ""],

    // KRX  : 한화 PLUS KOSPI 증권상장지수투자신탁
    // KOFIA: 한화PLUS코스피증권상장지수투자신탁(주식)
    ["KOSPI", "코스피"],

    // KRX  : 삼성 KODEX 게임산업증권상장지수투자신탁[주식]
    // KOFIA: 삼성KODEX게임산업증권상장지수투자신탁[주식형]
    // 주식형, 채권형, .. 같은거 정규화
    ["-재간접]", "-재간접형]"],
    ["[주식-파생형]", "[파생형]"],
    ["[주식]", "[주식형]"],
    ["[채권]", "[채권형]"],
  ];
  for (const [from, to] of entries) {
    candidate = candidate.replace(from, to);
  }

  // KRX  : 삼성 KODEX 미국종합채권ESG액티브증권상장지수투자신탁(H)[채권]
  // KOFIA: 삼성KODEX미국종합채권ESG액티브증권상장지수투자신탁[채권](H)
  // 헷지 붙는 순서가 바뀔수 있다. 항상 맨 붙도록 조정
  if (candidate.includes("[H]")) {
    candidate = `${candidate.replace("[H]", "")}[H]`;
  }

  // KRX  : 삼성 KODEX 미국S&P500배당귀족커버드콜증권상장지수투자신탁[주식-파생형](합성 H)
  // KOFIA: 삼성KODEX미국S&P500배당귀족커버드콜증권상장지수투자신탁[주식-파생형](합성)(H)
  candidate = candidate.replace("[합성H]", "[합성][H]");

  // KRX  : 한국투자 ACE 인도시장대표BIG5그룹액티브증권상장지수투자신탁(주식)
  // KOFIA: 한국투자ACE인도시장대표Big5그룹액티브증권상장지수투자신탁(주식)
  // 대소문자 문제 피하기
  candidate = candidate.toUpperCase();

  // KRX  : 삼성 KODEX 200대형증권상장지수투자신탁(주식) = KODEX 코스피100 (237350)
  // KOFIA: 삼성KODEX코스피100증권상장지수투자신탁[주식][K55105B98537]
  // 펀드 이름과 상장 이름의 차이가 너무 다르면 추정하기 어려워서 포기
  //
  // KRX  : 미래에셋 TIGER 금속선물 특별자산상장지수투자신탁(금속-파생형) = TIGER 금속선물(H) (139310)
  // KOFIX: 미래에셋TIGER금속선물특별자산상장지수투자신탁(금속-파생형)(H)[KR5225A17093]
  // 헷지 정보 붙는 방식이 다를수 있다.
  //
  // KRX  : 삼성KODEX미국바이오테크증권상장지수투자신탁[주식-파생형](합성) = KODEX 미국S&P바이오(합성) (185680)
  // KOFIX: 삼성KODEX합성-미국 바이오테크증권상장지수투자신탁[주식-파생형][KR5105AL9630]
  // "합성" 표시 붙는 위치가 다를 수 있다.
  //
  // KRX  : 에셋플러스 에셋플러스 인도일등기업포커스20액티브증권상장지수투자신탁(주식) = 에셋플러스 인도일등기업포커스20액티브 (0002C0)
  // KRX에서 투자설명서를 찾으면 [펀드코드 : ED487]
  // KOFIX에서는 "ED487"로는 검색하면 "에셋플러스 에셋플러스 인도일등기업 포커스20액티브증권상장지수투자신탁(주식)[K55364ED4870]"
  // 하지만 보수비용 조회에서는 검색되지 않는다! 운용개시일이 "2025/02/21"라서 "2023/03/01"에는 안보인다
  //
  // 여러가지 이슈때문에 모든 경우의 맵핑은 포기
  // 제대로 맵핑하려면 KRX에서 찾은 투자설명서에서 "펀드코드" 하나씩 찾아야하는데 이건 너무 노가다같아서 포기
  // 25/03/01 기준으로 전체 941개 중 50개 맵핑에 실패함. 그래도 뻔한건 맵핑 되어있으니까 심각한 문제는 없을듯?
  return candidate;
};

const loadFeeTable = async (input: Input) => {
  const { dataDir } = input;
  const fp = path.resolve(dataDir, "전종목_보수비용.csv");
  const naiveRows = await readCSV(fp);
  const rows = naiveRows.map((x: unknown) => FeeRow.parse(x));
  const entries = rows.map((row) => {
    const title = sanitizeTitle(row.펀드명);
    return [title, row] as const;
  });
  return new Map(entries);
};

const findFee = (table: Map<string, FeeRow>, info: InfoRow) => {
  const candidate = sanitizeTitle(info.한글종목명);
  const found = table.get(candidate);
  if (!found) {
    logger.info(`fee not found: [${info.단축코드}] ${info.한글종목명}`);
    return;
  }
  return found;
};
