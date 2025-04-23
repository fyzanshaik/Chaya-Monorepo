'use client';

import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider, useAuth } from '@/app/providers/auth-provider';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { AppSidebar } from '../components/layout/app-sidebar';
import { FarmersCacheProvider } from './farmers/context/farmer-cache-context';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect staff to /farmers
  if (!loading && user?.role === 'STAFF') {
    router.push('/farmers');
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <FarmersCacheProvider>
          <div className="flex h-screen overflow-hidden bg-gray-100">
            <SidebarProvider>
              <AppSidebar className="h-screen" />
              <motion.div
                className="flex flex-col flex-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-1 flex-col p-4 overflow-auto">{children}</div>
              </motion.div>
            </SidebarProvider>
          </div>
        </FarmersCacheProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
