import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Scanner from "./pages/Scanner";
import HistoryPage from "./pages/HistoryPage";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import BlogDetail from "@/pages/BlogDetail";
import BlogEditor from "./pages/BlogEditor";
import AdminDashboard from "@/pages/AdminDashboard";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/editor" element={<BlogEditor />} />
              <Route path="/admin" element={ <ProtectedRoute><AdminDashboard /></ProtectedRoute>}/>
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<Settings />} />
                
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
