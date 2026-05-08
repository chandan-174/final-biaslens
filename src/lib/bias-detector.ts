import type { ParsedCSV } from "./csv-parser";

export interface BiasAlert {
  type: "sampling" | "survivorship" | "outlier" | "confirmation" | "anchoring" | "distribution";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  affectedColumn?: string;
}

export function detectBiases(data: ParsedCSV): BiasAlert[] {
  const alerts: BiasAlert[] = [];

  // 1. Small sample size bias
  if (data.rowCount < 30) {
    alerts.push({
      type: "sampling",
      severity: "high",
      title: "Small Sample Size",
      description: `Only ${data.rowCount} rows detected. Statistical conclusions may be unreliable with fewer than 30 data points.`,
    });
  } else if (data.rowCount < 100) {
    alerts.push({
      type: "sampling",
      severity: "medium",
      title: "Limited Sample Size",
      description: `${data.rowCount} rows may not be representative. Consider whether this sample captures full population variance.`,
    });
  }

  // 2. Missing data bias
  data.headers.forEach((col) => {
    const missing = data.rows.filter(
      (r) => r[col] === null || r[col] === undefined || r[col] === ""
    ).length;
    const pct = (missing / data.rowCount) * 100;
    if (pct > 20) {
      alerts.push({
        type: "survivorship",
        severity: pct > 50 ? "high" : "medium",
        title: "Missing Data Bias",
        description: `Column "${col}" has ${pct.toFixed(0)}% missing values. Missing data is rarely random — it may skew results toward surviving records.`,
        affectedColumn: col,
      });
    }
  });

  // 3. Outlier detection (IQR method) on numeric columns
  data.numericColumns.forEach((col) => {
    const values = data.rows
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length < 4) return;

    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const outliers = values.filter((v) => v < lower || v > upper);
    const outlierPct = (outliers.length / values.length) * 100;

    if (outlierPct > 5) {
      alerts.push({
        type: "outlier",
        severity: outlierPct > 15 ? "high" : "medium",
        title: "Outlier Concentration",
        description: `${outlierPct.toFixed(1)}% of values in "${col}" are statistical outliers. These may disproportionately influence means and trends.`,
        affectedColumn: col,
      });
    }
  });

  // 4. Distribution skewness (anchoring bias indicator)
  data.numericColumns.slice(0, 4).forEach((col) => {
    const values = data.rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
    if (values.length < 10) return;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const skewRatio = mean !== 0 ? Math.abs((mean - median) / mean) : 0;
    if (skewRatio > 0.3) {
      alerts.push({
        type: "anchoring",
        severity: skewRatio > 0.6 ? "high" : "medium",
        title: "Skewed Distribution",
        description: `"${col}" has a ${mean > median ? "right" : "left"}-skewed distribution (mean/median diverge by ${(skewRatio * 100).toFixed(0)}%). Averages may anchor perception away from typical values.`,
        affectedColumn: col,
      });
    }
  });

  // 5. Category imbalance (confirmation bias risk)
  data.categoricalColumns.slice(0, 3).forEach((col) => {
    const counts: Record<string, number> = {};
    data.rows.forEach((r) => {
      const key = String(r[col] ?? "");
      if (key) counts[key] = (counts[key] || 0) + 1;
    });

    const entries = Object.entries(counts);
    if (entries.length < 2) return;

    const max = Math.max(...entries.map(([, v]) => v));
    const total = entries.reduce((a, [, v]) => a + v, 0);
    const dominance = (max / total) * 100;

    if (dominance > 70 && entries.length > 2) {
      alerts.push({
        type: "confirmation",
        severity: dominance > 85 ? "high" : "medium",
        title: "Category Imbalance",
        description: `One category in "${col}" dominates at ${dominance.toFixed(0)}%. Under-represented groups may be invisible in aggregate analysis.`,
        affectedColumn: col,
      });
    }
  });

  // 6. Uniform/low-variance detection
  data.numericColumns.slice(0, 4).forEach((col) => {
    const values = data.rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
    if (values.length < 10) return;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;

    if (cv < 0.05 && mean !== 0) {
      alerts.push({
        type: "distribution",
        severity: "low",
        title: "Suspiciously Low Variance",
        description: `"${col}" has a coefficient of variation of ${(cv * 100).toFixed(1)}%. This uniformity may indicate data filtering or rounding.`,
        affectedColumn: col,
      });
    }
  });

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
