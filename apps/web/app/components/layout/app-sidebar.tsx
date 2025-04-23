"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Package,
  BarChart,
  LogOut,
  Leaf,
  FileDown,
} from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Farmer Details", href: "/farmers", icon: Leaf },
  { title: "Procurement", href: "/procurements", icon: Package },
  { title: "Processing", href: "/processing", icon: BarChart },
  { title: "Staff Management", href: "/staff", icon: Users },
];

const MIN_WIDTH = 80;
const MAX_WIDTH = 350;
const DEFAULT_WIDTH = 250;

export function AppSidebar({ ...props }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(true); 
  const [sidebarWidth, setSidebarWidth] = React.useState(MIN_WIDTH); 
  const [isResizing, setIsResizing] = React.useState(false);
  const [isHoveringResize, setIsHoveringResize] = React.useState(false);

  const isRouteActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  React.useEffect(() => {

    const loadState = () => {
      try {
        const storedCollapsed = localStorage.getItem("sidebar-collapsed");
        const storedWidth = localStorage.getItem("sidebar-width");

        setCollapsed(storedCollapsed ? JSON.parse(storedCollapsed) : false);
        setSidebarWidth(
          storedWidth
            ? Math.max(MIN_WIDTH, Math.min(JSON.parse(storedWidth), MAX_WIDTH))
            : DEFAULT_WIDTH
        );
      } catch (error) {
        console.error("Error loading sidebar state:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadState();
  }, []);

  React.useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    localStorage.setItem("sidebar-width", JSON.stringify(sidebarWidth));
  }, [collapsed, sidebarWidth, isLoaded]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth = e.clientX;
      newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));

      setSidebarWidth(newWidth);

      if (newWidth < MIN_WIDTH + 20 && !collapsed) {
        setCollapsed(true);
      } else if (newWidth > MIN_WIDTH + 50 && collapsed) {
        setCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
    };

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, collapsed]);

  if (!isLoaded) {
    return (
      <div
        className="flex flex-col h-full bg-white border-r shadow"
        style={{ width: MIN_WIDTH }}
      >
        <div className="flex items-center justify-center h-16 border-b">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {navItems.map(item => (
            <div key={item.href} className="flex justify-center p-3">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="p-2 border-t">
          <div className="flex justify-center p-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-full bg-white border-r shadow relative group"
      style={{ width: collapsed ? MIN_WIDTH : sidebarWidth }}
      initial={false}
      animate={{ width: collapsed ? MIN_WIDTH : sidebarWidth }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      {...props}
    >
      <div className="flex items-center justify-between h-16 border-b px-4">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-green-600 whitespace-nowrap"
            >
              Chaya
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <nav className="p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded hover:bg-green-100 transition-colors duration-200",
                isRouteActive(item.href)
                  ? "bg-green-200 text-green-800"
                  : "text-gray-700",
                collapsed ? "justify-center" : ""
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.1 }}
                    className="whitespace-nowrap"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t space-y-1">
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-red-600 rounded hover:bg-red-100 w-full transition-colors duration-200",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Log Out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.1 }}
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {}
      <motion.div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize",
          "bg-gray-200 hover:bg-gray-300 active:bg-gray-400",
          "transition-colors duration-200"
        )}
        onMouseDown={startResize}
        onMouseEnter={() => setIsHoveringResize(true)}
        onMouseLeave={() => setIsHoveringResize(false)}
        animate={{
          backgroundColor: isResizing
            ? "rgba(156, 163, 175, 1)"
            : isHoveringResize
              ? "rgba(209, 213, 219, 1)"
              : "rgba(229, 231, 235, 1)",
        }}
        whileHover={{ width: 4 }}
        whileTap={{ width: 6 }}
      />
    </motion.div>
  );
}