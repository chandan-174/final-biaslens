import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(349, 90%, 60%)",
  "hsl(271, 91%, 65%)",
  "hsl(38, 92%, 50%)",
  "hsl(160, 84%, 39%)",
  "hsl(200, 70%, 50%)",
];

const tooltipStyle = {
  background: "hsl(222, 30%, 8%)",
  border: "1px solid hsl(220, 10%, 15%)",
  borderRadius: "8px",
  fontSize: "11px",
};

interface PieBreakdownProps {
  data: { name: string; value: number }[];
  title?: string;
}

const PieBreakdown = ({ data, title = "Category Breakdown" }: PieBreakdownProps) => {
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-display font-bold text-sm mb-1">{title}</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Distribution breakdown</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-muted-foreground truncate max-w-[120px]">{d.name}</span>
            </div>
            <span className="font-display font-bold">
              {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieBreakdown;
