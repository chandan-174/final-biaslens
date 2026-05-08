import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface BiasRow {
  type: string;
  total: number;
  high: number;
  medium: number;
  low: number;
}

const asJsonObject = (value: Json | null | undefined): Record<string, Json> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Json>;
};

const asJsonArray = (value: Json | null | undefined): Json[] => (Array.isArray(value) ? value : []);

const sevColor = (severity: string) => {
  const s = severity?.toLowerCase();
  if (s === "high") return "hsl(var(--bias))";
  if (s === "medium") return "hsl(var(--warning))";
  if (s === "low") return "hsl(var(--combined))";
  return "hsl(var(--muted-foreground))";
};

const BiasBreakdown = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BiasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, chats: 0, scans: 0, sources: 0 });

  useEffect(() => {
    if (!user) {
      setRows([]);
      setStats({ total: 0, chats: 0, scans: 0, sources: 0 });
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [chatRes, scanRes] = await Promise.all([
          supabase
            .from("chat_messages")
            .select("bias_data, user_id")
            .not("bias_data", "is", null),

          supabase
            .from("document_scans")
            .select("sentences, bias_count")
            .eq("user_id", user.id),
        ]);

        if (cancelled) return;
        if (chatRes.error) throw chatRes.error;
        if (scanRes.error) throw scanRes.error;

        const buckets: Record<string, BiasRow> = {};
        const bump = (type: string, severity: string) => {
          const key = type || "Unknown";
          if (!buckets[key]) buckets[key] = { type: key, total: 0, high: 0, medium: 0, low: 0 };
          buckets[key].total += 1;
          const s = (severity || "").toLowerCase();
          if (s === "high") buckets[key].high += 1;
          else if (s === "medium") buckets[key].medium += 1;
          else if (s === "low") buckets[key].low += 1;
        };

        let chatBiases = 0;
        (chatRes.data ?? []).forEach((m) => {
          const b = asJsonObject((m as { bias_data?: Json | null }).bias_data);
          const biasType = b && typeof b.biasType === "string" ? b.biasType : null;
          const biasSeverity = b && typeof b.biasSeverity === "string" ? b.biasSeverity : "";
          if (!biasType) return;
          bump(biasType, biasSeverity);
          chatBiases += 1;
        });

        let scanBiases = 0;
        (scanRes.data ?? []).forEach((row) => {
          const sentences = asJsonArray((row as { sentences?: Json | null }).sentences);
          sentences.forEach((sent) => {
            const obj = asJsonObject(sent);
            const severity = obj && typeof obj.severity === "string" ? obj.severity : "";
            const biasType = obj && typeof obj.biasType === "string" ? obj.biasType : "";
            if (severity && severity !== "none" && biasType) {
              bump(biasType, severity);
              scanBiases += 1;
            }
          });
        });

        const sorted = Object.values(buckets).sort((a, b) => b.total - a.total).slice(0, 8);
        setRows(sorted);
        setStats({
          total: chatBiases + scanBiases,
          chats: chatBiases,
          scans: scanBiases,
          sources: sorted.length,
        });
      } catch (e) {
        console.error("Failed to load bias breakdown", e);
        setRows([]);
        setStats({ total: 0, chats: 0, scans: 0, sources: 0 });
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dominantSeverity = (row: BiasRow) => {
    if (row.high >= row.medium && row.high >= row.low) return "high";
    if (row.medium >= row.low) return "medium";
    return "low";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h2 className="font-display font-bold text-sm flex items-center gap-2">
            <Brain size={14} className="text-bias" />
            Bias Type Breakdown
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Across all chats and document scans
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-bias" /> High
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-warning" /> Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-combined" /> Low
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="font-display font-bold text-xl mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">From Chats</div>
          <div className="font-display font-bold text-xl mt-0.5 text-combined">{stats.chats}</div>
        </div>
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">From Scans</div>
          <div className="font-display font-bold text-xl mt-0.5 text-bias">{stats.scans}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <TrendingUp size={22} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">No biases detected yet</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Run a chat or scan a document to see your breakdown
          </p>
        </div>
      ) : (
        <div className="h-[260px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="type"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
                labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
                formatter={(value: number, _name, props) => {
                  const r = props.payload as BiasRow;
                  return [
                    `${value} total · ${r.high}H / ${r.medium}M / ${r.low}L`,
                    "Occurrences",
                  ];
                }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={sevColor(dominantSeverity(r))} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default BiasBreakdown;
