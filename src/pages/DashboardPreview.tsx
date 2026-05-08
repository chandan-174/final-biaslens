import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DashboardPreview() {
  const [lineData, setLineData] = useState([
    { name: "Jan", value: 30 },
    { name: "Feb", value: 45 },
    { name: "Mar", value: 28 },
    { name: "Apr", value: 60 },
    { name: "May", value: 75 },
  ]);

  const [barData, setBarData] = useState([
    { name: "A", value: 40 },
    { name: "B", value: 65 },
    { name: "C", value: 35 },
    { name: "D", value: 80 },
  ]);

  const [aiText, setAiText] = useState("");

  const fullText =
    "Analyzing dataset... Bias detected in category distribution. Suggested normalization applied.";

  // 🔥 CUSTOM DARK TOOLTIP
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-background/80 backdrop-blur-xl px-3 py-2 shadow-[0_0_20px_rgba(59,130,246,0.25)] text-xs">
          <p className="text-muted-foreground">{label}</p>
          <p className="font-semibold text-foreground">
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // 🔁 LIVE DATA UPDATE
  useEffect(() => {
    const interval = setInterval(() => {
      setLineData((prev) =>
        prev.map((d) => ({
          ...d,
          value: Math.max(20, Math.min(100, d.value + (Math.random() * 20 - 10))),
        }))
      );

      setBarData((prev) =>
        prev.map((d) => ({
          ...d,
          value: Math.max(20, Math.min(100, d.value + (Math.random() * 20 - 10))),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 🤖 AI TYPING EFFECT
  useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      setAiText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(typing);
    }, 30);

    return () => clearInterval(typing);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl p-5 space-y-6"
    >
      <div className="text-sm font-semibold">Live AI Dashboard</div>

      {/* 🔥 LINE CHART */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData}>
            <CartesianGrid strokeOpacity={0.1} vertical={false} />

            <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />

            <Tooltip content={<CustomTooltip />} cursor={false} />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 BAR CHART */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeOpacity={0.1} vertical={false} />

            <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />

            <Tooltip content={<CustomTooltip />} cursor={false} />

            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              className="fill-blue-500/80 hover:fill-blue-400 transition"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🤖 AI OUTPUT */}
      <div className="text-xs font-mono bg-background/70 border border-border p-3 rounded-lg min-h-[60px] backdrop-blur">
        {aiText}
        <span className="animate-pulse">|</span>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-background/70 border border-border text-center backdrop-blur">
          ⚠️ Bias
        </div>
        <div className="p-2 rounded-lg bg-background/70 border border-border text-center backdrop-blur">
          📊 87%
        </div>
        <div className="p-2 rounded-lg bg-background/70 border border-border text-center backdrop-blur">
          ✅ Fixed
        </div>
      </div>
    </motion.div>
  );
}