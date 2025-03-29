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

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Farmer Details", href: "/farmers", icon: Leaf },
  { title: "Procurement", href: "/procurement", icon: Package },
  { title: "Processing", href: "/processing", icon: BarChart },
  { title: "Staff Management", href: "/staff", icon: Users },
];

export function AppSidebar({ ...props }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isRouteActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className="flex flex-col h-full w-64 bg-white border-r shadow"
      {...props}
    >
      <div className="flex items-center justify-center h-16 border-b">
        <div className="text-xl font-bold text-green-600">Chaya</div>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded hover:bg-green-100",
                isRouteActive(item.href)
                  ? "bg-green-200 text-green-800"
                  : "text-gray-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          <button className="flex items-center gap-2 px-4 py-2 text-purple-600 rounded hover:bg-purple-100 w-full">
            <FileDown className="w-5 h-5" />
            <span>Export Product Data</span>
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 rounded hover:bg-red-100 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
