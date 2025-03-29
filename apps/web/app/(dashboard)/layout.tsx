"use client";

import { ThemeProvider } from "@/app/providers/theme-provider";
import { AuthProvider, useAuth } from "@/app/providers/auth-provider";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "../components/layout/app-sidebar";
import { FarmersCacheProvider } from "./farmers/context/farmer-cache-context";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect staff to /farmers
  if (!loading && user?.role === "STAFF") {
    router.push("/farmers");
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <FarmersCacheProvider>
          <div className="flex h-screen overflow-hidden">
            <SidebarProvider>
              <AppSidebar className="h-screen" />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-16 items-center justify-between px-4 border-b bg-white shadow">
                  <div className="text-xl font-bold">Dashboard Analytics</div>
                  <button className="px-4 py-2 text-white bg-purple-500 rounded hover:bg-purple-600">
                    Export Data
                  </button>
                </header>
                <div className="flex flex-1 flex-col p-4 overflow-auto bg-gray-100">
                  {children}
                </div>
              </div>
            </SidebarProvider>
          </div>
        </FarmersCacheProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
