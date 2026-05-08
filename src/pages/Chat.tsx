import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, BarChart3, Zap, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  analytics?: string;
  biasDetected?: boolean;
  biasType?: string;
  biasSeverity?: string;
  biasTrigger?: string;
  biasExplanation?: string;
  recommendations?: string[];
  loading?: boolean;
}

type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  bias_data: Json | null;
  created_at: string;
};

type ChatAIResponse = {
  analytics?: string;
  biasDetected?: boolean;
  biasType?: string;
  biasSeverity?: string;
  biasTrigger?: string;
  biasExplanation?: string;
  recommendations?: string[];
};

const asJsonObject = (value: Json | null | undefined): Record<string, Json> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Json>;
};

const getErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

const normalizeAIResponse = (value: unknown): ChatAIResponse => {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  return {
    analytics: typeof v.analytics === "string" ? v.analytics : undefined,
    biasDetected: typeof v.biasDetected === "boolean" ? v.biasDetected : undefined,
    biasType: typeof v.biasType === "string" ? v.biasType : undefined,
    biasSeverity: typeof v.biasSeverity === "string" ? v.biasSeverity : undefined,
    biasTrigger: typeof v.biasTrigger === "string" ? v.biasTrigger : undefined,
    biasExplanation: typeof v.biasExplanation === "string" ? v.biasExplanation : undefined,
    recommendations: Array.isArray(v.recommendations)
      ? v.recommendations.filter((x): x is string => typeof x === "string")
      : undefined,
  };
};

