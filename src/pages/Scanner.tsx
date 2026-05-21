import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DecisionScore from "@/components/DecisionScore";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  (import.meta.env.PROD ? "" : "http://localhost:5000");

interface SentenceBias {
  text: string;
  severity: "none" | "low" | "medium" | "high";
  biasType?: string;
  explanation?: string;
}

const severityBg: Record<string, string> = {
  none: "",
  low: "bg-warning/10 border-b-2 border-warning/30",
  medium: "bg-warning/15 border-b-2 border-warning/50",
  high: "bg-bias/15 border-b-2 border-bias/50",
};

const suggestionForTextBias = (biasType?: string) => {
  const key = (biasType || "").toLowerCase();
  if (!key) return "Reframe the sentence with evidence, uncertainty bounds, and at least one alternative explanation.";
  if (key.includes("confirmation"))
    return "Actively test counter-evidence: add disconfirming examples and consider alternative hypotheses.";
  if (key.includes("anchoring"))
    return "Avoid single-number anchors: cite ranges/benchmarks and compare multiple reference points.";
  if (key.includes("availability"))
    return "Ground the claim in data: replace vivid anecdotes with representative statistics and sources.";
  if (key.includes("survivorship"))
    return "Account for what’s missing: identify excluded cases and explain how selection could change the conclusion.";
  if (key.includes("overconfidence"))
    return "Express calibrated uncertainty: state assumptions, confidence level, and what would change your mind.";
  return "Rewrite neutrally: separate observation from inference and add a measurable criterion or data source.";
};

const getErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

