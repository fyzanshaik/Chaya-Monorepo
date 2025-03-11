'use client';

import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider } from '@/app/providers/auth-provider';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';
import { AppSidebar } from '../components/layout/app-sidebar';
import { Separator } from '@workspace/ui/components/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@workspace/ui/components/breadcrumb';
import { FarmersCacheProvider } from './farmers/context/farmer-cache-context';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const breadcrumbMap: Record<string, string> = {
		'/dashboard': 'Overview',
		'/farmers': 'Farmer Dashboard',
		'/procurement': 'Procurement',
		'/processing': 'Processing',
		'/staff-management': 'Staff Management',
	};

	const breadCrumbLabel = breadcrumbMap[pathname] || 'Overview';
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
			<AuthProvider>
				<FarmersCacheProvider>
					<div className="flex h-screen overflow-hidden">
						<SidebarProvider>
							<AppSidebar className="h-screen" />
							<SidebarInset className="flex flex-col flex-1 overflow-hidden">
								<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
									<SidebarTrigger className="-ml-1" />
									<Separator orientation="vertical" className="mr-2 h-4" />
									<Breadcrumb>
										<BreadcrumbList>
											<BreadcrumbItem>
												<BreadcrumbPage>{breadCrumbLabel}</BreadcrumbPage>
											</BreadcrumbItem>
										</BreadcrumbList>
									</Breadcrumb>
								</header>
								<div className="flex flex-1 flex-col p-4 overflow-auto">{children}</div>
							</SidebarInset>
						</SidebarProvider>
					</div>
				</FarmersCacheProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
