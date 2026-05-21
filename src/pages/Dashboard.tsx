import { useState, useCallback, useEffect } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  parseCSVFile,
  computeKPIs,
  computePieData,
  type ParsedCSV,
} from "@/lib/csv-parser";
import { detectBiases, type BiasAlert } from "@/lib/bias-detector";
import FileUploadZone from "@/components/dashboard/FileUploadZone";
import KPICards from "@/components/dashboard/KPICards";
import MainChart from "@/components/dashboard/MainChart";
import PieBreakdown from "@/components/dashboard/PieBreakdown";
import DataTable from "@/components/dashboard/DataTable";
import BiasAlerts from "@/components/dashboard/BiasAlerts";
import BiasBreakdown from "@/components/dashboard/BiasBreakdown";
import ExportButtons from "@/components/dashboard/ExportButtons";
import DecisionScore from "@/components/DecisionScore";
import { parseFile } from "@/lib/file-parser";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { supabase } from "@/lib/supabase";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  (import.meta.env.PROD ? "" : "http://localhost:5000");



const Dashboard = () => {
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [biasAlerts, setBiasAlerts] = useState<BiasAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);


const askAI = async () => {
  if (!parsedData || !query) return;

  setChatLoading(true);

  try {
    console.log("STEP 1: sending request");

    const resp = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: query }],
      }),
    });

    const data = (await resp.json().catch(() => ({}))) as { content?: string; error?: string };
    console.log("STEP 2: response data:", data);

    if (!resp.ok) {
      toast.error(data.error || `AI request failed (${resp.status})`);
      return;
    }

    setAnswer(data.content || "No content field");
  } catch (err) {
    console.error("STEP 4: crash:", err);
    toast.error("Crash happened");
  } finally {
    setChatLoading(false);
  }
};
  


  

      

  // ✅ AI STATES
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // ✅ LOCAL INSIGHTS (fallback)
  const generateInsights = () => {
    if (!parsedData) return [];

    const insights: string[] = [];

    if (parsedData.rowCount > 500) {
      insights.push("Large dataset detected. Insights are more reliable.");
    } else {
      insights.push("Small dataset. Interpret trends carefully.");
    }

    if (biasAlerts.length > 0) {
      const high = biasAlerts.filter((b) => b.severity === "high").length;

      if (high > 0) {
        insights.push("High-risk bias detected. Decisions may be unreliable.");
      } else {
        insights.push("Moderate bias detected. Review before decision-making.");
      }
    } else {
      insights.push("No major bias detected. Data looks relatively balanced.");
    }

    if (parsedData.numericColumns.length > 2) {
      insights.push(
        "Multiple numeric variables present. Good for comparative analysis."
      );
    }

    return insights;
  };

