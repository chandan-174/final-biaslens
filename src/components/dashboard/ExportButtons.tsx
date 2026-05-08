import { useState } from "react";
import { Download, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { ParsedCSV } from "@/lib/csv-parser";
import type { BiasAlert } from "@/lib/bias-detector";

interface ExportButtonsProps {
  parsedData: ParsedCSV;
  biasAlerts: BiasAlert[];
  kpis: { label: string; value: string; change: string; up: boolean }[];
}

const ExportButtons = ({ parsedData, biasAlerts, kpis }: ExportButtonsProps) => {
  const [exporting, setExporting] = useState(false);

  // 🔥 EXPORT PNG
  const exportChartPNG = async () => {
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");

      const chartEl = document.querySelector(
        "[data-chart-export]"
      ) as HTMLElement | null;

      if (!chartEl) {
        toast.error("No chart element found to export.");
        return;
      }

      const canvas = await html2canvas(chartEl, {
        backgroundColor: "#020817",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `${parsedData.fileName.split(".")[0]}-chart.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Chart exported as PNG");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export chart");
    } finally {
      setExporting(false);
    }
  };

  // 🔥 EXPORT PDF (FIXED)
  const exportPDF = async () => {
    setExporting(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth();

      let y = 20;

      // TITLE
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AI Decision Intelligence Report", w / 2, y, { align: "center" });

      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `File: ${parsedData.fileName} · ${parsedData.rowCount} rows · ${parsedData.colCount} columns`,
        w / 2,
        y,
        { align: "center" }
      );

      y += 6;

      doc.text(`Generated: ${new Date().toLocaleString()}`, w / 2, y, {
        align: "center",
      });

      y += 12;

      // KPIs
      if (kpis.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Key Metrics", 15, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        kpis.forEach((kpi) => {
          doc.text(`${kpi.label}: ${kpi.value} (${kpi.change})`, 20, y);
          y += 6;
        });

        y += 6;
      }

      // BIAS ALERTS
      if (biasAlerts.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Bias Detection (${biasAlerts.length} findings)`, 15, y);
        y += 8;

        biasAlerts.forEach((alert) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");

          const sev = `[${alert.severity.toUpperCase()}]`;
          doc.text(`${sev} ${alert.title}`, 20, y);

          y += 5;

          doc.setFont("helvetica", "normal");

          const lines = doc.splitTextToSize(alert.description, w - 40);
          doc.text(lines, 20, y);

          y += lines.length * 5 + 4;
        });

        y += 4;
      }

      // 🔥 CHART EXPORT (SAFE)
      const chartEl = document.querySelector(
        "[data-chart-export]"
      ) as HTMLElement | null;

      if (chartEl) {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Chart Analysis", 15, y);
        y += 6;

        const canvas = await html2canvas(chartEl, {
          backgroundColor: "#020817",
          scale: 2,
        });

        const imgData = canvas.toDataURL("image/png");

        doc.addImage(imgData, "PNG", 10, y, 180, 100);

        y += 110;
      }

      // SUMMARY
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Column Summary", 15, y);

      y += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      doc.text(
        `Numeric columns: ${parsedData.numericColumns.join(", ") || "None"}`,
        20,
        y
      );

      y += 5;

      doc.text(
        `Categorical columns: ${parsedData.categoricalColumns.join(", ") || "None"}`,
        20,
        y
      );

      // SAVE
      doc.save(`${parsedData.fileName.split(".")[0]}-report.pdf`);

      toast.success("Report exported as PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs" disabled={exporting}>
          <Download size={14} className="mr-1.5" />
          {exporting ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportChartPNG} className="text-xs cursor-pointer">
          <Image size={14} className="mr-2" /> Chart as PNG
        </DropdownMenuItem>

        <DropdownMenuItem onClick={exportPDF} className="text-xs cursor-pointer">
          <FileText size={14} className="mr-2" /> Full Report as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;