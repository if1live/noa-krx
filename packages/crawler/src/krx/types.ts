export type MyYear = `${number}${number}${number}${number}`;
export type MyMonth = `${number}${number}`;
export type MyDayOfMonth = `${number}${number}`;
export type MyDate = `${MyYear}-${MyMonth}-${MyDayOfMonth}`;

export type 주가지수계열 = "KRX" | "KOSPI" | "KOSDAQ" | "테마";

export const 주가지수계열 = {
  field: "idxIndMidclssCd" as const,
  convertMidClass(midClass: 주가지수계열): string {
    switch (midClass) {
      case "KRX":
        return "01";
      case "KOSPI":
        return "02";
      case "KOSDAQ":
        return "03";
      case "테마":
        return "04";
    }
  },
};
