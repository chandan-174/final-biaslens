import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { BiasAlert } from "@/lib/bias-detector";

const severityConfig = {
  high: { icon: ShieldAlert, color: "text-bias", bg: "bg-bias/10", border: "border-bias/30" },
  medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
};

const improvementByType: Record<BiasAlert["type"], string> = {
  sampling:
    "Increase sample size, validate representativeness, and report uncertainty (confidence intervals / sensitivity checks).",
  survivorship:
    "Quantify missingness, check if it is systematic, and consider imputation or exclusion with clear justification.",
  outlier:
    "Inspect outliers for data-entry errors; consider robust summaries (median/IQR) or winsorization where appropriate.",
  confirmation:
    "Stratify by category, re-weight samples, and explicitly analyze under-represented groups before concluding trends.",
  anchoring:
    "Use median/percentiles in addition to averages; consider transformations or segmented analysis for skewed variables.",
  distribution:
    "Audit preprocessing and rounding; confirm variance is expected for the domain and time window.",
};

const BiasAlerts = ({ alerts }: { alerts: BiasAlert[] }) => {
  const [hiddenAlerts, setHiddenAlerts] = useState<string[]>([]);

  if (alerts.length === 0) return null;

  const highCount = alerts.filter((a) => a.severity === "high").length;
  const medCount = alerts.filter((a) => a.severity === "medium").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <ShieldAlert size={16} className="text-bias" />
            Bias Findings
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {alerts.length} potential {alerts.length === 1 ? "bias" : "biases"} detected
            {highCount > 0 && ` · ${highCount} high severity`}
            {medCount > 0 && ` · ${medCount} medium`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {alerts
          .filter((alert, i) => !hiddenAlerts.includes(`${alert.type}-${i}`))
          .map((alert, i) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={`${alert.type}-${i}`}
                className={`${config.bg} border ${config.border} rounded-lg p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon size={14} className={`${config.color} mt-0.5 shrink-0`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-xs">{alert.title}</span>
                        <span className={`text-[9px] uppercase tracking-wider ${config.color}`}>
                          {alert.severity} risk
                        </span>
                        {alert.affectedColumn ? (
                          <span className="text-[9px] text-muted-foreground">
                            · Column:{" "}
                            <span className="font-medium text-foreground/80">
                              {alert.affectedColumn}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Why detected
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Suggested improvement
                    </div>
                    <p className="mt-1 text-[11px] text-foreground/80 leading-relaxed">
                      {improvementByType[alert.type]}
                    </p>
                  </div>
                </div>

                {/* ✅ ACTION BUTTONS ADDED */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() =>
                      setHiddenAlerts((prev) => [...prev, `${alert.type}-${i}`])
                    }
                    className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80"
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={() =>
                      setHiddenAlerts((prev) => [...prev, `${alert.type}-${i}`])
                    }
                    className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    Mark Reviewed
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default BiasAlerts;