import Papa from "papaparse";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string | number>[];
  numericColumns: string[];
  categoricalColumns: string[];
  fileName: string;
  rowCount: number;
  colCount: number;
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string | number>[];

        const numericColumns: string[] = [];
        const categoricalColumns: string[] = [];

        headers.forEach((col) => {
          const sampleValues = rows
            .slice(0, 20)
            .map((r) => r[col])
            .filter((v) => v !== null && v !== undefined && v !== "");

          const numericCount = sampleValues.filter(
            (v) => typeof v === "number" || (!isNaN(Number(v)) && v !== "")
          ).length;

          if (numericCount > sampleValues.length * 0.7) {
            numericColumns.push(col);
          } else {
            categoricalColumns.push(col);
          }
        });

        resolve({
          headers,
          rows,
          numericColumns,
          categoricalColumns,
          fileName: file.name,
          rowCount: rows.length,
          colCount: headers.length,
        });
      },
      error: (err) => reject(err),
    });
  });
}

export function computeKPIs(data: ParsedCSV) {
  const kpis: { label: string; value: string; change: string; up: boolean }[] = [];

  data.numericColumns.slice(0, 4).forEach((col) => {
    const values = data.rows.map((r) => Number(r[col]) || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    const changePct = firstAvg ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    const formatted =
      total >= 1_000_000
        ? `$${(total / 1_000_000).toFixed(1)}M`
        : total >= 1_000
        ? `$${(total / 1_000).toFixed(0)}K`
        : total.toLocaleString();

    kpis.push({
      label: col,
      value: formatted,
      change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`,
      up: changePct >= 0,
    });
  });

  return kpis;
}

export function computePieData(data: ParsedCSV) {
  // Use the first categorical column and first numeric column
  const catCol = data.categoricalColumns[0];
  const numCol = data.numericColumns[0];
  if (!catCol || !numCol) return [];

  const grouped: Record<string, number> = {};
  data.rows.forEach((row) => {
    const key = String(row[catCol] ?? "Other");
    grouped[key] = (grouped[key] || 0) + (Number(row[numCol]) || 0);
  });

  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));
}
