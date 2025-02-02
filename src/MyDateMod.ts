import type { MyDate, MyDayOfMonth, MyMonth, MyYear } from "./types.js";

const re_simple = /^(\d{4})(\d{2})(\d{2})$/;
const re_sep = /^(\d{4})[-./](\d{2})[-./](\d{2})$/;

export const parse = (input: string): MyDate => {
  let match: RegExpExecArray | null = null;
  if (input.length === 8) {
    match = re_simple.exec(input);
  } else if (input.length === 10) {
    match = re_sep.exec(input);
  }

  if (!match) {
    throw new Error(`Invalid date format: ${input}`);
  }

  const y = match[1] as MyYear;
  const m = match[2] as MyMonth;
  const d = match[3] as MyDayOfMonth;
  return `${y}-${m}-${d}`;
};

export const split = (date: MyDate): [MyYear, MyMonth, MyDayOfMonth] => {
  const [y, m, d] = date.split("-") as [MyYear, MyMonth, MyDayOfMonth];
  return [y, m, d];
};

export const marshal = (date: MyDate, sep: string): string => {
  const tokens = split(date);
  return tokens.join(sep);
};
