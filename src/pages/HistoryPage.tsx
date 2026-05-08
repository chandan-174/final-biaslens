import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  History,
  Loader2,
  Trash2,
} from "lucide-react";

type ItemType = "dashboard";
type Filter = "all" | "dashboard";

interface HistoryRow {
  id: string;
  type: ItemType;
  title: string;
  created_at: string;
  biasCount: number;
  meta: string;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const HistoryPage = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<any | null>(null);

  // 🔥 LOAD ONLY LOCAL DASHBOARD HISTORY
  const load = () => {
    setLoading(true);

    const raw = JSON.parse(
      localStorage.getItem("dashboardHistory") || "[]"
    );

    const dashboards: HistoryRow[] = raw.map((d: any) => ({
      id: String(d.id),
      type: "dashboard",
      title: d.title || "Dashboard Analysis",
      created_at: d.created_at || new Date().toISOString(),
      biasCount: d.biasAlerts?.length ?? 0,
      meta: `${d.parsedData?.rowCount ?? 0} rows`,
    }));

    const sorted = dashboards.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    setItems(sorted);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // 🗑 DELETE
  const handleDelete = (e: React.MouseEvent, item: HistoryRow) => {
    e.stopPropagation();

    const all = JSON.parse(
      localStorage.getItem("dashboardHistory") || "[]"
    );

    const updated = all.filter(
      (d: any) => d.id.toString() !== item.id
    );

    localStorage.setItem(
      "dashboardHistory",
      JSON.stringify(updated)
    );

    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  // 🔁 OPEN DASHBOARD
  const handleOpen = (item: HistoryRow) => {
    const all = JSON.parse(
      localStorage.getItem("dashboardHistory") || "[]"
    );

    const found = all.find(
      (d: any) => d.id.toString() === item.id
    );

    if (found) {
      localStorage.setItem(
        "restoreDashboard",
        JSON.stringify(found)
      );
      navigate("/dashboard");
    }
  };

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  const totalBiases = items.reduce(
    (sum, s) => sum + s.biasCount,
    0
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Analysis History</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} items · {totalBiases} biases detected
        </p>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-5">
        {(["all", "dashboard"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded ${
              filter === t ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            {t === "all" ? "All" : "Dashboards"}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center mt-20">
          <History size={40} className="mx-auto opacity-30 mb-2" />
          <p className="text-muted-foreground text-sm">
            No history found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => {
                const all = JSON.parse(localStorage.getItem("dashboardHistory") || "[]");
                const found = all.find((d: any) => d.id.toString() === item.id);
                if (found) setPreview(found);
              }}
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/40 transition"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {item.meta} · {formatDate(item.created_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDelete(e, item)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md relative">

            {/* CLOSE */}
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white"
            >
              ✕
            </button>

            {/* CONTENT */}
            <h2 className="text-lg font-bold mb-2">
              {preview.title}
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              {preview.parsedData?.rowCount || 0} rows ·{" "}
              {preview.biasAlerts?.length || 0} biases detected
            </p>

            {/* TOP BIAS */}
            {preview.biasAlerts?.length > 0 && (
              <div className="mb-4 text-xs">
                <span className="text-muted-foreground">Top Bias: </span>
                <span className="font-semibold">
                  {preview.biasAlerts[0].title}
                </span>
              </div>
            )}

            {/* ACTION */}
            <button
              onClick={() => {
                localStorage.setItem("restoreDashboard", JSON.stringify(preview));
                setPreview(null);
                navigate("/dashboard");
              }}
              className="w-full bg-primary text-white py-2 rounded-lg"
            >
              Open Full Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;