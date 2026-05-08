import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, Hash } from "lucide-react";

interface KPI {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

const iconSet = [TrendingUp, ArrowUpRight, TrendingDown, Hash];

const KPICards = ({ kpis }: { kpis: KPI[] }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
    {kpis.map((kpi, i) => {
      const Icon = iconSet[i % iconSet.length];
      return (
        <motion.div
          key={kpi.label}
          className="bg-card border border-border rounded-xl p-3 sm:p-4 relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider truncate pr-2">
              {kpi.label}
            </span>
            <Icon size={14} className={kpi.up ? "text-success" : "text-bias"} />
          </div>
          <div className="font-display font-extrabold text-xl sm:text-2xl">{kpi.value}</div>
          <div className={`text-[10px] sm:text-[11px] mt-1 ${kpi.up ? "text-success" : "text-bias"}`}>
            {kpi.change}
          </div>
        </motion.div>
      );
    })}
  </div>
);

export default KPICards;
