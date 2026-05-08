import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MeshBackground from "@/components/MeshBackground";
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
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
          <h1 className="font-display font-bold text-xl">Reset your password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {sent ? "Check your email for a reset link" : "We'll send you a reset link"}
          </p>
        </div>

        <div className="card-premium border border-border rounded-xl p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
                <Mail size={20} className="text-success" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>. Click the link in the email to set a new password.
              </p>
              <Button variant="outline" className="w-full text-xs" onClick={() => setSent(false)}>
                Try a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Email</Label>
                <div className="relative mt-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs h-9 bg-background"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full text-xs" disabled={loading}>
                {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                Send Reset Link <ArrowRight size={14} className="ml-1" />
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          <Link to="/login" className="text-analytics hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={10} /> Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
