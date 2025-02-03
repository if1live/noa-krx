# noa-krx

KRX data fetcher

![kotama](./docs/image.webp)

| status                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![main](https://github.com/if1live/noa-krx/actions/workflows/main.yml/badge.svg)](https://github.com/if1live/noa-krx/actions/workflows/main.yml)                   |
| [![schedule](https://github.com/if1live/noa-krx/actions/workflows/schedule.yml/badge.svg)](https://github.com/if1live/noa-krx/actions/workflows/schedule.yml) |

## usage

```bash
pnpm tsx cli.ts etf --date 2025-02-03 --data-dir ../noa-krx-data/data_ETF
```

## branch
* [main](https://github.com/if1live/noa-krx/tree/main)
    * 크롤러 구현
* [data](https://github.com/if1live/noa-krx/tree/data)
    * CSV (필드 이름은 KRX에 맞춤)
    * ETF 전종목 기본정보
        * https://github.com/if1live/noa-krx/blob/data/data_ETF/전종목_기본정보.csv
    * ETF 전종목 시세
        * https://github.com/if1live/noa-krx/blob/data/data_ETF/전종목/2025-02-03.csv
    * ETF 개별종목 시세
        * https://github.com/if1live/noa-krx/blob/data/data_ETF/개별종목/102110_TIGER%20200.csv