const generateReport = async () => {
  try {
    if (!parsedData) return;

    const doc = new jsPDF();
    let y = 10;

    // TITLE
    doc.setFontSize(16);
    doc.text("AI Decision Intelligence Report", 10, y);

    y += 10;

    // DATASET INFO
    doc.setFontSize(10);
    doc.text(`File: ${parsedData.fileName}`, 10, y);
    y += 6;
    doc.text(`Rows: ${parsedData.rowCount}`, 10, y);
    y += 6;
    doc.text(`Columns: ${parsedData.colCount}`, 10, y);

    y += 10;

    // SUMMARY
    doc.setFontSize(12);
    doc.text("AI Summary:", 10, y);
    y += 6;

    const summaryText =
      aiInsights.length > 0
        ? aiInsights.join(" ")
        : generateInsights().join(" ");

    const split = doc.splitTextToSize(summaryText, 180);
    doc.setFontSize(10);
    doc.text(split, 10, y);

    y += split.length * 5 + 5;

    // 🔥 CHART (SAFE VERSION — NO ERROR)
    const chartElement = document.querySelector(
      "[data-chart-export]"
    ) as HTMLElement | null;

    if (chartElement) {
      if (y > 180) {
        doc.addPage();
        y = 10;
      }

      doc.setFontSize(12);
      doc.text("Chart Analysis:", 10, y);
      y += 6;

      const canvas = await htmlToImage.toCanvas(chartElement);

      const img = canvas.toDataURL("image/png");

      doc.addImage(img, "PNG", 10, y, 180, 100);

      y += 110;
    }

    // INSIGHTS
    const insights = generateInsights();
    const decisions = generateDecisions();

    if (y > 250) {
      doc.addPage();
      y = 10;
    }

    doc.setFontSize(12);
    doc.text("Key Insights:", 10, y);
    y += 6;

    insights.forEach((ins) => {
      doc.setFontSize(10);
      doc.text(`• ${ins}`, 10, y);
      y += 5;
    });

    y += 5;

    doc.setFontSize(12);
    doc.text("Decision Suggestions:", 10, y);
    y += 6;

    decisions.forEach((dec) => {
      doc.setFontSize(10);
      doc.text(`• ${dec}`, 10, y);
      y += 5;
    });

    doc.save("AI_Report.pdf");

    toast.success("Report generated ✅");
  } catch (err) {
    console.error(err);
    toast.error("Report failed ❌");
  }
};


  const generateDecisions = () => {
  if (!parsedData) return [];

  const decisions: string[] = [];

  if (biasAlerts.some((b) => b.type === "sampling")) {
    decisions.push("Improve data sampling before making decisions.");
  }

  if (parsedData.numericColumns.length > 2) {
    decisions.push("Use comparative analysis across numeric fields.");
  }

  if (biasAlerts.some((b) => b.severity === "high")) {
    decisions.push("Avoid critical decisions until high-risk bias is resolved.");
  }

  if (parsedData.rowCount > 500) {
    decisions.push("Dataset is large — trends are likely reliable.");
  }

  return decisions;
};

  // 🚀 REAL AI FUNCTION
  const fetchAIInsights = async () => {
    if (!parsedData) return;

    setAiLoading(true);

    try {
      const prompt = `
Analyze this dataset:

Rows: ${parsedData.rowCount}
Columns: ${parsedData.colCount}
Numeric Columns: ${parsedData.numericColumns.join(", ")}

Bias Alerts: ${biasAlerts.map((b) => b.title).join(", ")}

Give 3 short insights about trends, risks, and decisions.
`;

      const resp = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = (await resp.json().catch(() => ({}))) as { content?: string; error?: string };
      if (!resp.ok) {
        console.error(data.error || `AI request failed (${resp.status})`);
        return;
      }

      const text = data?.content || "";
      const lines = text.split("\n").filter(Boolean);

      setAiInsights(lines);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // 🔥 TRIGGER AI AFTER DATA LOAD
  useEffect(() => {
    if (parsedData) {
      fetchAIInsights();
    }
  }, [parsedData]);

  // 🔁 RESTORE
  useEffect(() => {
    const restore = localStorage.getItem("restoreDashboard");

    if (restore) {
      const data = JSON.parse(restore);
      setParsedData(data.parsedData);
      setBiasAlerts(data.biasAlerts || []);
      localStorage.removeItem("restoreDashboard");
    }
  }, []);

  // 🔁 LOAD SAVED
  useEffect(() => {
    const savedData = localStorage.getItem("csvData");
    const savedAlerts = localStorage.getItem("biasAlerts");

    if (savedData) setParsedData(JSON.parse(savedData));
    if (savedAlerts) setBiasAlerts(JSON.parse(savedAlerts));
  }, []);

  const computeDecisionScore = (alerts: BiasAlert[]) => {
    if (alerts.length === 0) return 100;
    const penalty = alerts.reduce((sum, a) => {
      if (a.severity === "high") return sum + 20;
      if (a.severity === "medium") return sum + 10;
      return sum + 5;
    }, 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  };

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      let rawText = "";

      try {
        rawText = await parseFile(file);
      } catch (err) {
        toast.error("PDF parsing not supported properly yet. Try CSV or Excel.");
        return;
      }

      // convert to CSV-like format
      const blob = new Blob([rawText], { type: "text/csv" });
      const newFile = new File([blob], "converted.csv");

      const data = await parseCSVFile(newFile);

      // 🔥 SMART CHECK
      if (data.rows.length === 0) {
        const ext = file.name.split(".").pop()?.toLowerCase();

        // ❌ If CSV → real error
        if (ext === "csv" || ext === "xlsx" || ext === "xls") {
          toast.error("CSV/Excel file is empty or invalid.");
          return;
        }

        // ⚠️ If PDF/Word → soft warning (don't stop app)
        toast.warning(
          "File loaded, but data structure is unclear. Try using CSV/Excel for best results."
        );

        // 👇 allow minimal fallback instead of stopping
      }


      setParsedData(data);
      const alerts = detectBiases(data);
      setBiasAlerts(alerts);
      localStorage.setItem("csvData", JSON.stringify(data));
      localStorage.setItem("biasAlerts", JSON.stringify(alerts));

      toast.success(
        `Loaded ${data.rowCount} rows × ${data.colCount} columns`
      );

      if (alerts.length > 0) {
        toast.warning(
          `${alerts.length} potential bias${
            alerts.length > 1 ? "es" : ""
          } detected`
        );
      }
    } catch {
      toast.error("Failed to parse CSV file.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!parsedData) {
    const handleSampleData = async () => {
      setIsLoading(true);
      try {
        const sampleCSV = `Name,Gender,Salary,Department
Alice,Female,50000,HR
Bob,Male,70000,Engineering
Charlie,Male,65000,Engineering
Diana,Female,52000,HR
Eve,Female,48000,Marketing
Frank,Male,72000,Engineering`;

        const blob = new Blob([sampleCSV], { type: "text/csv" });
        const file = new File([blob], "sample.csv");

        await handleFile(file);
      } catch {
        toast.error("Failed to load sample data");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="p-4 sm:p-6 space-y-6">
        <BiasBreakdown />

        <div className="border border-dashed rounded-2xl p-8 text-center space-y-5">
          <h2 className="text-xl font-semibold">
            Start analyzing your data
          </h2>

          <Button onClick={handleSampleData}>
            🚀 Try Sample Data
          </Button>
        </div>

        <FileUploadZone onFileSelect={handleFile} isLoading={isLoading} />
      </div>
    );
  }

  const kpis = computeKPIs(parsedData);
  const pieData = computePieData(parsedData);
  const xKey = parsedData.categoricalColumns[0] || parsedData.headers[0];
  const yKeys = parsedData.numericColumns;
  const decisionScore = computeDecisionScore(biasAlerts);
  const insights = generateInsights();
  const decisions = generateDecisions();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-lg sm:text-xl">
            Dashboard
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {parsedData.fileName} · {parsedData.rowCount} rows · {parsedData.colCount} columns
          </p>
        </div>

        {/* <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm mb-3">💬 Chat with your Data</h3>

          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask something about your data..."
              className="flex-1 px-3 py-2 text-xs rounded-md border bg-background"
            />

            <Button onClick={askAI} disabled={chatLoading}>
              {chatLoading ? "..." : "Ask"}
            </Button>
          </div>

          {answer && (
            <div className="mt-3 text-xs bg-muted/40 p-3 rounded">
              {answer}
            </div>
          )}
        </div> */}

        <div className="flex gap-2 flex-wrap">

          {/* ✅ EXPORT BACK */}
          <ExportButtons
            parsedData={parsedData}
            biasAlerts={biasAlerts}
            kpis={kpis}
          />

          {/* ✅ NEW UPLOAD BACK */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              setParsedData(null);
              setBiasAlerts([]);
              localStorage.removeItem("csvData");
              localStorage.removeItem("biasAlerts");
            }}
          >
            <Upload size={14} className="mr-1.5" />
            New Upload
          </Button>

          <Button
            size="sm"
            onClick={() => {
              console.log("clicked");
              generateReport();
            }}
          >
            📄 Report
          </Button>

          {/* ✅ SAVE (your current logic) */}
          <Button
            size="sm"
            onClick={() => {
              const existing = JSON.parse(
                localStorage.getItem("dashboardHistory") || "[]"
              );

              localStorage.setItem(
                "dashboardHistory",
                JSON.stringify([
                  {
                    id: Date.now(),
                    type: "dashboard",
                    title: parsedData.fileName || "Dataset",
                    created_at: new Date().toISOString(),
                    parsedData,
                    biasAlerts,
                  },
                  ...existing,
                ])
              );
            }}
          >
            💾 Save
          </Button>
        </div>
      </div>

      <DecisionScore score={decisionScore} />

      {/* 🧠 AI INSIGHTS */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-bold text-sm mb-3">🧠 AI Insights</h3>

        {aiLoading ? (
          <p className="text-xs text-muted-foreground">
            Analyzing data...
          </p>
        ) : aiInsights.length > 0 ? (
          aiInsights.map((text, i) => (
            <div key={i} className="text-xs p-2 bg-muted rounded">
              {text}
            </div>
          ))
        ) : (
          insights.map((text, i) => (
            <div key={i} className="text-xs p-2 bg-muted rounded">
              {text}
            </div>
          ))
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-bold text-sm mb-3">⚡ Decision Suggestions</h3>

        <div className="space-y-2">
          {decisions.map((text, i) => (
            <div key={i} className="text-xs bg-muted/40 p-2 rounded">
              {text}
            </div>
          ))}
        </div>
      </div>

      {biasAlerts.length > 0 && <BiasAlerts alerts={biasAlerts} />}
      {kpis.length > 0 && <KPICards kpis={kpis} />}

      <MainChart data={parsedData.rows} xKey={xKey} yKeys={yKeys} />

      <PieBreakdown data={pieData} title="Breakdown" />

      <DataTable headers={parsedData.headers} rows={parsedData.rows} />
    </div>
  );
};



export default Dashboard;
