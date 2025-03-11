// dashboard-layout.tsx
'use client';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider } from '@/app/providers/auth-provider';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';
import { AppSidebar } from '../components/layout/app-sidebar';
import { Separator } from '@workspace/ui/components/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@workspace/ui/components/breadcrumb';
import { Toaster } from '@workspace/ui/components/sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
			<AuthProvider>
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
											<BreadcrumbPage>Overview</BreadcrumbPage>
										</BreadcrumbItem>
									</BreadcrumbList>
								</Breadcrumb>
							</header>
							<div className="flex flex-1 flex-col p-4 overflow-auto">{children}</div>
							<Toaster />
						</SidebarInset>
					</SidebarProvider>
				</div>
			</AuthProvider>
		</ThemeProvider>
	);
}
