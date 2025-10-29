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
type Row = z.infer<typeof Row>;

export const KofiaPage = () => {
  const { data, error, isLoading } = useSWRImmutable(
    EtfSheetUrls.전종목_보수비용,
    fetcher,
  );

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;

  const list = data ?? [];
  const rows = list.map((item) => Row.parse(item));

  return (
    <>
      <h2>KOFIA 펀드별 보수비용비교</h2>
      <p>
        <a
          href="https://dis.kofia.or.kr/websquare/index.jsp?w2xPath=/wq/fundann/DISFundFeeCMS.xml&divisionId=MDIS01005001000000&serviceId=SDIS01005001000"
          target="_blank"
          rel="noopener noreferrer"
        >
          kofia
        </a>
        {" | "}
        <a
          href={EtfDisplayUrls.전종목_보수비용}
          target="_blank"
          rel="noopener noreferrer"
        >
          github
        </a>
      </p>
      <KofiaTable rows={rows} />
    </>
  );
};

const KofiaTable = (props: { rows: Row[] }) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<Array<ColumnDef<Row>>>(
    () => [
      {
        accessorKey: "펀드명",
        size: 600,
      },
      {
        accessorKey: "보수합계",
        header: "총보수율",
        cell: (info) => info.getValue<number>().toFixed(4),
      },
      {
        accessorKey: "유사유형평균보수율",
        cell: (info) => info.getValue<number>().toFixed(4),
      },
      {
        accessorKey: "TER",
        cell: (info) => info.getValue<number>().toFixed(4),
      },
      {
        accessorFn: (row) => row.TER + row.매매중개수수료율,
        header: "실부담비용률",
        cell: (info) => info.getValue<number>().toFixed(4),
      },
      {
        accessorKey: "설정일",
      },
      {
        accessorKey: "펀드코드",
        cell: (info) => {
          const code = info.getValue<string>();
          const url = `https://dis.kofia.or.kr/websquare/popup.html?w2xPath=/wq/com/popup/DISComFundSmryInfo.xml&standardCd=${code}`;
          return (
            <a href={url} target="_blank">
              {info.getValue<Date>().toLocaleString()}
            </a>
          );
        },
      },
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
