import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MeshBackground from "@/components/MeshBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "chandansharma268908@gmail.com";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // 🔹 On page load (covers Google login return + refresh)


  // 🔹 Email/password login
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(false);

  if (error) {
    toast({
      title: "Login failed",
      description: error.message,
      variant: "destructive",
    });
    return;
  }

  const userEmail = data.user?.email?.toLowerCase();

  if (userEmail === ADMIN_EMAIL.toLowerCase()) {
    navigate("/admin", { replace: true });
  } else {
    navigate("/dashboard", { replace: true });
  }
};
  // 🔹 Google login (return handled by useEffect above)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // come back to /login, then useEffect redirects correctly
        redirectTo: window.location.origin + "/dashboard",
      },
    });

    if (error) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <MeshBackground />

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-sm text-white/70 hover:text-white"
      >
        ← Back to Home
      </button>

      <motion.div
        className="w-full max-w-sm mx-auto relative z-10 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="font-bold text-xl mb-4 block">
            AI Decision Intelligence
          </Link>
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Log in to continue
          </p>
        </div>

        <div className="border rounded-xl p-6 bg-background/80">
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </Button>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              Log In
            </Button>
          </form>
        </div>

        <div className="text-center text-sm mt-4">
          <Link to="/signup">Create account</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;