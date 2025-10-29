import { parse } from "csv-parse/browser/esm/sync";

const sheetBaseUrl =
  "https://raw.githubusercontent.com/if1live/noa-krx/refs/heads/data";

const createSheetUrl = (dirname: string, filename: string) => {
  const naive = `${sheetBaseUrl}/${dirname}/${filename}`;
  return encodeURI(naive);
};

const displayBaseUrl = "https://github.com/if1live/noa-krx/blob/data";

const createDisplayUrl = (dirname: string, filename: string) => {
  const naive = `${displayBaseUrl}/${dirname}/${filename}`;
  return encodeURI(naive);
};

const path_etf = "data_ETF";
const path_kospi = "data_KOSPI";
const path_kosdaq = "data_KOSDAQ";

export const EtfSheetUrls = {
  전종목_기본정보: createSheetUrl(path_etf, "전종목_기본정보.csv"),
  전종목_보수비용: createSheetUrl(path_etf, "전종목_보수비용.csv"),
  전종목_시세: createSheetUrl(path_etf, "전종목_시세.csv"),
  전종목_종합: createSheetUrl(path_etf, "전종목_종합.csv"),
  전체지수_시세: createSheetUrl(path_etf, "전체지수_시세.csv"),
};

export const EtfDisplayUrls = {
  전종목_기본정보: createDisplayUrl(path_etf, "전종목_기본정보.csv"),
  전종목_보수비용: createDisplayUrl(path_etf, "전종목_보수비용.csv"),
  전종목_시세: createDisplayUrl(path_etf, "전종목_시세.csv"),
  전종목_종합: createDisplayUrl(path_etf, "전종목_종합.csv"),
  전체지수_시세: createDisplayUrl(path_etf, "전체지수_시세.csv"),
};

export const KospiSheetUrls = {
  전종목_기본정보: createSheetUrl(path_kospi, "전종목_기본정보.csv"),
  전종목_시세: createSheetUrl(path_kospi, "전종목_시세.csv"),
};

export const KospiDisplayUrls = {
  전종목_기본정보: createDisplayUrl(path_kospi, "전종목_기본정보.csv"),
  전종목_시세: createDisplayUrl(path_kospi, "전종목_시세.csv"),
};

export const KosdaqSheetUrls = {
  전종목_기본정보: createSheetUrl(path_kosdaq, "전종목_기본정보.csv"),
  전종목_시세: createSheetUrl(path_kosdaq, "전종목_시세.csv"),
};

export const KosdaqDisplayUrls = {
  전종목_기본정보: createDisplayUrl(path_kosdaq, "전종목_기본정보.csv"),
  전종목_시세: createDisplayUrl(path_kosdaq, "전종목_시세.csv"),
};

export const fetcher = (url: string, init?: RequestInit) =>
  fetch(url, init)
    .then(async (res) => {
      const text = res.text();
      return text ?? "";
    })
    .then((text) => {
      return parse(text, { columns: true });
    });