const Scanner = () => {
  const [sentences, setSentences] = useState<SentenceBias[]>([]);
  const [selected, setSelected] = useState<SentenceBias | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [hasDoc, setHasDoc] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const scanIdParam = searchParams.get("scan");

  useEffect(() => {
    if (!scanIdParam || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("document_scans")
          .select("sentences")
          .eq("id", scanIdParam)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && data) {
          setSentences(data.sentences as unknown as SentenceBias[]);
          setHasDoc(true);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          toast({ title: "Failed to load scan", description: getErrorMessage(e), variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanIdParam, user, toast]);

  const persistScan = async (parsed: SentenceBias[], sourceText: string) => {
    if (!user) return;
    const total = parsed.length;
    const biasCount = parsed.filter((s) => s.severity !== "none").length;
    const highCount = parsed.filter((s) => s.severity === "high").length;
    const score = total > 0 ? Math.round(((total - biasCount) / total) * 100) : 0;
    const snippet = sourceText.slice(0, 200);
    const title = sourceText.trim().split(/\s+/).slice(0, 8).join(" ") || "Untitled scan";

    const { error } = await supabase.from("document_scans").insert({
      user_id: user.id,
      title,
      snippet,
      sentences: parsed as unknown as Json,
      total_sentences: total,
      bias_count: biasCount,
      high_count: highCount,
      score,
    });
    if (error) console.error("Failed to persist scan", error);
  };

  const scanText = useCallback(async (text: string) => {
    setLoading(true);
    setSentences([]);
    setSelected(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/scan-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `Scan request failed (${resp.status})`);
      }
      const data = (await resp.json()) as { content?: string };

      let parsed: SentenceBias[];
      try {
        const raw = (data.content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Failed to parse AI response");
      }

      setSentences(parsed);
      setHasDoc(true);
      await persistScan(parsed, text);
    } catch (e: unknown) {
      toast({ title: "Scan failed", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) scanText(text);
    };
    reader.readAsText(file);
  };

  const biasCount = sentences.filter((s) => s.severity !== "none").length;
  const highCount = sentences.filter((s) => s.severity === "high").length;
  const score = sentences.length > 0 ? Math.round(((sentences.length - biasCount) / sentences.length) * 100) : 0;

  if (!hasDoc) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] md:min-h-screen p-8">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl card-premium border border-border flex items-center justify-center mx-auto mb-6">
              <FileText size={32} className="text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Scan for Biases</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste text or upload a .txt file. AI will analyze each sentence for cognitive biases.
            </p>
          </div>

          <div className="card-premium border border-border rounded-xl p-6 space-y-4">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your document text here..."
              className="min-h-[160px] text-xs bg-background"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => textInput.trim() && scanText(textInput)}
                className="flex-1 text-xs"
                disabled={loading || !textInput.trim()}
              >
                {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Brain size={14} className="mr-2" />}
                {loading ? "Scanning..." : "Scan for Biases"}
              </Button>
              <label>
                <Button variant="outline" className="text-xs" asChild>
                  <span>
                    <Upload size={14} className="mr-1.5" /> Upload .txt
                  </span>
                </Button>
                <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSelectSentence = (sentence: SentenceBias) => {
    if (sentence.severity !== "none") {
      setSelected(sentence);
      setShowPanel(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="font-display font-extrabold text-lg sm:text-xl flex items-center gap-2">
              <FileText size={20} className="text-bias" />
              Document Scanner
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sentences.length} sentences analyzed · Built for Academic Use
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs lg:hidden"
              onClick={() => setShowPanel(!showPanel)}
            >
              <Brain size={14} className="mr-1.5" /> {biasCount} Biases
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setHasDoc(false); setSentences([]); setTextInput(""); if (scanIdParam) setSearchParams({}); }}>
              <Upload size={14} className="mr-1.5" /> New Scan
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 max-w-3xl">
          <div className="space-y-0.5">
            {sentences.map((sentence, i) => (
              <span
                key={i}
                className={`inline text-xs leading-[2] px-0.5 py-0.5 rounded-sm cursor-pointer transition-all hover:opacity-80 ${severityBg[sentence.severity]}`}
                onClick={() => handleSelectSentence(sentence)}
              >
                {sentence.text}{" "}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-bias" /> High bias</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-warning" /> Medium/Low</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-muted" /> Clean</div>
        </div>
      </div>

      {showPanel && (
        <div className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-30" onClick={() => setShowPanel(false)} />
      )}

      <div className={`
        fixed right-0 top-14 md:top-0 bottom-0 w-[300px] sm:w-[340px] border-l border-border bg-card overflow-y-auto p-5 space-y-5 z-40 transition-transform duration-200
        lg:static lg:translate-x-0 lg:z-auto
        ${showPanel ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        <button className="lg:hidden absolute top-3 right-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPanel(false)}>✕</button>

        <DecisionScore
          score={score}
          label="Decision Score"
          hint={`${biasCount} finding${biasCount === 1 ? "" : "s"} · ${highCount} high severity`}
          className="bg-card/80 backdrop-blur"
        />

        <div>
          <h3 className="font-display font-bold text-xs mb-3">Biases Found</h3>
          <div className="space-y-2">
            {sentences
              .filter((s) => s.severity !== "none")
              .map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className={`card-premium border border-border rounded-lg p-3 cursor-pointer transition-all hover:border-bias/30 ${
                    selected === s ? "border-bias/50 glow-bias" : ""
                  }`}
                  onClick={() => setSelected(s)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-bold text-[11px] text-bias">{s.biasType}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      s.severity === "high" ? "bg-bias/10 text-bias" : s.severity === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    }`}>
                      {s.severity}
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 text-left">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Why detected</div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {s.explanation || "Explanation unavailable."}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Suggested improvement</div>
                      <p className="mt-1 text-[11px] text-foreground/80 leading-relaxed line-clamp-2">
                        {suggestionForTextBias(s.biasType)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {selected && (
          <div className="card-premium border border-bias/20 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Brain size={14} className="text-bias" />
              <span className="font-display font-bold text-xs">{selected.biasType}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                selected.severity === "high" ? "bg-bias/10 text-bias" : selected.severity === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
              }`}>
                {selected.severity}
              </span>
            </div>
            <p className="text-[11px] text-foreground/70 leading-relaxed mb-3 italic">"{selected.text}"</p>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Why detected</div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{selected.explanation}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Suggested improvement</div>
                <p className="mt-1 text-[11px] text-foreground/80 leading-relaxed">
                  {suggestionForTextBias(selected.biasType)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
