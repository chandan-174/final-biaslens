import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  headers: string[];
  rows: Record<string, string | number>[];
  maxRows?: number;
}

const DataTable = ({ headers, rows, maxRows = 8 }: DataTableProps) => {
  const [search, setSearch] = useState("");

  const filteredRows = rows.filter((row) =>
    headers.some((header) =>
      String(row[header] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5 overflow-hidden">
      <h3 className="font-display font-bold text-sm mb-3">Raw Data Preview</h3>

      {/* 🔍 SEARCH INPUT */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="🔍 Search data..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-sm rounded-md border bg-background"
        />
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead
                  key={h}
                  className="text-[10px] uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRows.slice(0, maxRows).map((row, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell
                    key={h}
                    className="text-[11px] whitespace-nowrap"
                  >
                    {row[h] != null ? String(row[h]) : "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* UPDATED COUNT */}
      {filteredRows.length > maxRows && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Showing {Math.min(maxRows, filteredRows.length)} of {filteredRows.length} rows
        </p>
      )}
    </div>
  );
};

export default DataTable;