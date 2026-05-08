import { motion } from "framer-motion";

interface Props {
  score: number;
  hint?: string;
}

const getColor = (score: number) => {
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
};

const getBg = (score: number) => {
  if (score >= 80) return "from-green-500/20 to-green-500/5";
  if (score >= 50) return "from-yellow-500/20 to-yellow-500/5";
  return "from-red-500/20 to-red-500/5";
};

export default function DecisionScore({ score, hint }: Props) {
  return (
    <div
      className={`rounded-2xl p-6 bg-gradient-to-br ${getBg(
        score
      )} border border-white/10 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        {/* TEXT */}
        <div>
          <p className="text-sm text-muted-foreground">Decision Score</p>
          <h2 className={`text-3xl font-bold ${getColor(score)}`}>
            {score}
          </h2>
        </div>

        {/* 🔥 PROGRESS RING */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 rotate-[-90deg]">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={176}
              strokeDashoffset={176 - (176 * score) / 100}
              className={getColor(score)}
              initial={{ strokeDashoffset: 176 }}
              animate={{
                strokeDashoffset: 176 - (176 * score) / 100,
              }}
              transition={{ duration: 1 }}
            />
          </svg>
        </div>
      </div>

      {/* HINT */}
      {hint && (
        <p className="text-xs text-muted-foreground mt-3">
          {hint}
        </p>
      )}
    </div>
  );
}