'use client';

import { flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { columns, defaultVisibleColumns } from '../lib/columns';
import { ColumnFilter } from './column-filter';
import { Farmer } from '@chaya/shared';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { useAuth } from '@/app/providers/auth-provider';
import { FarmerContextMenu } from './farmer-context-menu';
import { FarmerDetailsDialog } from './farmer-details-dialog';
import { FarmerFormDialog } from './farmer-form-dialog';
import { bulkDeleteFarmers } from '../lib/actions';
import { Button } from '@workspace/ui/components/button';
import { TrashIcon } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { toast } from 'sonner';
import { FarmerWithRelations } from '../lib/types';

interface FarmersTableProps {
	farmers: FarmerWithRelations[];
}
export default function FarmersTable({ farmers }: FarmersTableProps) {
	const { user } = useAuth();
	const isAdmin = user?.role === 'ADMIN';

	const [viewingFarmer, setViewingFarmer] = useState<Farmer | null>(null);
	const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
	const [showViewDialog, setShowViewDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [rowSelection, setRowSelection] = useState({});

	const [columnVisibility, setColumnVisibility] = useState(() => {
		const initialVisibility: Record<string, boolean> = {};

		defaultVisibleColumns.forEach((col) => {
			initialVisibility[col] = true;
		});

		return initialVisibility;
	});

	const table = useReactTable({
		data: farmers,
		columns,
		state: {
			columnVisibility,
			rowSelection,
		},
		enableRowSelection: isAdmin,
		onRowSelectionChange: setRowSelection,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const handleViewDetails = (farmer: Farmer) => {
		setViewingFarmer(farmer);
		setShowViewDialog(true);
	};

	const handleEditFarmer = (farmer: Farmer) => {
		if (isAdmin) {
			setEditingFarmer(farmer);
			setShowEditDialog(true);
		}
	};

	const handleBulkDelete = async () => {
		setIsDeleting(true);
		try {
			const selectedFarmerIds = Object.keys(rowSelection)
				.map((index) => {
					const idx = parseInt(index);
					return idx >= 0 && idx < farmers.length && farmers[idx] ? farmers[idx].id : null;
				})
				.filter((id): id is number => id !== null);

			if (selectedFarmerIds.length === 0) {
				toast('No valid farmers selected for deletion.');
				setShowBulkDeleteDialog(false);
				return;
			}

			const result = await bulkDeleteFarmers(selectedFarmerIds);

			if (result.success) {
				toast('Farmers deleted successfully.');
				setRowSelection({});
			} else {
				toast(result.error || "Couldn't delete farmers try again.");
			}

			setShowBulkDeleteDialog(false);
		} catch (error) {
			console.error('Error bulk deleting farmers:', error);
			toast("Couldn't delete farmers try again.");
		} finally {
			setIsDeleting(false);
		}
	};

	useEffect(() => {
		const handleViewFarmerEvent = (e: CustomEvent<{ farmer: Farmer }>) => {
			handleViewDetails(e.detail.farmer);
		};

		document.addEventListener('viewFarmer', handleViewFarmerEvent as EventListener);

		return () => {
			document.removeEventListener('viewFarmer', handleViewFarmerEvent as EventListener);
		};
	}, []);

	const selectedCount = Object.keys(rowSelection).length;

	return (
		<div className="mt-6 space-y-4">
			<div className="flex justify-between items-center">
				<div>
					{isAdmin && selectedCount > 0 && (
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">{selectedCount} selected</span>
							<Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} className="h-8">
								<TrashIcon className="mr-2 h-4 w-4" />
								Delete Selected
							</Button>
						</div>
					)}
				</div>
				<ColumnFilter table={table} />
			</div>
			<div className="rounded-md border">
				<ScrollArea className="h-[calc(100vh-350px)]">
					<Table>
						<TableHeader className="sticky top-0 bg-secondary">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<FarmerContextMenu key={row.id} farmer={row.original} onEdit={() => handleEditFarmer(row.original)} isAdmin={isAdmin}>
										<TableRow data-state={row.getIsSelected() && 'selected'} onDoubleClick={() => handleViewDetails(row.original)}>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
											))}
										</TableRow>
									</FarmerContextMenu>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										No farmers found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</ScrollArea>
			</div>

			{viewingFarmer && <FarmerDetailsDialog farmer={viewingFarmer} open={showViewDialog} onOpenChange={setShowViewDialog} />}

			{isAdmin && editingFarmer && <FarmerFormDialog mode="edit" farmer={editingFarmer} open={showEditDialog} onOpenChange={setShowEditDialog} />}

			<AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure you want to delete these farmers?</AlertDialogTitle>
						<AlertDialogDescription>This action cannot be undone. This will permanently delete {selectedCount} farmer records and all their associated data.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
