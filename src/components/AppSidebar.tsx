import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  FileText,
  History,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
  { to: "/scanner", icon: FileText, label: "Doc Scanner" },
  { to: "/history", icon: History, label: "History" },
];

const AppSidebar = () => {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { user } = useAuth(); // ✅ removed signOut
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setDisplayName("");
      setAvatarUrl(null);
      return;
    }

    let active = true;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      setDisplayName(data?.display_name || "");
      setAvatarUrl(data?.avatar_url ?? null);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  // 🔥 FIXED LOGOUT FUNCTION
  const handleLogout = async () => {
    await supabase.auth.signOut(); // ✅ direct logout
    setOpen(false); // optional (close sidebar on mobile)
    navigate("/login"); // redirect
  };

  const friendlyName = displayName || user?.email?.split("@")[0] || "User";
  const initial = friendlyName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 z-50">
        <div className="font-display font-extrabold text-sm tracking-tight">
          AI Decision Intelligence
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 w-[220px] bg-background/80 backdrop-blur-xl border-r border-border flex flex-col z-50 transition-transform duration-200",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="font-display font-extrabold text-sm tracking-tight">
              AI Decision Intelligence
            </div>
            <ThemeToggle compact />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wider uppercase">
            Data · Bias Signals · Guidance
          </p>
        </div>

        {/* User */}
        {user && (
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className="mx-3 mt-3 flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-all group"
          >
            <Avatar className="h-8 w-8 border border-border shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={friendlyName} />
              ) : (
                <AvatarFallback className="bg-accent text-[11px] font-bold">
                  {initial || <UserIcon size={12} />}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate">
                {friendlyName}
              </div>
              {user.email && (
                <div className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </div>
              )}
            </div>
          </NavLink>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors hover:bg-accent",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border flex flex-col gap-1">
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all w-full",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )
            }
          >
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>

          {/* ✅ WORKING LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-accent transition-colors w-full"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
