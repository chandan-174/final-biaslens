import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "chandansharma268908@gmail.com";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  // ❌ not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userEmail = user.email?.toLowerCase();

  // 🔥 BLOCK NON-ADMIN FROM ADMIN PAGE
  if (
    location.pathname === "/admin" &&
    userEmail !== ADMIN_EMAIL.toLowerCase()
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;