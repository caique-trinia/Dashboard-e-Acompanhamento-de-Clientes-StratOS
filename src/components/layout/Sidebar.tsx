"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Bot,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Building2 },
  { href: "/automation", label: "Automação / Log", icon: Bot },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex flex-col min-h-screen text-white transition-all duration-200 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ backgroundColor: "#0a0b69" }}
    >
      <div
        className={cn(
          "flex items-center gap-2 py-5 border-b",
          collapsed ? "justify-center px-0" : "px-6"
        )}
        style={{ borderColor: "#1c1e8a" }}
      >
        <Zap className="h-6 w-6 flex-shrink-0" style={{ color: "#f92e78" }} />
        {!collapsed && <span className="text-lg font-bold tracking-tight">StratOS</span>}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "",
                isActive ? "text-white" : "text-blue-200 hover:text-white"
              )}
              style={isActive ? { backgroundColor: "#f92e78" } : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 space-y-1">
        {/* Collapse toggle */}
        <button
          onClick={toggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className={cn(
            "flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm font-medium text-blue-200 hover:text-white transition-colors",
            collapsed ? "justify-center" : ""
          )}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1c1e8a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && "Recolher"}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm font-medium text-blue-200 hover:text-white transition-colors",
            collapsed ? "justify-center" : ""
          )}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1c1e8a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
