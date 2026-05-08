import { useState, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from "recharts";
import { Zap, Maximize2, X } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(349, 90%, 60%)",
  "hsl(271, 91%, 65%)",
  "hsl(38, 92%, 50%)",
  "hsl(160, 84%, 39%)",
];

const tooltipStyle = {
  background: "hsl(222, 30%, 8%)",
  border: "1px solid hsl(220, 10%, 15%)",
  borderRadius: "8px",
  fontSize: "11px",
};

interface MainChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKeys: string[];
}





const MainChart = ({ data, xKey, yKeys }: MainChartProps) => {
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartOnlyRef = useRef<HTMLDivElement>(null);

  const visibleKeys = yKeys.slice(0, 4);

  const downloadGraphOnly = async () => {
    if (!chartOnlyRef.current) return;

    const dataUrl = await htmlToImage.toPng(chartOnlyRef.current, {
      pixelRatio: 2,
      backgroundColor: "#020817",
    });

    const link = document.createElement("a");
    link.download = "graph.png";
    link.href = dataUrl;
    link.click();
  };

  const downloadPDF = async () => {
    if (!chartOnlyRef.current) return;

    const dataUrl = await htmlToImage.toPng(chartOnlyRef.current, {
      pixelRatio: 2,
      backgroundColor: "#020817",
    });

    const pdf = new jsPDF("landscape");
    pdf.addImage(dataUrl, "PNG", 10, 10, 280, 150);
    pdf.save("chart.pdf");
  };

  // ✅ DOWNLOAD FUNCTION (ADDED)
  const downloadChart = async () => {
    if (!chartRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 🔥 HD quality
        backgroundColor: "#020817", // match your dark theme
      });

      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div
  ref={chartRef}
  data-chart-export   // 🔥 ADD THIS
  className={`${
    isFullScreen
      ? "fixed inset-0 z-50 bg-background p-6"
      : "col-span-1 lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5 relative"
  }`}
>
      <div className="absolute top-0 left-0 right-0 h-[2px] gradient-stripe" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="font-display font-bold text-sm">
            {visibleKeys.slice(0, 2).join(" vs ")}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {data.length} data points · {visibleKeys.length} series
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex gap-2 items-center">
          {/* Chart Toggle */}
          {(["area", "bar", "line"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`text-[10px] px-2.5 py-1 rounded border transition-all ${
                chartType === t
                  ? "bg-accent border-border text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition"
          >
            {isFullScreen ? <X size={14} /> : <Maximize2 size={14} />}
            {isFullScreen ? "Close" : "Fullscreen"}
          </button>

          {/* ✅ DOWNLOAD BUTTON (ADDED) */}
          <button
            onClick={downloadChart}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition"
          >
            ⬇ Download
          </button>

          <button
            onClick={downloadGraphOnly}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted"
          >
            📊 Graph
          </button>

          <button
            onClick={downloadPDF}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted"
          >
            📄 PDF
</button>
        </div>
      </div>

      {/* CHART */}
      <div ref={chartOnlyRef}>
        <ResponsiveContainer width="100%" height={isFullScreen ? 500 : 260}>
        {chartType === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 15%)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "hsl(224, 15%, 50%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(224, 15%, 50%)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            {visibleKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} opacity={i === 0 ? 1 : 0.7} />
            ))}
            <Brush dataKey={xKey} height={20} stroke="hsl(217, 91%, 60%)" />
          </BarChart>
        ) : chartType === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 15%)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "hsl(224, 15%, 50%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(224, 15%, 50%)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            {visibleKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
            <Brush dataKey={xKey} height={20} stroke="hsl(217, 91%, 60%)" />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 15%)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "hsl(224, 15%, 50%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(224, 15%, 50%)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <defs>
              {visibleKeys.map((k, i) => (
                <linearGradient key={k} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {visibleKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} fill={`url(#grad-${i})`} strokeWidth={2} />
            ))}
            <Brush dataKey={xKey} height={20} stroke="hsl(217, 91%, 60%)" />
          </AreaChart>
          
        )}
      </ResponsiveContainer>
      </div>

      {/* FOOTER */}
      <p className="text-[10px] text-muted-foreground mt-3 flex items-start gap-1.5">
        <Zap size={11} className="text-combined mt-0.5 shrink-0" />
        Showing {visibleKeys.join(", ")} across {data.length} rows grouped by {xKey}.
      </p>
    </div>
  );
};

export default MainChart;