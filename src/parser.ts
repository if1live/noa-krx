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

type DecimalParseFn = (r: Record<string, string>) => number;
type StringParseFn = (r: Record<string, string>) => string;
type DateParseFn = (r: Record<string, string>) => MyDate;

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
