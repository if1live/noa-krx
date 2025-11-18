import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import useSWRImmutable from "swr/immutable";
import z from "zod";
import { EtfDisplayUrls, EtfSheetUrls, fetcher } from "./urls";

const Row = z.object({
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
type Row = z.infer<typeof Row>;

export const EtfPage = () => {
  const { data, error, isLoading } = useSWRImmutable(
    EtfSheetUrls.전종목_종합,
    fetcher,
  );

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;

  const list = data ?? [];
  const rows = list.map((item) => Row.parse(item));

  return (
    <>
      <h2>ETF 종합</h2>
      <p>
        <a
          href="https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC020103010901"
          target="_blank"
          rel="noopener noreferrer"
        >
          KRX
        </a>
        {" | "}
        <a
          href={EtfDisplayUrls.전종목_종합}
          target="_blank"
          rel="noopener noreferrer"
        >
          github 전종목 종합
        </a>
        {" | "}
        <a
          href={EtfDisplayUrls.전종목_시세}
          target="_blank"
          rel="noopener noreferrer"
        >
          github 전종목 시세
        </a>
      </p>
      <LocalTable rows={rows} />
    </>
  );
};

const LocalTable = (props: { rows: Row[] }) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<Array<ColumnDef<Row>>>(
    () => [
      {
        accessorKey: "단축코드",
        size: 80,
        cell: (info) => {
          const code = info.getValue<string>();
          const url = `https://finance.naver.com/item/main.naver?code=${code}`;
          // const ticker = `${code}.KS`;
          // const url = `https://finance.yahoo.com/quote/${ticker}/`;
          return (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {code}
            </a>
          );
        },
      },
      {
        accessorKey: "한글종목약명",
        size: 350,
        cell: (info) => {
          const name = info.getValue<string>();
          const code = info.row.original.펀드코드;
          const url = `https://dis.kofia.or.kr/websquare/popup.html?w2xPath=/wq/com/popup/DISComFundSmryInfo.xml&standardCd=${code}`;
          return (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          );
        },
      },
      {
        accessorKey: "실부담비용률",
        cell: (info) => info.getValue<number>().toFixed(4),
      },
      /*
      {
        accessorKey: "과세유형",
        cell: (info) => {
          const text = info.getValue<string>();
          switch (text) {
            case "비과세":
              return "비과세";
            case "비과세(분리과세부동산ETF)":
              return "비과세X";
            case "배당소득세(보유기간과세)":
              return "배당소득세A";
            case "배당소득세(분리과세부동산ETF)":
              return "배당소득세B";
            case "배당소득세(해외주식투자전용ETF)":
              return "배당소득세C";
            default:
              return text;
          }
        },
      },
      */
      {
        accessorKey: "기초지수명",
        size: 600,
      },
      { accessorKey: "기초시장분류" },
      { accessorKey: "기초자산분류" },
    ],
    [],
  );

  const [data, _setData] = useState(props.rows);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const { rows } = table.getRowModel();

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="container">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - index * virtualRow.size
                    }px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
