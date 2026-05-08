import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MeshBackground from "@/components/MeshBackground";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <MeshBackground />
      <motion.div
        className="w-full max-w-sm mx-auto relative z-10 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-extrabold text-xl tracking-tight inline-flex mb-4">
            AI Decision Intelligence
          </Link>
          <h1 className="font-display font-bold text-xl">
            {success ? "Password updated!" : "Set new password"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {success ? "Redirecting to dashboard..." : "Enter your new password below"}
          </p>
        </div>

        <div className="card-premium border border-border rounded-xl p-6">
          {success ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
                <CheckCircle size={20} className="text-success" />
              </div>
              <p className="text-xs text-muted-foreground">Your password has been updated. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">New Password</Label>
                <div className="relative mt-1">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs h-9 bg-background"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs h-9 bg-background"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full text-xs" disabled={loading}>
                {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                Update Password <ArrowRight size={14} className="ml-1" />
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