const welcomeMsg: Message = {
  id: 1,
  role: "ai",
  text: "",
  analytics:
    "Welcome. Ask a question about your data or a decision you’re considering. I’ll summarize key insights and flag potential cognitive or data-quality biases.",
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get("session");

  // Load existing session from URL (or reset for new chat)
  useEffect(() => {
    if (!sessionParam || !user) {
      setSessionId(null);
      setMessages([welcomeMsg]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, bias_data, created_at")
        .eq("session_id", sessionParam)
        .order("created_at", { ascending: true });
      if (error || !data) return;
      const loaded: Message[] = (data as ChatMessageRow[]).map((m, i) => {
        const bias = asJsonObject(m.bias_data);
        return {
          id: i + 1,
          role: m.role as "user" | "ai",
          text: m.role === "user" ? m.content : "",
          analytics: m.role === "ai" ? m.content : undefined,
          biasDetected: !!m.bias_data,
          biasType: bias && typeof bias.biasType === "string" ? bias.biasType : undefined,
          biasSeverity: bias && typeof bias.biasSeverity === "string" ? bias.biasSeverity : undefined,
          biasTrigger: bias && typeof bias.biasTrigger === "string" ? bias.biasTrigger : undefined,
          biasExplanation: bias && typeof bias.biasExplanation === "string" ? bias.biasExplanation : undefined,
          recommendations:
            bias && Array.isArray(bias.recommendations)
              ? bias.recommendations.filter((x): x is string => typeof x === "string")
              : undefined,
        };
      });
      setSessionId(sessionParam);
      setMessages(loaded.length > 0 ? loaded : [welcomeMsg]);
    })();
  }, [sessionParam, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ensureSession = async (firstMessage: string): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (!user) return null;
    const title = firstMessage.slice(0, 80);
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error) {
      console.error("Failed to create session", error);
      return null;
    }
    setSessionId(data.id);
    return data.id;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    const userMsg: Message = { id: Date.now(), role: "user", text: currentInput };
    const loadingMsg: Message = { id: Date.now() + 1, role: "ai", text: "", loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    // Persist user message
    const sid = await ensureSession(currentInput);
    if (sid) {
      await supabase.from("chat_messages").insert({
        session_id: sid,
        role: "user",
        content: currentInput,
      });
    }

    // Build conversation history for context
    const history = messages
      .filter(m => m.role === "user" || (m.role === "ai" && m.analytics))
      .map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.role === "user" ? m.text : m.analytics || "",
      }));
    history.push({ role: "user", content: currentInput });

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: history },
      });

      if (error) throw error;

      let parsed: ChatAIResponse;
      try {
        const raw = data.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = normalizeAIResponse(JSON.parse(raw));
      } catch {
        parsed = { analytics: data.content, biasDetected: false };
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? {
                ...m,
                loading: false,
                analytics: parsed.analytics,
                biasDetected: parsed.biasDetected,
                biasType: parsed.biasType,
                biasSeverity: parsed.biasSeverity,
                biasTrigger: parsed.biasTrigger,
                biasExplanation: parsed.biasExplanation,
                recommendations: parsed.recommendations,
              }
            : m
        )
      );

      // Persist AI message
      if (sid) {
        await supabase.from("chat_messages").insert({
          session_id: sid,
          role: "ai",
          content: parsed.analytics || "",
          bias_data: parsed.biasDetected ? {
            biasType: parsed.biasType,
            biasSeverity: parsed.biasSeverity,
            biasTrigger: parsed.biasTrigger,
            biasExplanation: parsed.biasExplanation,
            recommendations: parsed.recommendations,
          } : null,
        });
      }
    } catch (e: unknown) {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      toast({
        title: "AI Error",
        description: getErrorMessage(e) || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-display font-extrabold text-lg sm:text-xl flex items-center gap-2">
            <Bot size={20} className="text-combined" />
            AI Chat
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Decision intelligence assistant · Bias-aware analytics
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2.5 py-1 rounded bg-analytics/10 text-analytics border border-analytics/20 font-bold tracking-wider">
            📊 Analytics
          </span>
          <span className="text-muted-foreground/40">+</span>
          <span className="px-2.5 py-1 rounded bg-bias/10 text-bias border border-bias/20 font-bold tracking-wider">
            🧠 Bias AI
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] sm:max-w-lg bg-accent border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User size={12} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">You</span>
                  </div>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                </div>
              ) : msg.loading ? (
                <div className="max-w-[95%] sm:max-w-2xl w-full">
                  <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-analytics" />
                    <span className="text-xs text-muted-foreground">Analyzing for insights and biases...</span>
                  </div>
                </div>
              ) : (
                <div className="max-w-[95%] sm:max-w-2xl space-y-2 w-full">
                  {msg.analytics && (
                    <div className="bg-card border border-analytics/20 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={12} className="text-analytics" />
                        <span className="text-[10px] text-analytics font-bold tracking-wider uppercase">
                          Analytics Insight
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{msg.analytics}</p>
                    </div>
                  )}

                  {msg.biasDetected && (
                    <div className="bg-card border border-bias/20 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Brain size={12} className="text-bias" />
                          <span className="text-[10px] text-bias font-bold tracking-wider uppercase">
                            Bias Detected
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          msg.biasSeverity === "High"
                            ? "text-bias border-bias/30 bg-bias/10"
                            : msg.biasSeverity === "Medium"
                            ? "text-warning border-warning/30 bg-warning/10"
                            : "text-success border-success/30 bg-success/10"
                        }`}>
                          {msg.biasSeverity}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px]">Type: </span>
                          <span className="font-display font-bold text-bias">{msg.biasType}</span>
                        </div>
                        {msg.biasTrigger && (
                          <div>
                            <span className="text-muted-foreground text-[10px]">Trigger: </span>
                            <span className="text-foreground/70 italic">{msg.biasTrigger}</span>
                          </div>
                        )}
                        <p className="text-foreground/70 leading-relaxed">{msg.biasExplanation}</p>

                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Zap size={10} className="text-combined" />
                              <span className="text-[10px] text-combined font-bold tracking-wider uppercase">
                                Recommendations
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {msg.recommendations.map((r, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                                  <span className="text-combined shrink-0 mt-0.5">→</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your data or share a business decision..."
            className="text-xs h-10 bg-card"
            disabled={isLoading}
          />
          <Button onClick={handleSend} size="sm" className="px-4" disabled={isLoading}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
