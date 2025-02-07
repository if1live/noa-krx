import { z } from "zod";
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

export const addDay = (date: MyDate, days: number): MyDate => {
  const [y, m, d] = split(date);
  const dt = new Date(`${y}-${m}-${d}`);
  dt.setDate(dt.getDate() + days);

  const y0 = dt.getFullYear().toString() as MyYear;
  const m0 = (dt.getMonth() + 1).toString().padStart(2, "0") as MyMonth;
  const d0 = dt.getDate().toString().padStart(2, "0") as MyDayOfMonth;
  return `${y0}-${m0}-${d0}` as MyDate;
};

export const diffDay = (date1: MyDate, date2: MyDate): number => {
  const dt1 = new Date(date1);
  const dt2 = new Date(date2);
  const diff = dt2.getTime() - dt1.getTime();
  return diff / (1000 * 60 * 60 * 24);
};

export const schema = () =>
  z.custom<MyDate>((val) => {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    return typeof val === "string" ? re.test(val) : false;
  });

export const isWeekendInKST = (dateString: string): boolean => {
  // 주어진 날짜를 KST (UTC+9) 기준으로 변환
  const date = new Date(dateString);

  // KST 기준으로 변환 (UTC+9 적용)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  // 요일 확인 (0: 일요일, 6: 토요일)
  const dayOfWeek = kstDate.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};
