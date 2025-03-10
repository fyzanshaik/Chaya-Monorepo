import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Package, BarChart, LogOut, Leaf } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { usePermissions } from '@/hooks/use-permission';
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarRail,
	useSidebar,
} from '@workspace/ui/components/sidebar';
import { Button } from '@workspace/ui/components/button';
import { ModeToggle } from '../theme-toggle';
import { cn } from '@workspace/ui/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@workspace/ui/components/avatar';

const navGroups = [
	{
		title: 'Main Navigation',
		items: [
			{
				title: 'Dashboard',
				href: '/dashboard',
				icon: Home,
				show: (permissions: { canViewDashboard: boolean }) => permissions.canViewDashboard,
			},
			{
				title: 'Farmers',
				href: '/farmers',
				icon: Leaf,
				show: (permissions: { canViewDashboard: boolean }) => permissions.canViewDashboard,
			},
			{
				title: 'Procurement',
				href: '/procurement',
				icon: Package,
				show: (permissions: { canViewProcurement: boolean }) => permissions.canViewProcurement,
			},
			{
				title: 'Processing',
				href: '/processing',
				icon: BarChart,
				show: (permissions: { canViewProcessing: boolean }) => permissions.canViewProcessing,
			},
			{
				title: 'Staff Management',
				href: '/staff',
				icon: Users,
				show: (permissions: { canManageStaff: boolean }) => permissions.canManageStaff,
			},
		],
	},
];

export function AppSidebar({ ...props }) {
	const pathname = usePathname();
	const { signOut, user } = useAuth();
	const permissions = usePermissions();
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';

	const isRouteActive = (href: string) => {
		return pathname === href || pathname.startsWith(`${href}/`);
	};

	const getInitials = (email: string) => {
		return email?.substring(0, 2).toUpperCase() || 'U';
	};

	return (
		<Sidebar collapsible="icon" {...props} className="overflow-hidden">
			<SidebarHeader className="p-2">
				<div className={cn('flex items-center justify-between w-full transition-all', isCollapsed ? 'justify-center' : 'justify-between')}>
					{!isCollapsed && <div className="text-xl font-bold truncate">Chaya App</div>}
					<ModeToggle />
				</div>
			</SidebarHeader>
			<SidebarContent className="overflow-y-auto">
				<TooltipProvider delayDuration={0}>
					{navGroups.map((group) => (
						<SidebarGroup key={group.title} className="px-2">
							{!isCollapsed && <SidebarGroupLabel className="px-2 truncate">{group.title}</SidebarGroupLabel>}
							<SidebarGroupContent>
								<SidebarMenu>
									{group.items.map((item) =>
										item.show(permissions) ? (
											<SidebarMenuItem key={item.href} className="px-2">
												{isCollapsed ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<SidebarMenuButton asChild isActive={isRouteActive(item.href)}>
																<Link
																	href={item.href}
																	className={cn(
																		'flex items-center justify-center w-full p-2 rounded-md',
																		isRouteActive(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'
																	)}
																>
																	<item.icon className="h-5 w-5" />
																</Link>
															</SidebarMenuButton>
														</TooltipTrigger>
														<TooltipContent side="right">{item.title}</TooltipContent>
													</Tooltip>
												) : (
													<SidebarMenuButton asChild isActive={isRouteActive(item.href)}>
														<Link
															href={item.href}
															className={cn(
																'flex items-center w-full px-3 py-2 rounded-md',
																isRouteActive(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'
															)}
														>
															<item.icon className="h-5 w-5 flex-shrink-0" />
															<span className="ml-3 truncate">{item.title}</span>
														</Link>
													</SidebarMenuButton>
												)}
											</SidebarMenuItem>
										) : null
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</TooltipProvider>
			</SidebarContent>
			<SidebarRail />
			<div className={cn('border-t p-2 transition-all', isCollapsed ? 'flex flex-col items-center' : 'p-4 space-y-4')}>
				{isCollapsed ? (
					<div className="flex flex-col items-center gap-4">
						<Tooltip>
							<TooltipTrigger asChild>
								<Avatar className="h-8 w-8">
									<AvatarFallback>{getInitials(user?.email ?? '')}</AvatarFallback>
								</Avatar>
							</TooltipTrigger>
							<TooltipContent side="right">
								<p>{user?.email}</p>
								<p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="default" size="icon" onClick={signOut} className="h-8 w-8">
									<LogOut className="h-4 w-4" />
									<span className="sr-only">Sign Out</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Sign Out</TooltipContent>
						</Tooltip>
					</div>
				) : (
					<>
						<div className="flex items-center space-x-3">
							<Avatar className="h-8 w-8">
								<AvatarFallback>{getInitials(user?.email ?? '')}</AvatarFallback>
							</Avatar>
							<div className="truncate">
								<div className="text-sm font-medium truncate">{user?.email}</div>
								<div className="text-xs text-muted-foreground capitalize truncate">{user?.role?.replace('_', ' ')}</div>
							</div>
						</div>
						<Button variant="default" onClick={signOut} className="w-full">
							<LogOut className="mr-2 h-4 w-4" />
							<span className="truncate">Sign Out</span>
						</Button>
					</>
				)}
			</div>
		</Sidebar>
	);
}
