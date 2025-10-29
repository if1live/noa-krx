import z from "zod";

export const FusionRow = z.object({
  단축코드: z.string(),
  한글종목약명: z.string(),
  기초지수명: z.string(),
  기초시장분류: z.string(),
  기초자산분류: z.string(),
  총보수: z.coerce.number(),
  TER: z.coerce.number(),
  실부담비용률: z.coerce.number(),
  과세유형: z.string(),
  표준코드: z.string(),
  펀드코드: z.string(),
});
export type FusionRow = z.infer<typeof FusionRow>;
