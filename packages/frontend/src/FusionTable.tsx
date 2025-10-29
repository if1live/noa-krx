import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useReducer, useState } from "react";
import type { FusionRow } from "./types";

const columnHelper = createColumnHelper<FusionRow>();

const columns = [
  columnHelper.accessor("단축코드", {
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("한글종목약명", {
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("총보수", {
    cell: (info) => info.getValue().toFixed(4),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("TER", {
    cell: (info) => info.getValue().toFixed(4),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("실부담비용률", {
    cell: (info) => info.getValue().toFixed(4),
    footer: (info) => info.column.id,
  }),
];

interface Props {
  data: FusionRow[];
}

export const FusionTable = (props: Props) => {
  const { data } = props;

  const rerender = useReducer(() => ({}), {})[1];
  const [sorting, _setSorting] = useState<SortingState>([]);
  const [condition, setCondition] = useState("");
  const [rows, setRows] = useState<FusionRow[]>(data);

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const nextRows = data.filter((row) => {
      // TODO: 검색 조건 더 이쁘게 고치는건 나중에
      const baseName = row.한글종목약명.toLowerCase();
      const matchText = text.toLowerCase();
      return baseName.includes(matchText);
    });
    setRows(nextRows);
    setCondition(text);
  };

  const handleReset = () => {
    setRows(data);
    setCondition("");
  };

  return (
    <>
      <form>
        <input
          type="text"
          value={condition}
          onChange={handleFilter}
          placeholder="Type to filter..."
        />
        <input type="reset" onClick={handleReset} />
      </form>

      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                        title={
                          header.column.getCanSort()
                            ? header.column.getNextSortingOrder() === "asc"
                              ? "Sort ascending"
                              : header.column.getNextSortingOrder() === "desc"
                                ? "Sort descending"
                                : "Clear sort"
                            : undefined
                        }
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
          {table
            .getRowModel()
            .rows.slice(0, 50)
            .map((row) => {
              return (
                <tr key={row.id}>
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
      <div>{table.getRowModel().rows.length.toLocaleString()} Rows</div>
      <div>
        <button type="button" onClick={() => rerender()}>
          Force Rerender
        </button>
      </div>
      <pre>{JSON.stringify(sorting, null, 2)}</pre>
    </>
  );
};
