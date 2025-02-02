import { MyDateMod } from "./mod.js";
import type { MyDate } from "./types.js";

const parse_decimal = (value: string) => {
  return Number(value.replace(/,/g, ""));
};

const parse_nullishDecimal = (value: string | undefined) => {
  if (value === "-") {
    return undefined;
  }
  return value !== undefined ? parse_decimal(value) : undefined;
};

type SignParseFn = (r: Record<string, string>) => number;
type DecimalParseFn = (r: Record<string, string>) => number;
type StringParseFn = (r: Record<string, string>) => string;
type DateParseFn = (r: Record<string, string>) => MyDate;

export const prepareSign = (key: string): SignParseFn => {
  return (data) => {
    const candidate = data[key];
    switch (candidate) {
      case "0":
        // "465780/마이티 26-09 특수채(AAA)액티브" 2024/07/19에서 발견됨
        // 어떤 거래도 일어나지 않았다
        return +1;
      case "1":
        return +1;
      case "2":
        return -1;
      case "3":
        return 0;
      case "4":
        // 상한가. "159800/마이티 코스피100" 2024/01/19 에서 발견됨. 등락률 29.99
        return 1;
      case "5":
        // 하한가. "130680/TIGER 원유선물Enhanced(H)" 2020/03/09 에서 발견됨. 등락률 -29.98
        return -1;
      case "":
        // "400590/SOL 글로벌탄소배출권선물ICE(합성)" 2023/09/25 기초지수에서 발견됨
        // 지수명은 있는데 종가, 대비, 등략률 전부 비어있다. 기초지수가 리셋되었나?
        return 0;
      case undefined:
        throw new Error(`Cannot find key: ${key}`);
      default:
        console.log(data);
        throw new Error(`Unknown value: [${candidate}]`);
    }
  };
};

export const prepareDecimal = (key: string): DecimalParseFn => {
  return (data) => {
    const candidate = data[key];
    if (candidate === undefined) {
      throw new Error(`Cannot find key: ${key}`);
    }
    return parse_decimal(candidate);
  };
};

export const prepareString = (key: string): StringParseFn => {
  return (data) => {
    const candidate = data[key];
    if (candidate === undefined) {
      throw new Error(`Cannot find key: ${key}`);
    }
    return candidate;
  };
};

export const prepareDate = (key: string): DateParseFn => {
  return (data) => {
    const candidate = data[key];
    if (candidate === undefined) {
      throw new Error(`Cannot find key: ${key}`);
    }
    return MyDateMod.parse(candidate);
  };
};
